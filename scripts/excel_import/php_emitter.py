from __future__ import annotations

from pathlib import Path
from typing import Any

from .pipeline import CanonicalApplication, CanonicalAssignment, CanonicalUser, ImportResult


def emit_seeder(result: ImportResult, output_path: Path) -> Path:
    enrich_application_owners(result)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    content = _render(result)
    output_path.write_text(content, encoding="utf-8", newline="\n")
    return output_path


def _render(result: ImportResult) -> str:
    users_php = _php_array([_user_payload(user) for user in result.users if not user.static], indent=8)
    applications_php = _php_array([_application_payload(app) for app in result.applications], indent=8)
    assignments_php = _php_array([_assignment_payload(item) for item in result.assignments], indent=8)

    return f"""<?php

declare(strict_types=1);

namespace Database\\Seeders;

use App\\Enums\\TechnologyCategory;
use App\\Models\\AppRole;
use App\\Models\\Application;
use App\\Models\\ApplicationAssignment;
use App\\Models\\ApplicationStatus;
use App\\Models\\ApplicationType;
use App\\Models\\Criticality;
use App\\Models\\Department;
use App\\Models\\SupportType;
use App\\Models\\Technology;
use App\\Models\\User;
use App\\Models\\Vendor;
use Illuminate\\Database\\Seeder;
use Illuminate\\Support\\Facades\\DB;
use Illuminate\\Support\\Facades\\Hash;
use Illuminate\\Support\\Facades\\Schema;
use Illuminate\\Support\\Str;
use Spatie\\Permission\\Models\\Role;

/**
 * Additive, idempotent import generated from the Excel workbook.
 * This seeder does not read Excel and never truncates existing data.
 */
class ImportedPortfolioSeeder extends Seeder
{{
    private const string DEFAULT_PASSWORD = 'password';

    /**
     * Higher number wins when the same user is assigned to the same application
     * from more than one Excel source.
     *
     * @var array<string, int>
     */
    private const array APP_ROLE_RANK = [
        'ZATCA Management' => 40,
        'Application Lead' => 30,
        'Support' => 20,
        'Viewer' => 10,
    ];

    /** @var array<string, User> */
    private array $usersByNormalizedName = [];

    /** @var array<string, Application> */
    private array $applicationsByNormalizedName = [];

    public function run(): void
    {{
        DB::transaction(function (): void {{
            $this->ensureSystemRoles();
            $this->ensureAppRoles();

            $password = Hash::make(self::DEFAULT_PASSWORD);
            $assigner = $this->seedStaticUsers($password);
            $usersByEmail = $this->seedUsers($password);
            $applicationsByName = $this->seedApplications($assigner, $usersByEmail);
            $this->seedAssignments($assigner, $usersByEmail, $applicationsByName);
        }});
    }}

    private function ensureSystemRoles(): void
    {{
        foreach (['super_admin', 'infra_admin', 'sd_admin', 'viewer', 'employee'] as $roleName) {{
            Role::findOrCreate($roleName, 'web');
        }}
    }}

    private function ensureAppRoles(): void
    {{
        $roles = [
            ['name' => 'Support', 'description' => 'Operational support access', 'sort_order' => 4],
            ['name' => 'ZATCA Management', 'description' => 'ZATCA management ownership and oversight', 'sort_order' => 5],
            ['name' => 'Viewer', 'description' => 'Read-only application access', 'sort_order' => 6],
            ['name' => 'Application Lead', 'description' => 'ZATCA application lead and technical ownership', 'sort_order' => 7],
        ];

        foreach ($roles as $role) {{
            AppRole::query()->firstOrCreate(
                ['name' => $role['name']],
                [
                    'description' => $role['description'],
                    'is_active' => true,
                    'sort_order' => $role['sort_order'],
                ],
            );
        }}
    }}

    private function seedStaticUsers(string $password): User
    {{
        $staticUsers = [
            [
                'first_name' => 'Super',
                'last_name' => 'Admin',
                'email' => 'super_admin@zatca.gov.sa',
                'phone' => '5678910110',
                'role' => 'super_admin',
            ],
            [
                'first_name' => 'Infra',
                'last_name' => 'Admin',
                'email' => 'infra_admin@zatca.gov.sa',
                'phone' => '5678910110',
                'role' => 'infra_admin',
            ],
            [
                'first_name' => 'SD',
                'last_name' => 'Admin',
                'email' => 'sd_admin@zatca.gov.sa',
                'phone' => '5678910110',
                'role' => 'sd_admin',
            ],
            [
                'first_name' => 'Viewer',
                'last_name' => 'User',
                'email' => 'viewer@zatca.gov.sa',
                'phone' => '5678910110',
                'role' => 'viewer',
            ],
        ];

        $superAdmin = null;

        foreach ($staticUsers as $row) {{
            $user = $this->persistUser($row, $password);
            if (is_string($row['role'])) {{
                $this->assignSpatieRole($user, $row['role']);
            }}
            if ($row['email'] === 'super_admin@zatca.gov.sa') {{
                $superAdmin = $user;
            }}
        }}

        if ($superAdmin instanceof User) {{
            return $superAdmin;
        }}

        $existing = User::query()->role('super_admin')->orderBy('id')->first();
        if ($existing instanceof User) {{
            return $existing;
        }}

        return User::query()->firstOrCreate(
            ['email' => 'system@zatca.gov.sa'],
            [
                'first_name' => 'System',
                'last_name' => 'Importer',
                'password' => $password,
                'is_active' => true,
                'email_verified_at' => now(),
            ],
        );
    }}

    /**
     * @return array<string, User>
     */
    private function seedUsers(string $password): array
    {{
        $usersByEmail = [];

        foreach ($this->importedUsers() as $row) {{
            $user = $this->persistUser($row, $password);
            $role = $row['role'] ?? 'employee';
            if (is_string($role) && $role !== '') {{
                $this->assignSpatieRole($user, $role);
            }}
            $usersByEmail[mb_strtolower((string) $user->email)] = $user;
        }}

        foreach (User::withTrashed()->get() as $user) {{
            $usersByEmail[mb_strtolower((string) $user->email)] = $user;
        }}

        return $usersByEmail;
    }}

    /**
     * @param  array<string, mixed>  $row
     */
    private function persistUser(array $row, string $password): User
    {{
        $email = mb_strtolower(trim((string) $row['email']));
        $firstName = trim((string) $row['first_name']);
        $lastName = trim((string) $row['last_name']);
        $phone = $this->nullableString($row['phone'] ?? null);

        $user = User::withTrashed()->where('email', $email)->first();

        if (! $user instanceof User) {{
            $this->bootUserNameIndex();
            $user = $this->usersByNormalizedName[$this->normalizePersonName($firstName.' '.$lastName)] ?? null;
        }}

        if ($user instanceof User) {{
            if ($user->trashed()) {{
                $user->restore();
            }}

            $updates = [];
            if ($user->first_name === '' || $user->first_name === null) {{
                $updates['first_name'] = $firstName;
            }}
            if ($user->last_name === '' || $user->last_name === null) {{
                $updates['last_name'] = $lastName;
            }}
            if (($user->phone === null || $user->phone === '') && $phone !== null) {{
                $updates['phone'] = $phone;
            }}
            if (! $user->is_active) {{
                $updates['is_active'] = true;
            }}
            if ($updates !== []) {{
                $user->update($updates);
            }}

            $this->rememberUser($user);

            return $user;
        }}

        $created = User::query()->create([
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => $email,
            'phone' => $phone,
            'password' => $password,
            'is_active' => true,
            'email_verified_at' => now(),
        ]);
        $this->rememberUser($created);

        return $created;
    }}

    /**
     * @param  array<string, User>  $usersByEmail
     * @return array<string, Application>
     */
    private function seedApplications(User $assigner, array $usersByEmail): array
    {{
        $applicationsByName = [];

        foreach ($this->importedApplications() as $row) {{
            $name = trim((string) $row['name_en']);
            $normalized = $this->normalizeApplicationName($name);
            $application = $this->findApplication($name);

            $department = $this->firstOrCreateDepartment((string) $row['department']);
            $applicationType = $this->firstOrCreateApplicationType((string) $row['application_type']);
            $status = $this->findStatus((string) $row['status']);
            $criticality = $this->findCriticality((string) ($row['criticality'] ?? 'Medium'));
            $supportType = $this->findSupportType((string) $row['support_type']);
            $vendor = $this->firstOrCreateVendor($this->nullableString($row['vendor'] ?? null));

            if ($application instanceof Application) {{
                if ($application->trashed()) {{
                    $application->restore();
                }}

                $payload = $this->applicationPayload(
                    $row,
                    $department->id,
                    $applicationType->id,
                    $status->id,
                    $criticality->id,
                    $supportType->id,
                    $vendor?->id,
                    $assigner->id,
                    includeCode: false,
                );
                $application->fill($this->withoutEmptyOverwrites($application, $payload));
                $application->save();
            }} else {{
                $payload = $this->applicationPayload(
                    $row,
                    $department->id,
                    $applicationType->id,
                    $status->id,
                    $criticality->id,
                    $supportType->id,
                    $vendor?->id,
                    $assigner->id,
                    includeCode: true,
                );
                $application = Application::query()->create($payload);
            }}

            $this->rememberApplication($application);

            $technologyNames = $row['technologies'] ?? [];
            if (is_array($technologyNames) && $technologyNames !== []) {{
                $technologyIds = [];
                foreach ($technologyNames as $technologyName) {{
                    $technology = $this->firstOrCreateTechnology((string) $technologyName);
                    $technologyIds[] = $technology->id;
                }}
                $application->technologies()->syncWithoutDetaching($technologyIds);
            }}

            $ownerEmails = $row['management_owner_emails'] ?? [];
            $leadEmails = $row['application_lead_emails'] ?? [];
            if (is_array($ownerEmails) && $ownerEmails !== []) {{
                $application->businessOwners()->syncWithoutDetaching(
                    $this->userIdsFromEmails($ownerEmails, $usersByEmail)
                );
            }}
            if (is_array($leadEmails) && $leadEmails !== []) {{
                $application->technicalOwners()->syncWithoutDetaching(
                    $this->userIdsFromEmails($leadEmails, $usersByEmail)
                );
            }}

            $applicationsByName[$normalized] = $application;
        }}

        foreach (Application::withTrashed()->get() as $application) {{
            $applicationsByName[$this->normalizeApplicationName((string) $application->name_en)] = $application;
        }}

        return $applicationsByName;
    }}

    /**
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>
     */
    private function applicationPayload(
        array $row,
        int $departmentId,
        int $applicationTypeId,
        int $statusId,
        int $criticalityId,
        int $supportTypeId,
        ?int $vendorId,
        int $actorId,
        bool $includeCode,
    ): array {{
        $payload = [
            'name_en' => trim((string) $row['name_en']),
            'name_ar' => trim((string) $row['name_ar']),
            'department_id' => $departmentId,
            'application_type_id' => $applicationTypeId,
            'status_id' => $statusId,
            'criticality_id' => $criticalityId,
            'support_type_id' => $supportTypeId,
            'updated_by' => $actorId,
        ];

        if ($includeCode) {{
            $payload['code'] = $this->uniqueApplicationCode((string) $row['name_en']);
            $payload['created_by'] = $actorId;
        }}

        if (Schema::hasColumn('applications', 'description')) {{
            $payload['description'] = $this->nullableString($row['description'] ?? null);
        }}
        if (Schema::hasColumn('applications', 'technical_category')) {{
            $payload['technical_category'] = $this->nullableString($row['technical_category'] ?? null);
        }}
        if (Schema::hasColumn('applications', 'vendor_id')) {{
            $payload['vendor_id'] = $vendorId;
        }}
        if (Schema::hasColumn('applications', 'remarks')) {{
            $payload['remarks'] = $this->nullableString($row['remarks'] ?? null);
        }}

        return $payload;
    }}

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function withoutEmptyOverwrites(Application $application, array $payload): array
    {{
        $filtered = [];

        foreach ($payload as $key => $value) {{
            if ($value === null || $value === '') {{
                continue;
            }}

            $current = $application->getAttribute($key);
            if (is_string($current) && trim($current) !== '' && in_array($key, ['description', 'remarks', 'technical_category'], true) && is_string($value) && str_starts_with($value, 'TODO')) {{
                continue;
            }}

            $filtered[$key] = $value;
        }}

        return $filtered;
    }}

    /**
     * @param  array<string, User>  $usersByEmail
     * @param  array<string, Application>  $applicationsByName
     */
    private function seedAssignments(User $assigner, array $usersByEmail, array $applicationsByName): void
    {{
        $roles = AppRole::query()->get()->keyBy(fn (AppRole $role): string => mb_strtolower($role->name));

        foreach ($this->importedAssignments() as $row) {{
            $user = $usersByEmail[mb_strtolower((string) $row['user_email'])] ?? null;
            $application = $applicationsByName[$this->normalizeApplicationName((string) $row['application_name'])] ?? null;
            $role = $roles->get(mb_strtolower((string) $row['app_role']));

            if (! $user instanceof User || ! $application instanceof Application || ! $role instanceof AppRole) {{
                continue;
            }}

            $existing = ApplicationAssignment::query()
                ->where('application_id', $application->id)
                ->where('user_id', $user->id)
                ->open()
                ->first();

            $incomingRank = self::APP_ROLE_RANK[$role->name] ?? 0;
            $remarks = $this->nullableString($row['remarks'] ?? null);
            $isPrimary = (bool) ($row['is_primary'] ?? false);

            if ($existing instanceof ApplicationAssignment) {{
                $currentRoleName = (string) ($existing->appRole()->value('name') ?? '');
                $currentRank = self::APP_ROLE_RANK[$currentRoleName] ?? 0;
                $updates = [];
                if ($incomingRank > $currentRank) {{
                    $updates['app_role_id'] = $role->id;
                }}
                if ($isPrimary && ! $existing->is_primary) {{
                    $updates['is_primary'] = true;
                }}
                if ($remarks !== null) {{
                    $currentRemarks = trim((string) ($existing->remarks ?? ''));
                    if ($currentRemarks === '') {{
                        $updates['remarks'] = $remarks;
                    }} elseif (! str_contains($currentRemarks, $remarks)) {{
                        $updates['remarks'] = $currentRemarks.' | '.$remarks;
                    }}
                }}
                if ($updates !== []) {{
                    $existing->update($updates);
                }}
                continue;
            }}

            ApplicationAssignment::query()->create([
                'application_id' => $application->id,
                'user_id' => $user->id,
                'app_role_id' => $role->id,
                'assigned_by' => $assigner->id,
                'assigned_at' => now(),
                'ended_at' => null,
                'is_primary' => $isPrimary,
                'remarks' => $remarks,
            ]);
        }}
    }}

    private function findApplication(string $name): ?Application
    {{
        $this->bootApplicationNameIndex();

        return $this->applicationsByNormalizedName[$this->normalizeApplicationName($name)] ?? null;
    }}

    private function bootUserNameIndex(): void
    {{
        if ($this->usersByNormalizedName !== []) {{
            return;
        }}

        foreach (User::withTrashed()->get() as $user) {{
            $this->rememberUser($user);
        }}
    }}

    private function rememberUser(User $user): void
    {{
        $this->usersByNormalizedName[$this->normalizePersonName(
            trim((string) $user->first_name.' '.(string) $user->last_name)
        )] = $user;
    }}

    private function bootApplicationNameIndex(): void
    {{
        if ($this->applicationsByNormalizedName !== []) {{
            return;
        }}

        foreach (Application::withTrashed()->get() as $application) {{
            $this->rememberApplication($application);
        }}
    }}

    private function rememberApplication(Application $application): void
    {{
        $this->applicationsByNormalizedName[$this->normalizeApplicationName((string) $application->name_en)] = $application;
        $this->applicationsByNormalizedName[$this->normalizeApplicationName((string) $application->name_ar)] = $application;
    }}

    private function firstOrCreateDepartment(string $name): Department
    {{
        $name = trim($name) !== '' ? trim($name) : 'Unknown Department';
        $normalized = $this->normalizeApplicationName($name);
        $existing = Department::withTrashed()->get()->first(
            function (Department $department) use ($normalized, $name): bool {{
                $existingName = $this->normalizeApplicationName((string) $department->name_en);
                if ($existingName === $normalized) {{
                    return true;
                }}
                if ($normalized === 'customs' && str_contains($existingName, 'custom')) {{
                    return true;
                }}
                if ($normalized === 'internal' && (str_contains($existingName, 'zakat') || str_contains($existingName, 'tax'))) {{
                    return true;
                }}

                return false;
            }}
        );

        if ($existing instanceof Department) {{
            if ($existing->trashed()) {{
                $existing->restore();
            }}

            return $existing;
        }}

        return Department::query()->create([
            'name_en' => $name,
            'name_ar' => $name,
        ]);
    }}

    private function firstOrCreateApplicationType(string $name): ApplicationType
    {{
        $name = trim($name) !== '' ? trim($name) : 'Internal App';
        $normalized = $this->normalizeApplicationName($name);
        $existing = ApplicationType::query()->get()->first(
            fn (ApplicationType $type): bool => $this->normalizeApplicationName((string) $type->name_en) === $normalized
                || $this->normalizeApplicationName((string) $type->code) === $normalized
        );

        if ($existing instanceof ApplicationType) {{
            return $existing;
        }}

        $code = Str::upper(Str::slug($name, '_'));
        if ($code === '') {{
            $code = 'APP_TYPE';
        }}

        return ApplicationType::query()->firstOrCreate(
            ['code' => $code],
            [
                'name_en' => $name,
                'name_ar' => $name,
            ],
        );
    }}

    private function firstOrCreateVendor(?string $name): ?Vendor
    {{
        if ($name === null || trim($name) === '') {{
            return null;
        }}

        $name = trim($name);
        $normalized = $this->normalizeApplicationName($name);
        $existing = Vendor::withTrashed()->get()->first(
            fn (Vendor $vendor): bool => $this->normalizeApplicationName((string) $vendor->name) === $normalized
        );

        if ($existing instanceof Vendor) {{
            if ($existing->trashed()) {{
                $existing->restore();
            }}

            return $existing;
        }}

        return Vendor::query()->create([
            'name' => $name,
            'status' => true,
            'remarks' => str_starts_with($name, 'TODO') || str_starts_with($name, 'Unknown')
                ? 'Placeholder vendor created by Excel import'
                : 'Imported from PHASE2',
        ]);
    }}

    private function firstOrCreateTechnology(string $name): Technology
    {{
        $name = trim($name);
        $normalized = mb_strtolower($name);
        $existing = Technology::withTrashed()->get()->first(
            fn (Technology $technology): bool => mb_strtolower((string) $technology->name) === $normalized
        );

        if ($existing instanceof Technology) {{
            if ($existing->trashed()) {{
                $existing->restore();
            }}

            return $existing;
        }}

        return Technology::query()->create([
            'name' => $name,
            'category' => TechnologyCategory::Other,
            'description' => 'Imported from PHASE2 stack and technologies',
            'is_active' => true,
        ]);
    }}

    private function findStatus(string $code): ApplicationStatus
    {{
        $status = ApplicationStatus::query()->where('code', $code)->first()
            ?? ApplicationStatus::query()->where('code', 'Active')->first();

        if ($status instanceof ApplicationStatus) {{
            return $status;
        }}

        return ApplicationStatus::query()->firstOrCreate(
            ['code' => 'Active'],
            ['name_en' => 'Active', 'name_ar' => 'نشط', 'is_active' => true],
        );
    }}

    private function findCriticality(string $code): Criticality
    {{
        $criticality = Criticality::query()->where('code', $code)->first()
            ?? Criticality::query()->where('code', 'Medium')->first();

        if ($criticality instanceof Criticality) {{
            return $criticality;
        }}

        return Criticality::query()->firstOrCreate(
            ['code' => 'Medium'],
            ['name_en' => 'Medium', 'name_ar' => 'متوسط', 'is_active' => true],
        );
    }}

    private function findSupportType(string $code): SupportType
    {{
        $supportType = SupportType::query()->where('code', $code)->first()
            ?? SupportType::query()->where('code', 'Business Hours')->first();

        if ($supportType instanceof SupportType) {{
            return $supportType;
        }}

        return SupportType::query()->firstOrCreate(
            ['code' => 'Business Hours'],
            ['name_en' => 'Business Hours', 'name_ar' => 'ساعات العمل', 'is_active' => true],
        );
    }}

    private function uniqueApplicationCode(string $appName): string
    {{
        $base = Str::upper(Str::slug($appName, '_'));
        if ($base === '') {{
            $base = 'APP';
        }}
        $base = Str::limit($base, 90, '');
        $code = $base;
        $suffix = 1;

        while (Application::withTrashed()->where('code', $code)->exists()) {{
            $code = Str::limit($base, 80, '').'_'.$suffix;
            $suffix++;
        }}

        return $code;
    }}

    /**
     * @param  list<string>  $emails
     * @param  array<string, User>  $usersByEmail
     * @return list<int>
     */
    private function userIdsFromEmails(array $emails, array $usersByEmail): array
    {{
        $ids = [];
        foreach ($emails as $email) {{
            $user = $usersByEmail[mb_strtolower(trim((string) $email))] ?? null;
            if ($user instanceof User) {{
                $ids[] = (int) $user->id;
            }}
        }}

        return array_values(array_unique($ids));
    }}

    private function assignSpatieRole(User $user, string $roleName): void
    {{
        if (! $user->hasRole($roleName)) {{
            $user->assignRole($roleName);
        }}
    }}

    private function normalizePersonName(string $name): string
    {{
        return mb_strtolower(trim((string) preg_replace('/\\s+/u', ' ', $name)));
    }}

    private function normalizeApplicationName(string $name): string
    {{
        return mb_strtolower(trim((string) preg_replace('/\\s+/u', ' ', $name)));
    }}

    private function nullableString(mixed $value): ?string
    {{
        if (! is_string($value)) {{
            return null;
        }}

        $trimmed = trim($value);

        return $trimmed === '' ? null : $trimmed;
    }}

    /**
     * @return list<array<string, mixed>>
     */
    private function importedUsers(): array
    {{
        return {users_php};
    }}

    /**
     * @return list<array<string, mixed>>
     */
    private function importedApplications(): array
    {{
        return {applications_php};
    }}

    /**
     * @return list<array<string, mixed>>
     */
    private function importedAssignments(): array
    {{
        return {assignments_php};
    }}
}}
"""


def _user_payload(user: CanonicalUser) -> dict[str, Any]:
    return {
        "first_name": user.first_name,
        "last_name": user.last_name,
        "email": user.email,
        "phone": user.phone,
        "role": user.spatie_role or "employee",
    }


def _application_payload(application: CanonicalApplication) -> dict[str, Any]:
    return {
        "name_en": application.name,
        "name_ar": application.name,
        "application_type": application.application_type,
        "department": application.department,
        "technical_category": application.technical_category,
        "description": application.description,
        "vendor": application.vendor,
        "status": application.status,
        "criticality": application.criticality,
        "support_type": application.support_type,
        "technologies": application.technologies,
        "remarks": application.remarks,
        "management_owner_emails": list(getattr(application, "_owner_emails", [])),
        "application_lead_emails": list(getattr(application, "_lead_emails", [])),
    }


def _assignment_payload(assignment: CanonicalAssignment) -> dict[str, Any]:
    return {
        "user_email": assignment.user_email,
        "application_name": assignment.application_name,
        "app_role": assignment.app_role,
        "is_primary": assignment.is_primary,
        "remarks": assignment.remarks,
    }


def enrich_application_owners(result: ImportResult) -> None:
    owners: dict[str, set[str]] = {}
    leads: dict[str, set[str]] = {}
    for assignment in result.assignments:
        key = assignment.application_name.casefold()
        if assignment.app_role == "ZATCA Management":
            owners.setdefault(key, set()).add(assignment.user_email)
        if assignment.app_role == "Application Lead":
            leads.setdefault(key, set()).add(assignment.user_email)

    for application in result.applications:
        key = application.name.casefold()
        application_owners = sorted(owners.get(key, set()))
        application_leads = sorted(leads.get(key, set()))
        # Stash on the object for the payload builder via attributes.
        setattr(application, "_owner_emails", application_owners)
        setattr(application, "_lead_emails", application_leads)


def _php_array(value: Any, indent: int = 0) -> str:
    spacer = " " * indent
    if isinstance(value, dict):
        if not value:
            return "[]"
        lines = ["["]
        for key, item in value.items():
            rendered = _php_array(item, indent + 4)
            lines.append(f"{spacer}    {_php_key(key)} => {rendered},")
        lines.append(f"{spacer}]")
        return "\n".join(lines)
    if isinstance(value, list):
        if not value:
            return "[]"
        if all(not isinstance(item, (dict, list)) for item in value):
            inner = ", ".join(_php_array(item, 0) for item in value)
            return f"[{inner}]"
        lines = ["["]
        for item in value:
            rendered = _php_array(item, indent + 4)
            lines.append(f"{spacer}    {rendered},")
        lines.append(f"{spacer}]")
        return "\n".join(lines)
    if isinstance(value, bool):
        return "true" if value else "false"
    if value is None:
        return "null"
    if isinstance(value, int) and not isinstance(value, bool):
        return str(value)
    return _php_string(str(value))


def _php_key(key: str) -> str:
    return _php_string(key)


def _php_string(value: str) -> str:
    escaped = (
        value.replace("\\", "\\\\")
        .replace("'", "\\'")
        .replace("\r\n", "\n")
        .replace("\r", "\n")
        .replace("\n", "\\n")
    )
    return f"'{escaped}'"
