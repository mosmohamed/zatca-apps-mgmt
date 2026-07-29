# Docker production build

## Failure cause (sqlsrv.so missing)

The previous runtime stage ran:

```bash
pecl install redis sqlsrv pdo_sqlsrv
docker-php-ext-enable redis sqlsrv pdo_sqlsrv
```

On **PHP 8.4**, Microsoft’s drivers need **`sqlsrv` / `pdo_sqlsrv` ≥ 5.13.0**. Unpinned `pecl install` could resolve an older release (for example 5.12.x) that does **not** compile against PHP 8.4. In that situation:

1. `sqlsrv.so` is never produced (or only partially installed).
2. A combined PECL install makes it hard to see *which* package failed.
3. `docker-php-ext-enable … sqlsrv …` then fails because `sqlsrv.so` is missing.

## Extension versions selected

| Extension | Version | Reason |
|-----------|---------|--------|
| `redis` | **6.2.0** | Stable phpredis with PHP 8.4 support |
| `sqlsrv` | **5.13.1** | First stable line with full PHP 8.4 (+ 8.5) support |
| `pdo_sqlsrv` | **5.13.1** | Same release line as `sqlsrv` (required pair for Microsoft drivers) |

### Does Laravel need both SQLSRV extensions?

- **Required for Laravel PDO:** `pdo_sqlsrv` only (Illuminate uses the PDO `sqlsrv` driver).
- **Also installed:** `sqlsrv` (procedural API). Kept because project docs and the Microsoft driver distribution treat them as a pair, and MSSQL compatibility tooling expects both. Failures are not ignored.

## Dockerfile layout (cache-friendly)

| Stage | Purpose | Invalidated when |
|-------|---------|------------------|
| `php-extensions` | APT packages, `docker-php-ext-install`, pinned PECL builds, `.so` verification, purge of build-only packages | Base PHP image / Dockerfile extension block / PECL pins change |
| `vendor-build` | `composer install` from `composer.json` + `composer.lock` only | Composer lockfile changes |
| `frontend-deps` | `npm ci` from `package.json` + `package-lock.json` only | Frontend lockfile changes |
| `frontend-build` | Vite production build | Frontend source or deps change |
| `runtime` | nginx, supervisor, configs, vendor, SPA, backend source | App/config/frontend artifacts change |

BuildKit cache mounts are used for APT, PECL (`/tmp/pear/cache`, `/tmp/pear/download`), Composer, and npm.

`APP_ENV=production` is set **late** on the runtime stage so it is a runtime default and does not sit above the expensive extension layers. Database credentials, `APP_KEY`, and other secrets are **not** Docker build args.

Composer runs **without** broad `--ignore-platform-reqs` because `vendor-build` inherits the `php-extensions` image (extensions already present).

## Expected cache behavior

| Change | Cached | Rebuilds |
|--------|--------|----------|
| Backend PHP/TS-free source only | `php-extensions`, `vendor-build`, `frontend-deps`, `frontend-build` | Final `COPY backend/` + small runtime `RUN` |
| One frontend source file | `php-extensions`, `vendor-build`, `frontend-deps` | `frontend-build` + runtime copy of SPA |
| `composer.lock` | `php-extensions`, frontend stages | `vendor-build` + runtime vendor copy |
| PECL pin / PHP Dockerfile block | — | `php-extensions` and everything depending on it |

## Coolify

Use a normal deploy so BuildKit layer cache is reused. Do **not** enable **Force Rebuild (no cache)** / `docker build --no-cache` for routine pushes—only when intentionally discarding cache.

## Verification commands

```bash
# First / full build (timing baseline)
docker build --progress=plain -t zatca-it-portfolio:latest .

# Compose build
docker compose build

# Modules inside the final image
docker run --rm --entrypoint php zatca-it-portfolio:latest -m

# Second build with no source changes (extensions should be CACHED)
docker build --progress=plain -t zatca-it-portfolio:latest .

# After a frontend-only edit, confirm php-extensions + vendor stay cached
docker build --progress=plain -t zatca-it-portfolio:latest .

# Host-side checks (not inside the image)
cd frontend && npm run build
cd ../backend && composer validate
```

## Build timing (verified locally, Docker Desktop 29.1.3 / BuildKit)

| Run | Duration | Notes |
|-----|----------|-------|
| First build | **271.3 s (~4.5 min)** | Cold layers; compiled core PHP extensions + pinned PECL (`redis` / `sqlsrv` / `pdo_sqlsrv`) |
| Second build (no source changes) | **6.9 s** | `php-extensions`, Composer, and frontend stages reported **CACHED** |
| Build after one frontend file change | **20.3 s** | `php-extensions` + `vendor-build` + `frontend-deps` **CACHED**; `frontend-build` re-ran |
| `docker compose build` (warm cache) | **23 s** | Image already present; layers cached |

Wall-clock times from `--progress=plain` on the build host (Windows + Docker Desktop). Coolify/Linux builders will vary but the cache split is the same.
