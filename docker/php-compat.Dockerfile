# syntax=docker/dockerfile:1
# Compatibility CLI image for MySQL / SQL Server migration tests.
# Mirrors production PECL pins so local compat checks match the runtime image.

ARG PHP_IMAGE=php:8.4-cli-bookworm
ARG SQLSRV_EXT_VERSION=5.13.1
ARG PDO_SQLSRV_EXT_VERSION=5.13.1

FROM ${PHP_IMAGE}

ARG SQLSRV_EXT_VERSION
ARG PDO_SQLSRV_EXT_VERSION

ENV DEBIAN_FRONTEND=noninteractive \
    SQLSRV_EXT_VERSION=${SQLSRV_EXT_VERSION} \
    PDO_SQLSRV_EXT_VERSION=${PDO_SQLSRV_EXT_VERSION}

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
    git \
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
    intl \
    mbstring \
    pcntl \
    pdo_mysql \
    zip
EOF

RUN --mount=type=cache,target=/tmp/pear/cache,sharing=locked \
    --mount=type=cache,target=/tmp/pear/download,sharing=locked \
    <<'EOF'
set -eux
mkdir -p /tmp/pear/cache /tmp/pear/download
pear config-set cache_dir /tmp/pear/cache
pear config-set download_dir /tmp/pear/download
pecl channel-update pecl.php.net
pecl install "sqlsrv-${SQLSRV_EXT_VERSION}"
test -f "$(php-config --extension-dir)/sqlsrv.so"
docker-php-ext-enable sqlsrv
pecl install "pdo_sqlsrv-${PDO_SQLSRV_EXT_VERSION}"
test -f "$(php-config --extension-dir)/pdo_sqlsrv.so"
docker-php-ext-enable pdo_sqlsrv
php -r 'foreach (["sqlsrv","pdo_sqlsrv","pdo_mysql"] as $e) { if (!extension_loaded($e)) { fwrite(STDERR, "Missing: $e\n"); exit(1);} }'
EOF

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /app
