FROM node:24-bookworm-slim AS frontend
WORKDIR /app/client
COPY client/package.json client/package-lock.json ./
RUN npm ci --include=dev
COPY client/ ./
RUN npm run build

FROM php:8.5-apache-bookworm

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates git unzip libpq-dev libonig-dev libicu-dev libzip-dev \
    && docker-php-ext-install -j$(nproc) pdo_pgsql mbstring intl zip bcmath \
    && a2enmod rewrite \
    && sed -i 's|/var/www/html|/var/www/html/public|g; s/\*:80/*:${PORT}/g' /etc/apache2/sites-available/000-default.conf \
    && printf 'Listen ${PORT}\n' > /etc/apache2/ports.conf \
    && printf '<Directory /var/www/html/public>\nAllowOverride All\nRequire all granted\n</Directory>\n' > /etc/apache2/conf-available/chromameal.conf \
    && a2enconf chromameal \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer
WORKDIR /var/www/html
COPY server/ ./
RUN composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader \
    && mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs \
    && chown -R www-data:www-data storage bootstrap/cache

COPY --from=frontend /app/client/dist/ ./public/
RUN mv public/index.html public/spa.html
COPY docker/start.sh /usr/local/bin/chromameal-start
RUN sed -i 's/\r$//' /usr/local/bin/chromameal-start \
    && chmod +x /usr/local/bin/chromameal-start

ENV APP_ENV=production \
    APP_DEBUG=false \
    PORT=10000 \
    LOG_CHANNEL=stderr \
    DB_CONNECTION=pgsql \
    DB_SSLMODE=require \
    SESSION_DRIVER=database \
    SESSION_SECURE_COOKIE=true \
    CACHE_STORE=database \
    QUEUE_CONNECTION=sync

EXPOSE 10000
ENTRYPOINT ["chromameal-start"]
