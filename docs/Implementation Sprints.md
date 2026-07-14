Implementation SprintsThis document contains highly detailed sprint instructions designed specifically for Cursor AI (Composer).Workflow: Copy the entire block of a single sprint, paste it into Cursor Composer (Cmd/Ctrl + I), and let the AI execute it. Do NOT run multiple sprints at once.Backend Sprints (Laravel 12)Sprint 1: Project Setup & Core PackagesAct as a Senior Laravel Architect. Initialize the backend foundation for our IT Portfolio Management System.
1. Ensure the Laravel 12 API structure is ready.
2. Install and configure the following packages:
   - `laravel/sanctum` (for API authentication)
   - `spatie/laravel-permission` (for RBAC)
   - `spatie/laravel-activitylog` (for audit trails)
   - `maatwebsite/excel` (for data exports)
3. In `AppServiceProvider`, enable strict mode and prevent lazy loading for non-production environments: `Model::preventLazyLoading(!app()->isProduction());`.
4. Ensure `declare(strict_types=1);` is enforced.

Sprint 2: Database Schema & ModelsAct as a Database Architect. Generate Migrations and Eloquent Models with proper relationships, SoftDeletes, and database Indexes. Use Auto-Increment IDs (No UUIDs).
Entities to create:
1. `Department`: id, name_ar, name_en, timestamps, softDeletes.
2. `ApplicationType`: id, name_ar, name_en, code, timestamps. (Lookup table).
3. `Vendor`: id, name, email, phone, contact_person_email, contact_person_phone, remarks, status(boolean), timestamps, softDeletes.
4. `AppRole`: id, name, timestamps. (Lookup table for app-specific roles).
5. `User`: modify default migration. Remove 'name'. Add first_name, last_name, vendor_id(foreignId, nullable), phone, email, teams, slack, whatsapp, extension, job_title, is_active(boolean), timestamps, softDeletes.
6. `Application`: department_id, application_type_id, name_ar, name_en, code, status(enum: Active, Maintenance, Retired, Archived), criticality(enum: Low, Medium, High, Critical), business_owner, technical_owner, support_type(enum: 24x7, Business Hours, Best Effort), documentation_url, repository_url, created_by(foreignId, nullable, nullOnDelete), updated_by(foreignId, nullable, nullOnDelete), timestamps, softDeletes.
7. `ApplicationAssignment`: Entity table (NOT a simple pivot). application_id, user_id, app_role_id, assigned_by(foreignId), assigned_at(timestamp), ended_at(timestamp, nullable), is_primary(boolean), remarks, timestamps. Add a unique composite index for (application_id, user_id) WHERE ended_at IS NULL.
Ensure all foreign keys are indexed. Setup ActivityLog on Vendor, Application, and ApplicationAssignment.

Sprint 3: Seeders, Factories & PermissionsGenerate Seeders and Factories for realistic data population using Laravel Faker.
1. Create separate Seeders: `DepartmentSeeder`, `VendorSeeder`, `ApplicationTypeSeeder`, `AppRoleSeeder`.
2. Create `PermissionSeeder` to create Spatie roles: 'super_admin' and 'employee'.
3. Create `SuperAdminSeeder` to generate the initial admin user and assign the 'super_admin' role.
4. Call all these seeders inside `DatabaseSeeder.php`.
5. Ensure Factories generate localized (Arabic/English) names where applicable.

Sprint 4: Service Layer & Business LogicAct as a Senior Backend Engineer. Implement the Service Layer pattern.
1. Create `ApplicationService`, `VendorService`, `UserService`, and `AssignmentService` inside `app/Services`.
2. Move all core business logic (Create, Update, Delete) into these services.
3. Crucial Logic in `AssignmentService`: When assigning a user to an application, wrap the operation in a `DB::transaction`. If an active assignment exists for this user+app combo, update the old record's `ended_at` timestamp to `now()`, then insert the new assignment.
4. Ensure strict typing for all method arguments and return types.

Sprint 5: Policies & AuthorizationImplement Laravel Policies mapped to Spatie permissions.
1. Create Policies for `Application`, `Vendor`, `User`, and `ApplicationAssignment`.
2. `viewAny` and `view`: Allow 'employee' and 'super_admin'. (Employees will later have data scoped to their assignments).
3. `create`, `update`, `delete`, `restore`, `forceDelete`: Return true ONLY if the user has the 'super_admin' role.
4. Register policies if necessary in `AuthServiceProvider`.

Sprint 6: Form Requests & ValidationCreate strict Form Requests for all mutating endpoints.
1. Create Store and Update requests for Application, Vendor, User, and ApplicationAssignment.
2. Validation messages MUST use Laravel localization (e.g., `__('messages.validation.required')`).
3. Ensure complex rules are handled (e.g., Application `code` must be unique, ignoring the current ID on update).

Sprint 7: API ResourcesImplement API Resources to unify JSON responses.
1. Create `JsonResource` and `ResourceCollection` classes for Department, Vendor, User, Application, and ApplicationAssignment.
2. Use `$this->whenLoaded()` strictly to include relationship data without triggering N+1 queries.
3. Ensure dates are formatted uniformly (e.g., Y-m-d H:i:s).

Sprint 8: API Controllers & RoutingCreate API Controllers mapping to our Services, adhering to our unified response format.
1. Create a BaseController trait or class with a `successResponse($data, $message)` method returning `{ success: true, message, data, errors: null }`.
2. Implement `index()` methods with:
   - Pagination (`?page=1&per_page=15`).
   - Sorting (`?sort=name` or `?sort=-created_at`).
   - Searching (`?search=keyword` querying specific indexed columns).
3. Define routes in `routes/api.php` under the `Route::prefix('v1')->middleware('auth:sanctum')` group.

Frontend Sprints (React 19 + Vite)Sprint 9: React Foundation & Hybrid UI SetupAct as a Lead Frontend Engineer. Set up the React 19 + Vite project.
1. Configure `TypeScript`, `Tailwind CSS`, and `React Router v7`.
2. Initialize `shadcn/ui` and configure the components: Button, Input, Table, Dialog, Select, Combobox, Skeleton, Form.
3. Integrate `TailAdmin` for the global layout (Sidebar, Header).
4. CRITICAL: Merge `tailwind.config.ts`. Keep TailAdmin's layout classes and colors, but append shadcn's required CSS variables and animations to the `extend` section.
5. Create the Feature-Based folder structure: `src/features/{featureName}/(components, hooks, services, pages, types)`.

Sprint 10: Authentication & API ClientImplement the Auth layer.
1. Create an Axios instance (`src/lib/axios.ts`) configured with the backend API base URL (`/api/v1`).
2. Implement an interceptor to automatically attach the Sanctum Bearer token and handle 401 redirects.
3. Create an `AuthContext` (or Zustand store) to manage the current user, role, and token.
4. Build the Login Page using React Hook Form + Zod for validation.

Sprint 11: Dashboard Layout & UX ComponentsBuild the Application Shell.
1. Implement TailAdmin's `DefaultLayout`, Sidebar, and Header.
2. Create global UX components: 
   - `ErrorBoundary`
   - `LoadingSkeleton` (using shadcn)
   - `EmptyState` (reusable component for empty tables)
   - standard error pages (404, 403, 500).
3. Setup `TanStack Query` `QueryClientProvider` at the app root.
4. Add `Sonner` for global toast notifications.

Sprint 12: Applications Feature (CRUD)Implement the Applications management feature inside `src/features/applications`.
1. Create TypeScript types mirroring the backend API Resource.
2. Create TanStack Query hooks (`useApplications`, `useCreateApplication`, etc.).
3. Build the `ApplicationsPage` list view using shadcn `<DataTable>`. Implement server-side pagination, sorting, and debounced searching.
4. Build Create/Update forms using React Hook Form + Zod, rendered inside a shadcn `<Dialog>` or `<Sheet>`.

Sprint 13: Vendors & Departments FeaturesImplement the Vendors and Departments features using the exact same feature-based architecture pattern.
1. Build DataTables with server-side filtering.
2. Build Dialog forms with Zod validation.
3. Ensure optimistic updates or proper Query cache invalidation upon successful mutations.

Sprint 14: Users FeatureImplement the Users management feature.
1. Display users in a DataTable, including their assigned Vendor (eager loaded).
2. Create the User Form. Use a shadcn `<Select>` or `<Combobox>` to assign the user to a Vendor.
3. Implement a toggle for `is_active` status.

Sprint 15: Application Assignments Feature (The Core)Build the highly interactive Matrix Assignment UI.
1. Create the Assignment Screen. 
2. Use shadcn `<Combobox>` with search for selecting the Application, the User, and the AppRole.
3. Include inputs for `is_primary` and `remarks`.
4. Submit this data via TanStack Query to the AssignmentService endpoint. Handle the UX gracefully (show Sonner toast on success, update the assignments list).
5. Add RBAC UI guards: Hide creation buttons if the logged-in user is an 'employee'.

Sprint 16: Localization (i18n)Implement full Arabic/English support.
1. Install `react-i18next`.
2. Create JSON translation files for 'ar' and 'en' covering all Sidebar links, Table headers, and Form labels.
3. Add a Language Switcher in the Header.
4. Implement dynamic RTL switching (`document.dir = 'rtl'`) and ensure TailAdmin layout and shadcn components respond correctly.

Sprint 17: Quality Assurance & TestingPerform final system reviews.
1. Review Backend: Check Laravel Telescope or Clockwork to ensure NO N+1 queries exist on the index endpoints.
2. Create Laravel Feature Tests (`php artisan make:test AssignmentFeatureTest`) to strictly verify the history tracking logic of `ApplicationAssignment`.
3. Review Frontend: Ensure all Zod schemas match backend validation rules. Verify Error Boundaries catch unexpected component crashes.

# Phase 2: Enterprise Architecture & UX Expansion

**CRITICAL SYSTEM CONTEXT FOR ALL SPRINTS:**
- **Backend:** Laravel 13, PHP 8.3+. 
- **Frontend:** React 19, Vite, **Tailwind v4** (CSS-first, NO `tailwind.config.ts`, use `@theme` in `index.css`), shadcn/ui.
- **Rules:** Follow `.cursorrules` strictly. No placeholder code. Update `en.json` and `ar.json` for all new UI text.

---

### Sprint 18: API Infrastructure Refactoring
```text
Act as a Senior Laravel Architect. We need to refactor our API foundation before scaling Master Data.
1. Create Reusable Traits in `app/Traits`:
   - `ApiResponseTrait`: Methods for `successResponse()`, `errorResponse()`, `validationErrorResponse()`.
   - `PaginationTrait`: Standardize extraction of `page` and `per_page` from requests.
   - `SearchTrait`: Dynamic query builder for searching specific columns.
   - `SortTrait`: Dynamic query builder for sorting (`?sort=name` or `?sort=-created_at`).
2. Create an abstract `BaseApiController` in `app/Http/Controllers/Api/V1` that uses these traits.
3. Refactor existing controllers (`ApplicationController`, `VendorController`, `UserController`, `AssignmentController`, `DepartmentController`) to extend `BaseApiController` and utilize these traits, removing duplicated response/search/sort logic.

Act as a Full Stack Engineer. Fix the User domain and introduce `JobTitle` as our first Master Data entity.
1. Backend:
   - Create `JobTitle` Model & Migration (`name_en`, `name_ar`, `description`, `is_active`, `sort_order`, softDeletes).
   - Create a migration to alter `users` table: drop `slack` column, drop `job_title` string column, add `job_title_id` (foreignId).
   - Create JobTitle CRUD (Service, FormRequests, Resource, Controller) using the new API Traits.
   - Add a public lookup endpoint `GET /lookups/job-titles`.
   - Update User Resource/Service/Requests to handle `job_title_id` and remove `slack`. Validate password and confirm_password strictly.
2. Frontend:
   - Remove `slack` from the User form.
   - Replace the Job Title text input with a shadcn `<Combobox>` fetching from `/lookups/job-titles`.
   - Fix password and confirm password labels and Zod validation logic.

Act as a Full Stack Architect. We are converting Enums to Master Data Tables.
1. Backend Migrations & Models:
   - `support_types` (name_ar, name_en, code, is_active).
   - `criticalities` (name_ar, name_en, code, is_active).
   - `application_statuses` (name_ar, name_en, code, is_active).
   - `app_roles` (Update existing: add description, is_active, sort_order, softDeletes).
   - Migration to alter `applications`: Convert enum columns (`status`, `criticality`, `support_type`) to foreign keys (`status_id`, `criticality_id`, `support_type_id`). Handle data migration carefully.
2. API & Frontend:
   - Generate CRUD API endpoints for all the above.
   - Create a generic or individual Frontend feature pages for these Master Data tables (using DataTables and Forms).

Act as a UX/UI Developer. Reorganize the TailAdmin sidebar layout.
1. Move the `Dashboard` link to point to `/` (Root).
2. Create an Expandable/Collapsible Sidebar Menu Group named "Master Data" (with proper Lucide icons).
3. Move the following links INSIDE the "Master Data" group:
   - Departments
   - Vendors
   - Applications
   - Users
   - Job Titles
   - Application Roles
4. Keep `Assignments` outside the group, right below Dashboard.
5. Ensure Active States, Breadcrumbs, and Mobile responsiveness work perfectly. Update i18n JSON files.

Act as a Senior React & Laravel Engineer. Overhaul the Application Assignments UI to allow bulk assigning multiple users to an application at once.
1. Backend (`AssignmentService`):
   - Add `assignMultiple($applicationId, array $usersData)` method. Wrap in `DB::transaction`.
   - Iterate over users: For each user, if an open assignment exists, close it (`ended_at = now()`), then insert the new assignment record.
   - Update `AssignmentController` and FormRequests to accept a `users` array payload.
2. Frontend (`AssignmentFormDialog`):
   - Change flow: Select Application (Dropdown) -> Dynamic Rows of Users.
   - Use `useFieldArray` from React Hook Form.
   - Each row should have: User (Combobox), Role (Combobox), Primary (Checkbox), Remarks (Input), and a "Delete Row" button.
   - Add an "+ Add User" button to append rows.
   - Update TanStack mutation to hit the new bulk endpoint.

Act as a Frontend Developer. Replace the placeholder Dashboard at `/` with real metrics.
1. Backend: Create a `DashboardController` returning aggregated stats: Total Apps, Active Users, Vendors, Total Assignments, and recent 20 activities.
2. Frontend:
   - Create KPI Cards (shadcn) for the aggregated stats.
   - Create Charts (using Recharts or similar compatible with React 19) for: Applications by Status, Assignments by Role.
   - Create a "Recent Activity" timeline component.
   - Create "Quick Actions" buttons (New Application, New User) that open their respective Dialogs.

### Sprint 19: Enterprise Roles & Permissions Management
Act as an Access Management Expert. Transition from hardcoded role checks to dynamic permission management.
1. Backend: 
   - Ensure Spatie Permissions are fully seeded (Create/Edit/Delete/View for every entity).
   - Update all Laravel Policies to check specific permissions (`can('applications.create')`) instead of `hasRole('super_admin')`.
   - Create APIs to list, create, and assign Roles and Permissions.
2. Frontend:
   - Create a `Roles & Permissions` page under Master Data.
   - Build a Permission Matrix UI (Table where rows are modules, columns are actions like Read/Write, and checkboxes assign permissions to the selected Role).

Act as a Frontend UX Engineer. Implement a Global Search (CTRL+K) feature.
1. Backend: Create a unified `GlobalSearchController` that takes `?query=` and searches across Applications, Users, Vendors, and Departments, returning a grouped JSON array.
2. Frontend:
   - Implement `cmdk` (shadcn Command component) wrapped in a Dialog triggered by `CTRL+K` or `CMD+K`.
   - Display grouped search results. Clicking a result navigates the user to that specific entity's view or edit dialog.

Act as an Audit & Compliance Engineer.
1. Backend: Create API endpoints to query the `spatie/activitylog` table (`ActivitylogController`). Include filters for Subject, Causer, Date Range.
2. Frontend:
   - Create an `Activity Log` page (Data Table showing User, Action, Entity, Date, IP). Include a "View Details" dialog showing Old vs New values (JSON diff).
   - Create an `Audit Dashboard` page with widgets: Most Active Admins, Most Modified Applications, Top Vendors.

Act as a Full Stack Engineer. Create a global Settings module.
1. Backend: Create a `settings` table (key-value pair or JSON column) and a `SettingsService`. Seed default settings (Company Name, Default Timezone, Pagination size).
2. Frontend:
   - Create a `/settings` page with tabs: General (Company name, Logo upload), Preferences (Timezone, default pagination), Security (Password policy toggles).
   - Store public settings in React Context so they apply globally (e.g., dynamically changing table pagination size).

Act as a UX Engineer. Polish the application's loading and error states.
1. Implement beautifully designed HTTP error pages (`/403`, `/404`, `/500`, `Offline`, `No Internet`).
2. Implement a Global Error Boundary with a "Retry" button.
3. Create detailed shadcn-based Skeletons (`TableSkeleton`, `DashboardSkeleton`, `FormSkeleton`, `DetailsSkeleton`).
4. Replace all generic loading spinners in existing feature pages with these structured skeletons.

Act as a Senior React Developer. Build the ultimate Reusable DataTable component to standardize all lists.
1. Create `EnterpriseDataTable.tsx` wrapping shadcn table and TanStack table logic.
2. It must support: Server-side Pagination, Multi-column sorting, Debounced Search, Column Visibility toggler, and dynamic action buttons.
3. Refactor the existing Applications, Vendors, and Users pages to use this new unified component, removing duplicate table logic from their respective page files. Ensure RTL support works seamlessly.

