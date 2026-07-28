# Entity Hover Previews

## Purpose

Rich hover previews let users inspect a user, vendor, application or department without
leaving the page they are on. The backend exposes four read-only "preview" endpoints that
return a compact, denormalised summary of a single record — deliberately smaller than the
full `show` payload so the card renders quickly and leaks nothing sensitive.

## Database changes

None. Previews read existing tables (`users`, `vendors`, `applications`, `departments`) plus
the already indexed foreign keys on `application_assignments` and `application_technology`
for the aggregate counts.

## API endpoints

All four require `auth:sanctum` and are registered before the matching `apiResource` blocks
in `routes/api.php`.

| Method | Endpoint | Permission | Resource |
|---|---|---|---|
| `GET` | `/api/v1/users/{user}/preview` | `users.view` | `UserPreviewResource` |
| `GET` | `/api/v1/vendors/{vendor}/preview` | `vendors.view` | `VendorPreviewResource` |
| `GET` | `/api/v1/applications/{application}/preview` | `applications.view` | `ApplicationPreviewResource` |
| `GET` | `/api/v1/departments/{department}/preview` | `departments.view` | `DepartmentPreviewResource` |

Responses use the standard envelope:

```json
{
  "success": true,
  "message": "User preview retrieved successfully.",
  "data": {
    "id": 12,
    "full_name": "Layla Hassan",
    "initials": "LH",
    "email": "layla.hassan@zatca.sa",
    "phone": "+966500000001",
    "extension": "4821",
    "teams": "layla.hassan",
    "is_active": true,
    "job_title": { "id": 3, "name_en": "Solution Architect", "name_ar": "مهندس حلول" },
    "vendor": { "id": 7, "name": "Contoso Systems" },
    "roles": ["employee"],
    "active_assignments_count": 4
  },
  "errors": null
}
```

### Field notes

- **User** — `password`, `remember_token` and every other credential column are excluded;
  the resource lists its fields explicitly rather than serialising the model. `initials` is
  derived from the first and last name and is used as the avatar fallback (the schema has no
  avatar column). The `users` table has no department column, so no department is reported
  for a user; `job_title` is the organisational attribute that exists.
- **Vendor** — the schema stores `contact_person_email` / `contact_person_phone` rather than a
  contact person name, and has no logo or website column, so the card falls back to generated
  initials. `users_count` / `active_users_count` summarise the linked staff.
- **Application** — `business_owners` and `technical_owners` are many-to-many user
  relations (not free-text), and there is no application ↔ vendor relation, so no vendor is
  reported. `documentation_url` and `repository_url` are both returned when present.
- **Department** — name pair plus `applications_count`.

Every lookup (`department`, `status`, `criticality`, `application_type`, `support_type`,
`job_title`) is returned as an `{ id, name_en, name_ar }` triple so the frontend can pick the
active locale without a second request.

## Permissions

Authorization goes through the existing entity policies (`UserPolicy`, `VendorPolicy`,
`ApplicationPolicy`, `DepartmentPolicy`), all of which map `view` onto `<entity>.view` via
`ChecksEntityPermissions`. A user holding only `users.view` can therefore preview users and
receives `403` for the other three endpoints. Unknown ids return `404`.

## Query behaviour

`App\Services\EntityPreviewService` eager-loads every relation and aggregate the resources
touch, so previews never trip `Model::preventLazyLoading()`:

- user → `vendor`, `jobTitle`, `roles` + open assignment count
- vendor → total and active linked user counts
- application → `department`, `applicationType`, `status`, `criticality`, `supportType` +
  open assignment count and technology count
- department → application count

## Audit logging

Previews are read-only and are not written to the activity log, consistent with the other
`show` endpoints.

## Backend components

- `App\Services\EntityPreviewService`
- `App\Http\Controllers\Api\V1\EntityPreviewController`
- `App\Http\Resources\UserPreviewResource`, `VendorPreviewResource`,
  `ApplicationPreviewResource`, `DepartmentPreviewResource`
- `App\Http\Resources\Concerns\BuildsInitials`
- `lang/{en,ar}/messages.php` → `messages.previews.*`
- `tests/Feature/EntityPreviewFeatureTest.php`

## Frontend components

| File | Responsibility |
|---|---|
| `src/features/entity-preview/types/entity-preview.ts` | Payload types |
| `src/features/entity-preview/services/entity-preview-service.ts` | Axios calls |
| `src/features/entity-preview/hooks/use-entity-preview.ts` | TanStack Query hooks (5 minute `staleTime`, fetch only when opened) |
| `src/components/entity-preview/EntityHoverCard.tsx` | Hover/focus preview surface with skeleton, error and dismissal handling |
| `src/components/entity-preview/CopyableField.tsx` | Label + value row with a copy action |
| `src/components/entity-preview/UserPreviewCard.tsx` | User card body |
| `src/components/entity-preview/VendorPreviewCard.tsx` | Vendor card body |
| `src/components/entity-preview/ApplicationPreviewCard.tsx` | Application card body |
| `src/components/entity-preview/UserPreviewLink.tsx` | `<UserPreviewLink userId name />` trigger |
| `src/components/entity-preview/VendorPreviewLink.tsx` | `<VendorPreviewLink vendorId name />` trigger |
| `src/components/entity-preview/ApplicationPreviewLink.tsx` | `<ApplicationPreviewLink applicationId name />` trigger |

The triggers read `users.view` / `vendors.view` / `applications.view` from `useAuth().can()`
and render plain text when the permission is missing, so the API is never called for a
request that would be rejected.

Integrated on the application detail page (team table member and vendor columns), the
applications listing and the assignments listing.

### Interaction model

`EntityHoverCard` is built on the Popover primitive rather than the hover-card primitive:
the hover-card primitive strips every descendant out of the tab order, which would make the
copy buttons and links inside a preview unreachable. Hover intent (400 ms open delay,
180 ms close grace period), focus opening, pointer re-entry, `Escape` dismissal and
`Tab`-into-card are therefore handled explicitly. The card is portalled and uses Radix
collision detection so it always stays inside the viewport.

Localized labels live under the `entityPreview` key in `src/locales/{en,ar}.json`.
