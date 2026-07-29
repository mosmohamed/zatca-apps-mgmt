# syntax=docker/dockerfile:1
#
# Cache-friendly multi-stage production image:
#   1) php-extensions  — system packages + compiled PHP extensions (rarely changes)
#   2) vendor-build    — Composer deps from composer.lock only
#   3) frontend-deps   — npm ci from package-lock only
#   4) frontend-build  — Vite production build
#   5) runtime         — nginx/supervisor + app artifacts
#
# Pin PECL SQL Server drivers to PHP 8.4-compatible releases (5.13.x).
# Install redis / sqlsrv / pdo_sqlsrv separately and verify .so files before enable.

ARG PHP_IMAGE=php:8.4-fpm-bookworm
ARG NODE_IMAGE=node:22-alpine
ARG REDIS_EXT_VERSION=6.2.0
ARG SQLSRV_EXT_VERSION=5.13.1
ARG PDO_SQLSRV_EXT_VERSION=5.13.1

############################
# Stage 1: PHP extensions base
############################
FROM ${PHP_IMAGE} AS php-extensions

ARG REDIS_EXT_VERSION
ARG SQLSRV_EXT_VERSION
ARG PDO_SQLSRV_EXT_VERSION

ENV DEBIAN_FRONTEND=noninteractive \
    COMPOSER_ALLOW_SUPERUSER=1 \
    REDIS_EXT_VERSION=${REDIS_EXT_VERSION} \
    SQLSRV_EXT_VERSION=${SQLSRV_EXT_VERSION} \
    PDO_SQLSRV_EXT_VERSION=${PDO_SQLSRV_EXT_VERSION}

# Build + runtime libraries. Build-only packages are purged after compilation.
# Quoted heredoc avoids Dockerfile $ escaping issues; shell expands $PHPIZE_DEPS.
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    <<'EOF'
set -eux
rm -f /etc/apt/apt.conf.d/docker-clean
echo 'Binary::apt::APT::Keep-Downloaded-Packages "true";' > /etc/apt/apt.conf.d/keep-cache
apt-get update
apt-get install -y --no-install-recommends \
    $PHPIZE_DEPS \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    unzip \
    libicu-dev \
    libzip-dev \
    libpng-dev \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    libonig-dev \
    libxml2-dev \
    unixodbc-dev \
    libicu72 \
    libzip4 \
    libpng16-16 \
    libjpeg62-turbo \
    libfreetype6 \
    libonig5 \
    unixodbc
curl -fsSL https://packages.microsoft.com/keys/microsoft.asc \
    | gpg --dearmor -o /usr/share/keyrings/microsoft-prod.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft-prod.gpg] https://packages.microsoft.com/debian/12/prod bookworm main" \
    > /etc/apt/sources.list.d/mssql-release.list
apt-get update
ACCEPT_EULA=Y apt-get install -y --no-install-recommends msodbcsql18
docker-php-ext-configure gd --with-freetype --with-jpeg
docker-php-ext-install -j"$(nproc)" \
    bcmath \
    exif \
    gd \
    intl \
    mbstring \
    opcache \
    pcntl \
    pdo_mysql \
    zip
EOF

# PECL extensions — install one at a time so failures are obvious.
# sqlsrv / pdo_sqlsrv must be >= 5.13.0 for PHP 8.4.
RUN --mount=type=cache,target=/tmp/pear/cache,sharing=locked \
    --mount=type=cache,target=/tmp/pear/download,sharing=locked \
    <<'EOF'
set -eux
mkdir -p /tmp/pear/cache /tmp/pear/download
pear config-set cache_dir /tmp/pear/cache
pear config-set download_dir /tmp/pear/download
pecl channel-update pecl.php.net

echo "Installing redis-${REDIS_EXT_VERSION}..."
pecl install "redis-${REDIS_EXT_VERSION}"
test -f "$(php-config --extension-dir)/redis.so"
docker-php-ext-enable redis

echo "Installing sqlsrv-${SQLSRV_EXT_VERSION}..."
pecl install "sqlsrv-${SQLSRV_EXT_VERSION}"
test -f "$(php-config --extension-dir)/sqlsrv.so"
docker-php-ext-enable sqlsrv

echo "Installing pdo_sqlsrv-${PDO_SQLSRV_EXT_VERSION}..."
pecl install "pdo_sqlsrv-${PDO_SQLSRV_EXT_VERSION}"
test -f "$(php-config --extension-dir)/pdo_sqlsrv.so"
docker-php-ext-enable pdo_sqlsrv

php -m | tee /tmp/php-modules.txt
for ext in redis sqlsrv pdo_sqlsrv pdo_mysql gd intl zip pcntl; do
  php -r "if (!extension_loaded('${ext}')) { fwrite(STDERR, \"Missing extension: ${ext}\\n\"); exit(1); }"
  grep -qiE "^${ext}$" /tmp/php-modules.txt
done
rm -f /tmp/php-modules.txt
EOF

# Drop compilers / headers; keep runtime libs and Microsoft ODBC.
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    <<'EOF'
set -eux
apt-get purge -y --auto-remove -o APT::AutoRemove::RecommendsImportant=false \
    $PHPIZE_DEPS \
    apt-transport-https \
    gnupg \
    libicu-dev \
    libzip-dev \
    libpng-dev \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    libonig-dev \
    libxml2-dev \
    unixodbc-dev
apt-get update
ACCEPT_EULA=Y apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    unzip \
    libicu72 \
    libzip4 \
    libpng16-16 \
    libjpeg62-turbo \
    libfreetype6 \
    libonig5 \
    unixodbc \
    msodbcsql18
php -r 'foreach (["redis","sqlsrv","pdo_sqlsrv","pdo_mysql","gd","intl","zip","pcntl"] as $e) { if (!extension_loaded($e)) { fwrite(STDERR, "Missing after purge: $e\n"); exit(1);} }'
EOF


############################
# Stage 2: Composer dependencies
############################
FROM php-extensions AS vendor-build

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app

ENV COMPOSER_HOME=/tmp/composer \
    COMPOSER_CACHE_DIR=/tmp/composer/cache

COPY backend/composer.json backend/composer.lock ./

# Platform extensions exist in php-extensions — no broad --ignore-platform-reqs.
RUN --mount=type=cache,target=/tmp/composer/cache,sharing=locked \
    <<'EOF'
set -eux
composer install \
    --no-dev \
    --no-interaction \
    --no-progress \
    --prefer-dist \
    --optimize-autoloader \
    --no-scripts
EOF


############################
# Stage 3: Frontend dependencies
############################
FROM ${NODE_IMAGE} AS frontend-deps

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./

RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm ci


############################
# Stage 4: Frontend production build
############################
FROM frontend-deps AS frontend-build

COPY frontend/ ./

# Same-origin API path behind nginx
ENV VITE_API_BASE_URL=/api/v1

RUN --mount=type=cache,target=/root/.npm,sharing=locked \
    npm run build


############################
# Stage 5: Production runtime
############################
FROM php-extensions AS runtime

LABEL org.opencontainers.image.title="ZATCA IT Portfolio" \
      org.opencontainers.image.description="Laravel API + React SPA" \
      org.opencontainers.image.source="https://github.com/mosmohamed/zatca-apps-mgmt"

# Runtime process managers (not needed while compiling extensions).
RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    <<'EOF'
set -eux
rm -f /etc/apt/apt.conf.d/docker-clean
apt-get update
apt-get install -y --no-install-recommends \
    nginx \
    supervisor
rm -f /etc/nginx/sites-enabled/default
EOF

# PHP / FPM / nginx / supervisor configuration
COPY docker/php/php.ini /usr/local/etc/php/conf.d/99-production.ini
COPY docker/php/www.conf /usr/local/etc/php-fpm.d/www.conf
COPY docker/nginx/nginx.conf /etc/nginx/nginx.conf
COPY docker/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod +x /usr/local/bin/entrypoint.sh \
    && mkdir -p /var/log/supervisor /var/www/frontend \
    && chown -R www-data:www-data /var/www

WORKDIR /var/www/html

# Vendor first (changes only when composer.lock changes)
COPY --from=vendor-build --chown=www-data:www-data /app/vendor ./vendor

# SPA build served by nginx (changes with frontend source)
COPY --from=frontend-build --chown=www-data:www-data /app/frontend/dist /var/www/frontend

# Application source last — does not invalidate PHP extension or Composer layers
COPY --chown=www-data:www-data backend/ ./

# Ensure writable dirs exist for first boot + verify extensions in final image
RUN <<'EOF'
set -eux
mkdir -p \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    storage/app/public \
    bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
find storage bootstrap/cache -type d -exec chmod 775 {} \;
find storage bootstrap/cache -type f -exec chmod 664 {} \;
php -m | tee /tmp/php-modules-final.txt
for ext in redis sqlsrv pdo_sqlsrv pdo_mysql gd intl zip pcntl; do
  php -r "if (!extension_loaded('${ext}')) { fwrite(STDERR, \"Missing extension in final image: ${ext}\\n\"); exit(1); }"
  grep -qiE "^${ext}$" /tmp/php-modules-final.txt
done
rm -f /tmp/php-modules-final.txt
EOF

# Runtime-only settings (placed after expensive layers so they do not affect them)
ENV APP_ENV=production \
    APP_DEBUG=false \
    LOG_CHANNEL=stderr \
    PHP_OPCACHE_ENABLE=1 \
    DEBIAN_FRONTEND=noninteractive

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=5 \
  CMD curl -fsS http://127.0.0.1/up || exit 1

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
