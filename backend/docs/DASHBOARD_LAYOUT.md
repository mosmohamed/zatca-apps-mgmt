# Per-User Dashboard Widget Layout

## Purpose

Each dashboard user can reorder their own dashboard widgets and have that order persist across
sessions and devices. Widget *visibility* stays role-scoped through the existing
`dashboard_widgets` setting; org-wide *size and presentation* live in
`dashboard_widget_layout` (see `DASHBOARD_WIDGET_LAYOUT.md`). This feature only controls the
*order* per user — never width or height.

## Database changes

Migration `2026_07_28_120000_create_user_dashboard_layouts_table.php` creates
`user_dashboard_layouts`:

| Column | Notes |
|---|---|
| `id` | auto increment |
| `user_id` | FK `users`, cascade on delete, unique (one layout per user) |
| `widget_order` | JSON array of widget keys |
| `created_at` / `updated_at` | timestamps |

Valid widget keys come from `App\Support\DashboardWidgets::keys()`, which remains the single
source of truth shared with the role-scoped visibility setting.

## Order reconciliation

A stored order is never trusted verbatim, because the canonical widget list evolves:

- keys that no longer exist are dropped,
- the saved relative order is preserved for keys that still exist,
- widgets introduced after the layout was saved are appended at the end.

This means a partial order can be submitted and the response always contains the complete
widget list.

## API endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/v1/dashboard/layout` | Returns the effective order for the current user |
| `PUT` | `/api/v1/dashboard/layout` | Persists a custom order |
| `DELETE` | `/api/v1/dashboard/layout` | Removes the custom order and restores defaults |

All three require `auth:sanctum`. The response payload is:

```json
{
  "success": true,
  "message": "Dashboard layout retrieved successfully.",
  "data": {
    "widget_order": ["top_technologies", "license_usage"],
    "is_custom": true
  },
  "errors": null
}
```

`is_custom` is `false` when the user has no saved layout and is seeing the default order.

`PUT` expects `widget_order` as a non-empty array of distinct strings, each of which must be a
known widget key. Unknown or duplicated keys produce a `422` validation error.

## Permissions

`dashboard-layout.manage` is required for all three endpoints and is granted to `super_admin`
and `employee` by `PermissionSeeder`. Authorization is resolved through
`App\Policies\UserDashboardLayoutPolicy`, so a user can only ever read or modify their own
layout — the row is always looked up by the authenticated user's id.

## Audit logging

`App\Services\DashboardLayoutService` writes activity log entries under the
`dashboard_layout` log name with the descriptions `dashboard_layout.updated` (including the
stored order in the properties) and `dashboard_layout.reset`.

## Backend components

- `App\Models\UserDashboardLayout` and the `User::dashboardLayout()` relationship
- `App\Services\DashboardLayoutService`
- `App\Http\Requests\Dashboard\UpdateDashboardLayoutRequest`
- `App\Http\Controllers\Api\V1\DashboardLayoutController`
- `App\Policies\UserDashboardLayoutPolicy`
- `tests/Feature/DashboardLayoutFeatureTest.php`
