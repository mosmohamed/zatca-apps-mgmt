#!/usr/bin/env sh
set -eu

cd /var/www/html

echo "[entrypoint] Preparing Laravel runtime directories..."
mkdir -p \
  storage/framework/{cache,sessions,views} \
  storage/logs \
  storage/app/public \
  bootstrap/cache

# Coolify / compose injects env vars; support optional .env file fallback
if [ ! -f .env ] && [ -f .env.example ]; then
  cp .env.example .env
fi

if [ -z "${APP_KEY:-}" ]; then
  if [ -f .env ] && grep -qE '^APP_KEY=$' .env; then
    echo "[entrypoint] Generating APP_KEY..."
    php artisan key:generate --force --no-interaction || true
  fi
fi

echo "[entrypoint] Waiting for database..."
ATTEMPTS=0
MAX_ATTEMPTS="${DB_WAIT_ATTEMPTS:-60}"
until php -r '
$host = getenv("DB_HOST") ?: "127.0.0.1";
$port = getenv("DB_PORT") ?: "3306";
$user = getenv("DB_USERNAME") ?: "root";
$pass = getenv("DB_PASSWORD") ?: "";
$db   = getenv("DB_DATABASE") ?: "";
try {
  new PDO(
    sprintf("mysql:host=%s;port=%s;dbname=%s", $host, $port, $db),
    $user,
    $pass,
    [PDO::ATTR_TIMEOUT => 3]
  );
  exit(0);
} catch (Throwable $e) {
  exit(1);
}
' >/dev/null 2>&1; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ "$ATTEMPTS" -ge "$MAX_ATTEMPTS" ]; then
    echo "[entrypoint] Database is not ready after ${MAX_ATTEMPTS} attempts."
    exit 1
  fi
  sleep 2
done
echo "[entrypoint] Database is ready."

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  echo "[entrypoint] Running migrations..."
  php artisan migrate --force --no-interaction
fi

if [ "${RUN_SEEDERS:-false}" = "true" ]; then
  echo "[entrypoint] Running seeders..."
  php artisan db:seed --force --no-interaction
fi

echo "[entrypoint] Optimizing Laravel caches..."
php artisan storage:link --force --no-interaction >/dev/null 2>&1 || true
php artisan config:cache --no-interaction
php artisan route:cache --no-interaction
php artisan view:cache --no-interaction

chown -R www-data:www-data storage bootstrap/cache
chmod -R ug+rwx storage bootstrap/cache

echo "[entrypoint] Starting supervisord..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
