Deployment Guide1. Backend Deployment (Laravel)Ensure the server meets Laravel 13 PHP requirements (PHP 8.4+).# Install dependencies optimized for production
composer install --optimize-autoloader --no-dev

# Run Migrations and Seeders
php artisan migrate --force
php artisan db:seed --class=DatabaseSeeder --force

# Cache Configurations & Routes
php artisan config:cache
php artisan event:cache
php artisan route:cache
php artisan view:cache

# Set permissions
chmod -R 775 storage bootstrap/cache
2. Frontend Deployment (React)# Build the application
npm run build

# Deploy the output
# The resulting /dist folder should be served via Nginx or a static host (Vercel/Netlify).
Nginx Configuration: Ensure SPA routing fallback is active: try_files $uri $uri/ /index.html;