# syntax=docker/dockerfile:1.7

############################
# Stage 1: Frontend build
############################
FROM node:22-alpine AS frontend-build

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend/ ./
# Same-origin API path behind nginx
ENV VITE_API_BASE_URL=/api/v1
RUN npm run build


############################
# Stage 2: PHP Composer deps
############################
# Extensions are installed in the runtime stage; ignore platform checks here.
FROM composer:2 AS vendor-build

WORKDIR /app

ENV COMPOSER_ALLOW_SUPERUSER=1 \
    COMPOSER_HOME=/tmp/composer

COPY backend/composer.json backend/composer.lock ./
RUN composer install \
    --no-dev \
    --no-interaction \
    --no-progress \
    --prefer-dist \
    --optimize-autoloader \
    --no-scripts \
    --ignore-platform-reqs


############################
# Stage 3: Production runtime
############################
# Symfony 8 (via Laravel 13 lockfile) requires PHP >= 8.4.1
FROM php:8.4-fpm-bookworm AS runtime

LABEL org.opencontainers.image.title="ZATCA IT Portfolio" \
      org.opencontainers.image.description="Laravel API + React SPA" \
      org.opencontainers.image.source="https://github.com/mosmohamed/zatca-apps-mgmt"

ENV APP_ENV=production \
    APP_DEBUG=false \
    LOG_CHANNEL=stderr \
    PHP_OPCACHE_ENABLE=1

# System packages + PHP extensions
RUN apt-get update && apt-get install -y --no-install-recommends \
        curl \
        gnupg \
        apt-transport-https \
        git \
        unzip \
        nginx \
        supervisor \
        libicu-dev \
        libzip-dev \
        libpng-dev \
        libjpeg62-turbo-dev \
        libfreetype6-dev \
        libonig-dev \
        libxml2-dev \
        unixodbc-dev \
    && curl -fsSL https://packages.microsoft.com/keys/microsoft.asc \
        | gpg --dearmor -o /usr/share/keyrings/microsoft-prod.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft-prod.gpg] https://packages.microsoft.com/debian/12/prod bookworm main" \
        > /etc/apt/sources.list.d/mssql-release.list \
    && apt-get update \
    && ACCEPT_EULA=Y apt-get install -y --no-install-recommends msodbcsql18 \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install -j"$(nproc)" \
        bcmath \
        exif \
        gd \
        intl \
        mbstring \
        opcache \
        pcntl \
        pdo_mysql \
        zip \
    && pecl install redis sqlsrv pdo_sqlsrv \
    && docker-php-ext-enable redis sqlsrv pdo_sqlsrv \
    && rm -rf /var/lib/apt/lists/* \
    && rm -f /etc/nginx/sites-enabled/default

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

# Application code (backend)
COPY --chown=www-data:www-data backend/ ./
COPY --from=vendor-build --chown=www-data:www-data /app/vendor ./vendor

# SPA build served by nginx
COPY --from=frontend-build --chown=www-data:www-data /app/frontend/dist /var/www/frontend

# Ensure writable dirs exist for first boot
RUN mkdir -p \
        storage/framework/cache/data \
        storage/framework/sessions \
        storage/framework/views \
        storage/logs \
        storage/app/public \
        bootstrap/cache \
    && chown -R www-data:www-data storage bootstrap/cache \
    && find storage bootstrap/cache -type d -exec chmod 775 {} \; \
    && find storage bootstrap/cache -type f -exec chmod 664 {} \;

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=5 \
  CMD curl -fsS http://127.0.0.1/up || exit 1

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
