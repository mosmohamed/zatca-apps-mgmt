# Database engine compatibility (MySQL and Microsoft SQL Server)

This application is designed to run on **MySQL 8+** or **Microsoft SQL Server 2019+**
by changing environment configuration only (no application code changes).

## Supported connections

| `DB_CONNECTION` | Engine | Default port | PHP extension |
|-----------------|--------|--------------|---------------|
| `mysql` | MySQL 8.0+ / MariaDB 10.6+ | `3306` | `pdo_mysql` |
| `mariadb` | MariaDB | `3306` | `pdo_mysql` |
| `sqlsrv` | Microsoft SQL Server 2019+ | `1433` | `pdo_sqlsrv` + `sqlsrv` + ODBC Driver 18 |

SQLite is supported for automated tests only (`phpunit.xml`).

## MySQL environment

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=it_portfolio_system
DB_USERNAME=root
DB_PASSWORD=
DB_CHARSET=utf8mb4
DB_COLLATION=utf8mb4_unicode_ci
# Optional TLS:
# MYSQL_ATTR_SSL_CA=/path/to/ca.pem
```

Fresh install:

```bash
php artisan migrate:fresh --seed --force
```

## Microsoft SQL Server environment

```env
DB_CONNECTION=sqlsrv
DB_HOST=127.0.0.1
DB_PORT=1433
DB_DATABASE=it_portfolio_system
DB_USERNAME=sa
DB_PASSWORD=Your_strong_Password123
DB_CHARSET=utf8
DB_ENCRYPT=yes
DB_TRUST_SERVER_CERTIFICATE=true
```

Notes:

- Create an empty database first (`CREATE DATABASE it_portfolio_system;`).
- For local/dev TLS with self-signed certs, set `DB_TRUST_SERVER_CERTIFICATE=true`.
- Production should use a trusted certificate and prefer `DB_TRUST_SERVER_CERTIFICATE=false`.
- PHP requires the **Microsoft ODBC Driver 18 for SQL Server** and the `sqlsrv` / `pdo_sqlsrv` PECL extensions.
- The production Docker image installs these extensions so the same container can target MySQL or MSSQL.

Fresh install:

```bash
php artisan migrate:fresh --seed --force
```

## How uniqueness of open assignments is enforced

Business rule: **one open assignment per (application, user)**.

| Engine | Implementation |
|--------|----------------|
| MySQL / MariaDB / SQLite | Generated column `open_key` + unique `(application_id, open_key)` (NULLs are distinct) |
| SQL Server | Filtered unique index on `(application_id, user_id) WHERE ended_at IS NULL` |

Implemented in `database/support/OpenAssignmentConstraint.php`.

## Unsigned integers

Laravel `unsignedInteger` / `unsignedBigInteger` columns map to **signed** types on SQL Server
(no UNSIGNED). Counters such as license quantities remain non-negative via Form Request validation.

## JSON columns

`activity_log.properties` and `activity_log.attribute_changes` use Laravel `json()` columns.
On SQL Server they are stored as `nvarchar(max)`; Spatie Activitylog encodes/decodes in PHP.
No engine-specific JSON SQL functions are used in application services.

## Switching engines

1. Point `DB_*` to the target engine.
2. Ensure the PHP extension for that engine is loaded.
3. Run `php artisan config:clear`.
4. Run `php artisan migrate --force` (or `migrate:fresh --seed` for empty databases).

Do not point a non-empty MySQL schema at MSSQL (or vice versa) and expect automatic conversion.
Use a fresh migrate + seed, or a dedicated data migration tool.

## Verification checklist

After migrate + seed on either engine:

- [ ] `migrations` table lists all migrations
- [ ] Core tables exist: `users`, `applications`, `application_assignments`, `licenses`, Spatie permission tables, `activity_log`
- [ ] Foreign keys resolve (seeders complete without FK errors)
- [ ] Login works with `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD`
- [ ] Creating a second open assignment for the same application+user is rejected (unique constraint)

### Local verification commands

**MySQL**

```bash
# create empty database, then:
DB_CONNECTION=mysql DB_DATABASE=it_portfolio_compat_mysql \
  php artisan migrate:fresh --seed --force
```

**SQL Server** (requires Docker Desktop + `pdo_sqlsrv`)

```bash
docker compose -f docker-compose.db-compat.yml up -d mssql-compat
docker compose -f docker-compose.db-compat.yml --profile tools build php-compat
docker compose -f docker-compose.db-compat.yml --profile tools run --rm php-compat \
  bash -lc 'composer install --no-interaction && \
    export DB_CONNECTION=sqlsrv DB_HOST=mssql-compat DB_PORT=1433 \
      DB_DATABASE=master DB_USERNAME=sa DB_PASSWORD=Your_strong_Password123 \
      DB_ENCRYPT=yes DB_TRUST_SERVER_CERTIFICATE=true \
      CACHE_STORE=array SESSION_DRIVER=array QUEUE_CONNECTION=sync && \
    php -r "new PDO(\"sqlsrv:Server=mssql-compat,1433;Database=master;TrustServerCertificate=1\", \"sa\", \"Your_strong_Password123\")->exec(\"IF DB_ID(\\\"it_portfolio_compat\\\") IS NULL CREATE DATABASE it_portfolio_compat\");" && \
    export DB_DATABASE=it_portfolio_compat && \
    php artisan migrate:fresh --seed --force'
```

Automated unit coverage for the MSSQL filtered-index SQL is in
`tests/Unit/OpenAssignmentConstraintTest.php`.
