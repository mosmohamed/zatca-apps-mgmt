#!/usr/bin/env sh
set -eu

cd /var/www/html

echo "[entrypoint] Preparing Laravel runtime directories..."
mkdir -p \
  storage/framework/cache \
  storage/framework/sessions \
  storage/framework/views \
  storage/logs \
  storage/app/public \
  bootstrap/cache

# Coolify / compose injects env vars; support optional .env file fallback
if [ ! -f .env ] && [ -f .env.example ]; then
  cp .env.example .env
fi

# Prefer Coolify-injected APP_KEY. If missing, generate without booting Artisan.
if [ -z "${APP_KEY:-}" ]; then
  echo "[entrypoint] APP_KEY is empty — generating one..."
  GENERATED_KEY="base64:$(php -r 'echo base64_encode(random_bytes(32));')"
  export APP_KEY="${GENERATED_KEY}"
  if [ -f .env ]; then
    if grep -qE '^APP_KEY=' .env; then
      # Replace empty or existing APP_KEY line
      sed -i "s|^APP_KEY=.*|APP_KEY=${GENERATED_KEY}|" .env
    else
      printf '\nAPP_KEY=%s\n' "${GENERATED_KEY}" >> .env
    fi
  fi
  echo "[entrypoint] APP_KEY set for this container lifetime. Persist it in Coolify env vars."
fi

DB_HOST_VALUE="${DB_HOST:-}"
DB_PORT_VALUE="${DB_PORT:-3306}"
DB_DATABASE_VALUE="${DB_DATABASE:-}"

if [ -z "${DB_HOST_VALUE}" ]; then
  echo "[entrypoint] ERROR: DB_HOST is not set."
  echo "[entrypoint] In Coolify, set DB_HOST to your MySQL resource hostname (same Docker network)."
  exit 1
fi

echo "[entrypoint] Waiting for database at ${DB_HOST_VALUE}:${DB_PORT_VALUE}/${DB_DATABASE_VALUE}..."
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
  fwrite(STDERR, $e->getMessage() . PHP_EOL);
  exit(1);
}
' 2>/tmp/db-wait.err; do
  ATTEMPTS=$((ATTEMPTS + 1))
  if [ "$ATTEMPTS" -ge "$MAX_ATTEMPTS" ]; then
    echo "[entrypoint] Database is not ready after ${MAX_ATTEMPTS} attempts."
    echo "[entrypoint] Last PDO error:"
    cat /tmp/db-wait.err || true
    echo "[entrypoint] Verify Coolify env: DB_HOST, DB_PORT, DB_DATABASE, DB_USERNAME, DB_PASSWORD"
    echo "[entrypoint] App and MySQL must share the same Coolify network."
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
