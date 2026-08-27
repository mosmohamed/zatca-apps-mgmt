# Excel Portfolio Import

## Feature Name
Excel to Laravel portfolio import

## Purpose
One-time conversion of a Users + PHASE2 Excel workbook into a self-contained Laravel seeder. Runtime seeding never reads Excel.

## Workflow
```text
Excel Workbook
      ↓
python excel_to_laravel_seeders.py data.xlsx
      ↓
backend/database/seeders/ImportedPortfolioSeeder.php
      ↓
php artisan db:seed --class=ImportedPortfolioSeeder
```

## Database Changes
Nullable application portfolio fields:

- `applications.description`
- `applications.technical_category`
- `applications.vendor_id`
- `applications.remarks`

## Mapping
| Excel | Laravel |
|---|---|
| Display Name | `users.first_name` / `users.last_name` |
| Email | `users.email` |
| Phone Number | `users.phone` |
| App Names | `applications.name_en` / `name_ar` |
| Other Apps | Application type `Internal App` |
| Customs | Application type `Customs` |
| Technical Category | `applications.technical_category` |
| App Description | `applications.description` |
| Live | `application_statuses` Active / Maintenance |
| under Operation | `support_types` Business Hours / Best Effort |
| Vendor Name | `vendors` + `applications.vendor_id` |
| Stack and Technologies | `technologies` via `application_technology` |
| Remarks | `applications.remarks` |
| Support Name | `application_assignments` with AppRole `Support` |
| Zatca Management Owner | assignment AppRole `ZATCA Management` + `application_business_owners` |
| Zatca App Lead | assignment AppRole `Application Lead` + `application_technical_owners` |

## Permissions / Roles
Spatie roles created if missing: `super_admin`, `infra_admin`, `sd_admin`, `viewer`, `employee`.

Imported employees receive `employee`. Static admin/viewer accounts receive their named roles.

`DatabaseSeeder` uses `ImportedPortfolioSeeder` as the sole source for portfolio tables
(`users`, `app_roles`, `departments`, `vendors`, `technologies`, `applications`,
`application_assignments`). These overlapping seeders are disabled in `DatabaseSeeder`:

- `AppRoleSeeder`
- `DepartmentSeeder`
- `TechnologySeeder`
- `VendorSeeder`
- `SuperAdminSeeder`
- `ViewerSeeder`
- `LegacyApplicationImportSeeder`

Lookup masters still run first: permissions, environments, settings, application types,
support types, criticalities, application statuses, job titles.

