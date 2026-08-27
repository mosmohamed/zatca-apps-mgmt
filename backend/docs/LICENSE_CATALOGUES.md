# License Catalogues (Apps / Infrastructure / Service Desk)

## Purpose

Licenses are tracked by three fully independent catalogues that never share rows:

| Catalogue | Table | Permission prefix | Export key |
|---|---|---|---|
| Apps licenses (the original module) | `licenses` | `licenses` | `licenses` |
| Infrastructure licenses | `infra_licenses` | `infra-licenses` | `infra-licenses` |
| Service Desk licenses | `service_desk_licenses` | `service-desk-licenses` | `service-desk-licenses` |

The existing `licenses` table, `License` model and `licenses.*` permissions were kept as-is and
are now labelled "Apps Licenses" in exports and reports. Nothing was renamed, so existing rows,
role assignments and saved permission matrices continue to work untouched.

## Database changes

Two new tables with the same schema as `licenses` (including soft deletes, the searchable
composite index on `publisher, name, product`, and the indexed `end_date`):

- `2026_08_27_100000_create_infra_licenses_table.php`
- `2026_08_27_100100_create_service_desk_licenses_table.php`

Plus `2026_08_27_100200_add_login_default_credentials_settings.php`, which seeds the three
`login_default_*` settings rows if they are missing (existing values are never overwritten).

`available` is never trusted from the client. It is always recomputed server-side as
`max(0, licensed - used)` for all three catalogues.

## API endpoints

All endpoints sit under `/api/v1` behind `auth:sanctum`.

| Method | Endpoint | Permission |
|---|---|---|
| `GET` | `/infra-licenses` | `infra-licenses.view` |
| `GET` | `/infra-licenses/statistics` | `infra-licenses.view` |
| `POST` | `/infra-licenses` | `infra-licenses.create` |
| `GET` | `/infra-licenses/{infra_license}` | `infra-licenses.view` |
| `PUT`/`PATCH` | `/infra-licenses/{infra_license}` | `infra-licenses.update` |
| `DELETE` | `/infra-licenses/{infra_license}` | `infra-licenses.delete` |
| `POST` | `/exports/infra-licenses` | `infra-licenses.export` |

The `service-desk-licenses` routes mirror this table exactly with the
`service-desk-licenses.*` permissions and a `{service_desk_license}` route parameter.

Index endpoints support the standard `?page`, `?per_page`, `?search`, `?sort` contract plus the
license-specific `?environment=` and `?status=active|expiring_soon|expired` filters.

## Permissions

`PermissionSeeder` is idempotent (`Permission::findOrCreate`) and now also creates
`infra-licenses.*`, `service-desk-licenses.*`, `applications-details.*` and
`assignments.export`. `super_admin` receives every permission; `employee` receives the `view`
permission of each new module in addition to its previous set.

`ApplicationPolicy` no longer overrides `viewAny`/`view` to return `true`. Application main-data
access now requires `applications.view` like every other entity, so the permission matrix is the
only thing that decides who can read applications.

## Dashboard

`DashboardService` returns one usage chart per catalogue, each with the same
`licensed` / `used` / `available` slices:

- `charts.license_usage` (Apps)
- `charts.infra_license_usage`
- `charts.service_desk_license_usage`

Each chart is gated independently by the matching `.view` permission in `filterForActor()`, so a
user who can only see Apps licenses receives `[]` for the other two. The status-distribution and
by-environment charts remain Apps-only.

`DashboardWidgets::keys()` and `DashboardWidgetLayout` defaults were extended with
`infra_license_usage` and `service_desk_license_usage` (desktop span 2 each), so the widgets are
toggleable per role and configurable like the existing ones.

## Login screen default credentials

Three public settings let the login page advertise a read-only demo account:

| Key | Type | Default |
|---|---|---|
| `login_default_credentials_enabled` | `boolean` | `true` |
| `login_default_email` | `string` | `viewer@zatca.gov.sa` |
| `login_default_password` | `string` | `password` |

They are `is_public`, so `GET /api/v1/settings/public` returns them without authentication.
Writing them is restricted: `UpdateSettingsRequest::authorize()` requires `settings.update` for
any settings write and additionally requires the `super_admin` role when the payload touches any
of the three keys. Every other setting keeps the plain `settings.update` check.

`ImportedPortfolioSeeder` provisions the matching viewer account (`viewer` role). The env-based
super admin (`SUPER_ADMIN_EMAIL`, default `admin@zatca.gov.sa`) is also created there; its password
is reset on each seed (same behavior as the former `SuperAdminSeeder`).

## Audit logging

All three models use `LogsActivity` with `logFillable()->logOnlyDirty()->dontSubmitEmptyLogs()`
via `HasLicenseAttributes`, so create/update/delete are recorded automatically. Exports are
logged by `ExportService` as before.

## Backend components

- `App\Models\InfraLicense`, `App\Models\ServiceDeskLicense`, `App\Models\License`
- `App\Models\Concerns\HasLicenseAttributes` (casts, activity log options, `status()`,
  `daysRemaining()`) and `App\Models\Contracts\LicenseRecord`
- `App\Services\AbstractLicenseService` + `LicenseService`, `InfraLicenseService`,
  `ServiceDeskLicenseService`
- `App\Http\Controllers\Api\V1\InfraLicenseController`, `ServiceDeskLicenseController`
- `App\Http\Requests\Concerns\HasLicenseValidationRules` and the Store/Update requests under
  `App\Http\Requests\{License,InfraLicense,ServiceDeskLicense}`
- `App\Http\Resources\{LicenseResource,InfraLicenseResource,ServiceDeskLicenseResource}`
- `App\Policies\InfraLicensePolicy`, `ServiceDeskLicensePolicy`
- `App\Exports\Definitions\AbstractLicensesExportDefinition` +
  `LicensesExportDefinition`, `InfraLicensesExportDefinition`, `ServiceDeskLicensesExportDefinition`
- `database/factories/{InfraLicenseFactory,ServiceDeskLicenseFactory}.php`
- `database/seeders/{PermissionSeeder,SettingsSeeder,ImportedPortfolioSeeder,DatabaseSeeder}.php`
- `lang/{en,ar}/messages.php` → `messages.infra_licenses.*`, `messages.service_desk_licenses.*`
- `tests/Feature/{InfraLicenseFeatureTest,ServiceDeskLicenseFeatureTest,DashboardLicenseChartsFeatureTest,LoginDefaultCredentialsSettingsFeatureTest}.php`
