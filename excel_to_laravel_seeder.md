# Excel to Laravel Seeder

Standalone Python generator. It reads two Excel files and writes a Laravel seeder that already contains the imported data. The seeder never reads Excel.

```text
Users.xlsx + Applications.xlsx
        ↓
python excel_to_laravel_seeder.py
        ↓
ImportedPortfolioSeeder.php
        ↓
php artisan db:seed --class=ImportedPortfolioSeeder
```

## Install

```bash
pip install openpyxl mysql-connector-python
```

`openpyxl` is required. `mysql-connector-python` is optional but recommended so the generator can inspect the live MySQL schema in read-only mode.

## Run

```bash
python excel_to_laravel_seeder.py users.xlsx applications.xlsx
```

```bash
python excel_to_laravel_seeder.py users.xlsx applications.xlsx --output ImportedPortfolioSeeder.php
```

```bash
python excel_to_laravel_seeder.py users.xlsx applications.xlsx --output backend/database/seeders/ImportedPortfolioSeeder.php --report migration_report.txt
```

The script verifies that both files exist, that the applications workbook has a `PHASE2` sheet, and that PHASE2 headers match `B1:Q1`.

The Users workbook is located by headers (`id`, `Display Name`, `Email`, `Applications`, `Phone Number`), preferably at `B2:F2`. The sheet name does not have to be specific.

## Outputs

| File | Purpose |
|---|---|
| `ImportedPortfolioSeeder.php` | Self-contained Laravel seeder with PHP arrays |
| `migration_report.txt` | Row counts, merges, generated emails, collisions, placeholders, skipped rows |
| `migration_report.json` | Machine-readable copy of the same stats |

Copy the PHP file into `backend/database/seeders` if you did not write it there, then:

```bash
php artisan db:seed --class=ImportedPortfolioSeeder
```

## What the seeder does

- Creates or updates users with `firstOrCreate` / fill-in of missing fields
- Hashes static and imported passwords with `Hash::make('password')`
- Always includes `super_admin`, `infra_admin`, `sd_admin`, and `viewer`
- Looks up departments, application types, vendors, statuses, and app roles by name
- Maps `Other Apps` to application type `Internal App`
- Creates applications from the PHASE2 sheet only
- Assigns a Users-sheet person to an application only when that app name exists in PHASE2
- If a Users-sheet application name does not match PHASE2, the user is still created and that assignment is skipped
- Assigns PHASE2 Support / ZATCA Management / Application Lead using existing `app_roles`
- Syncs management owners and app leads onto `application_business_owners` and `application_technical_owners`
- Uses `syncWithoutDetaching` for technologies
- Never truncates, deletes, or wipes data
- Never hardcodes database IDs

## MySQL inspection

Default connection (read-only):

```text
host=127.0.0.1
port=3306
database=it_portfolio_system
username=root
password=
```

Override with `--db-host`, `--db-port`, `--db-database`, `--db-username`, `--db-password`. Use `--skip-db` if MySQL is unavailable.

The generator only runs `SHOW` / `SELECT`. It does not insert, update, or delete database rows.
