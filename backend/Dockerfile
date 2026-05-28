FROM php:8.3-fpm-alpine

# Install system dependencies and PHP extensions
RUN apk add --no-cache \
    git \
    curl \
    libpng-dev \
    libxml2-dev \
    zip \
    unzip \
    oniguruma-dev \
    libzip-dev

RUN docker-php-ext-install pdo pdo_mysql mbstring exif pcntl bcmath gd zip

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/backend

# Copy existing application directory contents
COPY . /var/www/backend

# Set folder permissions
RUN chown -R www-data:www-data /var/www/backend/storage /var/www/backend/bootstrap/cache

# Expose port 9000
EXPOSE 9000

CMD ["php-fpm"]
