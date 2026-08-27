<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\TechnologyCategory;
use App\Models\AppRole;
use App\Models\Application;
use App\Models\ApplicationAssignment;
use App\Models\ApplicationStatus;
use App\Models\ApplicationType;
use App\Models\Criticality;
use App\Models\Department;
use App\Models\SupportType;
use App\Models\Technology;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;

/**
 * Primary portfolio seeder for users, app roles, departments, vendors,
 * technologies, applications, and assignments.
 *
 * Generated from Users + PHASE2 Excel files. Does not read Excel at runtime
 * and never truncates existing data (additive / idempotent).
 */
class ImportedPortfolioSeeder extends Seeder
{
    private const string DEFAULT_PASSWORD = 'password';

    /**
     * Higher number wins when the same user is assigned to the same application
     * from more than one Excel source. The schema allows one OPEN assignment
     * per (application_id, user_id).
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
    {
        DB::transaction(function (): void {
            $this->ensureSystemRoles();
            $this->ensureAppRoles();

            $defaultPasswordHash = self::DEFAULT_PASSWORD;
            $assigner = $this->seedStaticUsers($defaultPasswordHash);
            $usersByEmail = $this->seedUsers($defaultPasswordHash);
            $applicationsByName = $this->seedApplications($assigner, $usersByEmail);
            $this->seedAssignments($assigner, $usersByEmail, $applicationsByName);
        });
    }

    private function ensureSystemRoles(): void
    {
        foreach (['super_admin', 'infra_admin', 'sd_admin', 'viewer', 'employee'] as $roleName) {
            Role::findOrCreate($roleName, 'web');
        }
    }

    private function ensureAppRoles(): void
    {
        $roles = [
            ['name' => 'Admin', 'description' => 'Full application administration', 'sort_order' => 1],
            ['name' => 'Developer', 'description' => 'Development and deployment access', 'sort_order' => 2],
            ['name' => 'QA', 'description' => 'Quality assurance and testing', 'sort_order' => 3],
            ['name' => 'Support', 'description' => 'Operational support access', 'sort_order' => 4],
            ['name' => 'ZATCA Management', 'description' => 'ZATCA management ownership and oversight', 'sort_order' => 5],
            ['name' => 'Viewer', 'description' => 'Read-only application access', 'sort_order' => 6],
            ['name' => 'Application Lead', 'description' => 'ZATCA application lead and technical ownership', 'sort_order' => 7],
        ];

        foreach ($roles as $role) {
            AppRole::query()->firstOrCreate(
                ['name' => $role['name']],
                [
                    'description' => $role['description'],
                    'is_active' => true,
                    'sort_order' => $role['sort_order'],
                ],
            );
        }
    }

    private function seedStaticUsers(string $defaultPasswordHash): User
    {
        $superAdminEmail = mb_strtolower(trim((string) env('SUPER_ADMIN_EMAIL', 'admin@zatca.gov.sa')));
        $superAdminPassword = (string) env('SUPER_ADMIN_PASSWORD', self::DEFAULT_PASSWORD);
        $viewerEmail = mb_strtolower(trim((string) env('VIEWER_EMAIL', 'viewer@zatca.gov.sa')));
        $viewerPassword = (string) env('VIEWER_PASSWORD', self::DEFAULT_PASSWORD);

        $this->migrateLegacySuperAdminEmail($superAdminEmail);

        $staticUsers = [
            [
                'first_name' => 'Super',
                'last_name' => 'Admin',
                'email' => $superAdminEmail,
                'phone' => '5678910110',
                'role' => 'super_admin',
                'password' => $superAdminPassword,
                'reset_password' => true,
            ],
            [
                'first_name' => 'Super',
                'last_name' => 'Admin',
                'email' => 'super_admin@zatca.gov.sa',
                'phone' => '5678910110',
                'role' => 'super_admin',
                'password' => self::DEFAULT_PASSWORD,
                'reset_password' => false,
            ],
            [
                'first_name' => 'Infra',
                'last_name' => 'Admin',
                'email' => 'infra_admin@zatca.gov.sa',
                'phone' => '5678910110',
                'role' => 'infra_admin',
                'password' => self::DEFAULT_PASSWORD,
                'reset_password' => false,
            ],
            [
                'first_name' => 'SD',
                'last_name' => 'Admin',
                'email' => 'sd_admin@zatca.gov.sa',
                'phone' => '5678910110',
                'role' => 'sd_admin',
                'password' => self::DEFAULT_PASSWORD,
                'reset_password' => false,
            ],
            [
                'first_name' => 'Viewer',
                'last_name' => 'User',
                'email' => $viewerEmail,
                'phone' => '5678910110',
                'role' => 'viewer',
                'password' => $viewerPassword,
                'reset_password' => false,
            ],
        ];

        // Avoid creating the Excel static super-admin twice when env email matches it.
        $seenEmails = [];
        $superAdmin = null;

        foreach ($staticUsers as $row) {
            $email = mb_strtolower(trim((string) $row['email']));
            if ($email === '' || isset($seenEmails[$email])) {
                continue;
            }
            $seenEmails[$email] = true;

            $passwordHash = (string) $row['password'];
            $user = $this->persistUser($row, $passwordHash, (bool) $row['reset_password'], matchByName: false);
            $this->assignSpatieRole($user, (string) $row['role']);

            if ($email === $superAdminEmail) {
                $superAdmin = $user;
            }
        }

        if ($superAdmin instanceof User) {
            return $superAdmin;
        }

        $existing = User::query()->role('super_admin')->orderBy('id')->first();
        if ($existing instanceof User) {
            return $existing;
        }

        return User::query()->firstOrCreate(
            ['email' => 'system@zatca.gov.sa'],
            [
                'first_name' => 'System',
                'last_name' => 'Importer',
                'password' => $defaultPasswordHash,
                'is_active' => true,
                'email_verified_at' => now(),
            ],
        );
    }

    private function migrateLegacySuperAdminEmail(string $superAdminEmail): void
    {
        if ($superAdminEmail === 'admin@zatca.sa') {
            return;
        }

        $legacy = User::withTrashed()->where('email', 'admin@zatca.sa')->first();
        if (! $legacy instanceof User) {
            return;
        }

        $targetTaken = User::withTrashed()->where('email', $superAdminEmail)->exists();
        if ($targetTaken) {
            return;
        }

        if ($legacy->trashed()) {
            $legacy->restore();
        }

        $legacy->forceFill(['email' => $superAdminEmail])->save();
    }

    /**
     * @return array<string, User>
     */
    private function seedUsers(string $password): array
    {
        $usersByEmail = [];

        foreach ($this->importedUsers() as $row) {
            $user = $this->persistUser($row, $password);
            $role = $row['role'] ?? 'employee';
            if (is_string($role) && $role !== '') {
                $this->assignSpatieRole($user, $role);
            }
            $usersByEmail[mb_strtolower((string) $user->email)] = $user;
        }

        foreach (User::withTrashed()->get() as $user) {
            $usersByEmail[mb_strtolower((string) $user->email)] = $user;
        }

        return $usersByEmail;
    }

    /**
     * @param  array<string, mixed>  $row
     */
    private function persistUser(array $row, string $password, bool $resetPassword = false, bool $matchByName = true): User
    {
        $email = mb_strtolower(trim((string) $row['email']));
        $firstName = trim((string) $row['first_name']);
        $lastName = trim((string) $row['last_name']);
        $phone = $this->nullableString($row['phone'] ?? null);

        $user = User::withTrashed()->where('email', $email)->first();

        if ($matchByName && ! $user instanceof User) {
            $this->bootUserNameIndex();
            $user = $this->usersByNormalizedName[$this->normalizePersonName($firstName.' '.$lastName)] ?? null;
        }

        if ($user instanceof User) {
            if ($user->trashed()) {
                $user->restore();
            }

            $updates = [];
            if ($user->first_name === '' || $user->first_name === null) {
                $updates['first_name'] = $firstName;
            }
            if ($user->last_name === '' || $user->last_name === null) {
                $updates['last_name'] = $lastName;
            }
            if (($user->phone === null || $user->phone === '') && $phone !== null) {
                $updates['phone'] = $phone;
            }
            if (! $user->is_active) {
                $updates['is_active'] = true;
            }
            if ($resetPassword) {
                $updates['password'] = $password;
                $updates['is_active'] = true;
            }
            if ($updates !== []) {
                $user->update($updates);
            }

            $this->rememberUser($user);

            return $user;
        }

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
    }

    /**
     * @param  array<string, User>  $usersByEmail
     * @return array<string, Application>
     */
    private function seedApplications(User $assigner, array $usersByEmail): array
    {
        $applicationsByName = [];

        foreach ($this->importedApplications() as $row) {
            $name = trim((string) $row['name_en']);
            $normalized = $this->normalizeApplicationName($name);
            $application = $this->findApplication($name);

            $department = $this->firstOrCreateDepartment((string) $row['department']);
            $applicationType = $this->firstOrCreateApplicationType((string) $row['application_type']);
            $status = $this->findStatus((string) $row['status']);
            $criticality = $this->findCriticality((string) ($row['criticality'] ?? 'Medium'));
            $supportType = $this->findSupportType((string) $row['support_type']);
            $vendor = $this->firstOrCreateVendor($this->nullableString($row['vendor'] ?? null));

            if ($application instanceof Application) {
                if ($application->trashed()) {
                    $application->restore();
                }

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
            } else {
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
            }

            $this->rememberApplication($application);

            $technologyNames = $row['technologies'] ?? [];
            if (is_array($technologyNames) && $technologyNames !== []) {
                $technologyIds = [];
                foreach ($technologyNames as $technologyName) {
                    $technology = $this->firstOrCreateTechnology((string) $technologyName);
                    $technologyIds[] = $technology->id;
                }
                $application->technologies()->syncWithoutDetaching($technologyIds);
            }

            $ownerEmails = $row['management_owner_emails'] ?? [];
            $leadEmails = $row['application_lead_emails'] ?? [];
            if (is_array($ownerEmails) && $ownerEmails !== []) {
                $application->businessOwners()->syncWithoutDetaching(
                    $this->userIdsFromEmails($ownerEmails, $usersByEmail)
                );
            }
            if (is_array($leadEmails) && $leadEmails !== []) {
                $application->technicalOwners()->syncWithoutDetaching(
                    $this->userIdsFromEmails($leadEmails, $usersByEmail)
                );
            }

            $applicationsByName[$normalized] = $application;
        }

        foreach (Application::withTrashed()->get() as $application) {
            $applicationsByName[$this->normalizeApplicationName((string) $application->name_en)] = $application;
        }

        return $applicationsByName;
    }

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
    ): array {
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

        if ($includeCode) {
            $payload['code'] = $this->uniqueApplicationCode((string) $row['name_en']);
            $payload['created_by'] = $actorId;
        }

        if (Schema::hasColumn('applications', 'description')) {
            $payload['description'] = $this->nullableString($row['description'] ?? null);
        }
        if (Schema::hasColumn('applications', 'technical_category')) {
            $payload['technical_category'] = $this->nullableString($row['technical_category'] ?? null);
        }
        if (Schema::hasColumn('applications', 'vendor_id')) {
            $payload['vendor_id'] = $vendorId;
        }
        if (Schema::hasColumn('applications', 'remarks')) {
            $payload['remarks'] = $this->nullableString($row['remarks'] ?? null);
        }

        return $payload;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function withoutEmptyOverwrites(Application $application, array $payload): array
    {
        $filtered = [];

        foreach ($payload as $key => $value) {
            if ($value === null || $value === '') {
                continue;
            }

            $current = $application->getAttribute($key);
            if (
                is_string($current)
                && trim($current) !== ''
                && in_array($key, ['description', 'remarks', 'technical_category'], true)
                && is_string($value)
                && (str_starts_with($value, 'TODO') || str_starts_with($value, 'Unknown'))
            ) {
                continue;
            }

            $filtered[$key] = $value;
        }

        return $filtered;
    }

    /**
     * @param  array<string, User>  $usersByEmail
     * @param  array<string, Application>  $applicationsByName
     */
    private function seedAssignments(User $assigner, array $usersByEmail, array $applicationsByName): void
    {
        $roles = AppRole::query()->get()->keyBy(fn (AppRole $role): string => mb_strtolower($role->name));

        foreach ($this->importedAssignments() as $row) {
            $user = $usersByEmail[mb_strtolower((string) $row['user_email'])] ?? null;
            $application = $applicationsByName[$this->normalizeApplicationName((string) $row['application_name'])] ?? null;
            $role = $roles->get(mb_strtolower((string) $row['app_role']));

            if (! $user instanceof User || ! $application instanceof Application || ! $role instanceof AppRole) {
                continue;
            }

            $existing = ApplicationAssignment::query()
                ->where('application_id', $application->id)
                ->where('user_id', $user->id)
                ->open()
                ->first();

            $incomingRank = self::APP_ROLE_RANK[$role->name] ?? 0;
            $remarks = $this->nullableString($row['remarks'] ?? null);
            $isPrimary = (bool) ($row['is_primary'] ?? false);

            if ($existing instanceof ApplicationAssignment) {
                $currentRoleName = (string) ($existing->appRole()->value('name') ?? '');
                $currentRank = self::APP_ROLE_RANK[$currentRoleName] ?? 0;
                $updates = [];
                if ($incomingRank > $currentRank) {
                    $updates['app_role_id'] = $role->id;
                }
                if ($isPrimary && ! $existing->is_primary) {
                    $updates['is_primary'] = true;
                }
                if ($remarks !== null) {
                    $currentRemarks = trim((string) ($existing->remarks ?? ''));
                    if ($currentRemarks === '') {
                        $updates['remarks'] = $remarks;
                    } elseif (! str_contains($currentRemarks, $remarks)) {
                        $updates['remarks'] = $currentRemarks.' | '.$remarks;
                    }
                }
                if ($updates !== []) {
                    $existing->update($updates);
                }
                continue;
            }

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
        }
    }

    private function findApplication(string $name): ?Application
    {
        $this->bootApplicationNameIndex();

        return $this->applicationsByNormalizedName[$this->normalizeApplicationName($name)] ?? null;
    }

    private function bootUserNameIndex(): void
    {
        if ($this->usersByNormalizedName !== []) {
            return;
        }

        foreach (User::withTrashed()->get() as $user) {
            $this->rememberUser($user);
        }
    }

    private function rememberUser(User $user): void
    {
        $this->usersByNormalizedName[$this->normalizePersonName(
            trim((string) $user->first_name.' '.(string) $user->last_name)
        )] = $user;
    }

    private function bootApplicationNameIndex(): void
    {
        if ($this->applicationsByNormalizedName !== []) {
            return;
        }

        foreach (Application::withTrashed()->get() as $application) {
            $this->rememberApplication($application);
        }
    }

    private function rememberApplication(Application $application): void
    {
        $this->applicationsByNormalizedName[$this->normalizeApplicationName((string) $application->name_en)] = $application;
        $this->applicationsByNormalizedName[$this->normalizeApplicationName((string) $application->name_ar)] = $application;
    }

    private function firstOrCreateDepartment(string $name): Department
    {
        $name = trim($name) !== '' ? trim($name) : 'TODO - Needs Review';
        $normalized = $this->normalizeApplicationName($name);
        $existing = Department::withTrashed()->get()->first(
            function (Department $department) use ($normalized): bool {
                $existingName = $this->normalizeApplicationName((string) $department->name_en);
                if ($existingName === $normalized) {
                    return true;
                }
                if ($normalized === 'customs' && str_contains($existingName, 'custom')) {
                    return true;
                }
                if ($normalized === 'internal' && (str_contains($existingName, 'zakat') || str_contains($existingName, 'tax'))) {
                    return true;
                }

                return false;
            }
        );

        if ($existing instanceof Department) {
            if ($existing->trashed()) {
                $existing->restore();
            }

            return $existing;
        }

        return Department::query()->firstOrCreate(
            ['name_en' => $name],
            ['name_ar' => $name],
        );
    }

    private function firstOrCreateApplicationType(string $name): ApplicationType
    {
        $name = trim($name) !== '' ? trim($name) : 'Internal App';
        $normalized = $this->normalizeApplicationName($name);
        $existing = ApplicationType::query()->get()->first(
            fn (ApplicationType $type): bool => $this->normalizeApplicationName((string) $type->name_en) === $normalized
                || $this->normalizeApplicationName((string) $type->code) === $normalized
        );

        if ($existing instanceof ApplicationType) {
            return $existing;
        }

        $code = Str::upper(Str::slug($name, '_'));
        if ($code === '') {
            $code = 'APP_TYPE';
        }

        return ApplicationType::query()->firstOrCreate(
            ['code' => $code],
            [
                'name_en' => $name,
                'name_ar' => $name,
            ],
        );
    }

    private function firstOrCreateVendor(?string $name): ?Vendor
    {
        if ($name === null || trim($name) === '') {
            return null;
        }

        $name = trim($name);
        $normalized = $this->normalizeApplicationName($name);
        $existing = Vendor::withTrashed()->get()->first(
            fn (Vendor $vendor): bool => $this->normalizeApplicationName((string) $vendor->name) === $normalized
        );

        if ($existing instanceof Vendor) {
            if ($existing->trashed()) {
                $existing->restore();
            }

            return $existing;
        }

        return Vendor::query()->firstOrCreate(
            ['name' => $name],
            [
                'status' => true,
                'remarks' => str_starts_with($name, 'TODO') || str_starts_with($name, 'Unknown')
                    ? 'Placeholder vendor created by Excel import'
                    : 'Imported from PHASE2',
                    ],
                    );
                }
            
                private function firstOrCreateTechnology(string $name): Technology
                {
                    $name = trim($name);
                    $normalized = mb_strtolower($name);
                    $existing = Technology::withTrashed()->get()->first(
                        fn (Technology $technology): bool => mb_strtolower((string) $technology->name) === $normalized
                    );
            
                    if ($existing instanceof Technology) {
                        if ($existing->trashed()) {
                            $existing->restore();
                        }
            
                        return $existing;
                    }
            
                    return Technology::query()->firstOrCreate(
                        ['name' => $name],
                        [
                            'category' => TechnologyCategory::Other,
                            'description' => 'Imported from PHASE2 stack and technologies',
                            'is_active' => true,
                        ],
                    );
                }
            
                private function findStatus(string $code): ApplicationStatus
                {
                    $status = ApplicationStatus::query()->where('code', $code)->first()
                        ?? ApplicationStatus::query()->where('code', 'Active')->first();
            
                    if ($status instanceof ApplicationStatus) {
                        return $status;
                    }
            
                    return ApplicationStatus::query()->firstOrCreate(
                        ['code' => 'Active'],
                        ['name_en' => 'Active', 'name_ar' => 'نشط', 'is_active' => true],
                    );
                }
            
                private function findCriticality(string $code): Criticality
                {
                    $criticality = Criticality::query()->where('code', $code)->first()
                        ?? Criticality::query()->where('code', 'Medium')->first();
            
                    if ($criticality instanceof Criticality) {
                        return $criticality;
                    }
            
                    return Criticality::query()->firstOrCreate(
                        ['code' => 'Medium'],
                        ['name_en' => 'Medium', 'name_ar' => 'متوسط', 'is_active' => true],
                    );
                }
            
                private function findSupportType(string $code): SupportType
                {
                    $supportType = SupportType::query()->where('code', $code)->first()
                        ?? SupportType::query()->where('code', 'Business Hours')->first();
            
                    if ($supportType instanceof SupportType) {
                        return $supportType;
                    }
            
                    return SupportType::query()->firstOrCreate(
                        ['code' => 'Business Hours'],
                        ['name_en' => 'Business Hours', 'name_ar' => 'ساعات العمل', 'is_active' => true],
                    );
                }
            
                private function uniqueApplicationCode(string $appName): string
                {
                    $base = Str::upper(Str::slug($appName, '_'));
                    if ($base === '') {
                        $base = 'APP';
                    }
                    $base = Str::limit($base, 90, '');
                    $code = $base;
                    $suffix = 1;
            
                    while (Application::withTrashed()->where('code', $code)->exists()) {
                        $code = Str::limit($base, 80, '').'_'.$suffix;
                        $suffix++;
                    }
            
                    return $code;
                }
            
                /**
                 * @param  list<string>  $emails
                 * @param  array<string, User>  $usersByEmail
                 * @return list<int>
                 */
                private function userIdsFromEmails(array $emails, array $usersByEmail): array
                {
                    $ids = [];
                    foreach ($emails as $email) {
                        $user = $usersByEmail[mb_strtolower(trim((string) $email))] ?? null;
                        if ($user instanceof User) {
                            $ids[] = (int) $user->id;
                        }
                    }
            
                    return array_values(array_unique($ids));
                }
            
                private function assignSpatieRole(User $user, string $roleName): void
                {
                    if (! $user->hasRole($roleName)) {
                        $user->assignRole($roleName);
                    }
                }
            
                private function normalizePersonName(string $name): string
                {
                    return mb_strtolower(trim((string) preg_replace('/\s+/u', ' ', $name)));
                }
            
                private function normalizeApplicationName(string $name): string
                {
                    return mb_strtolower(trim((string) preg_replace('/\s+/u', ' ', $name)));
                }
            
                private function nullableString(mixed $value): ?string
                {
                    if (! is_string($value)) {
                        return null;
                    }
            
                    $trimmed = trim($value);
            
                    return $trimmed === '' ? null : $trimmed;
                }
            
                /**
                 * @return list<array<string, mixed>>
                 */
                private function importedUsers(): array
                {
                    return [
                        [
                            'first_name' => 'Ahmed',
                            'last_name' => 'Abdelmonaem',
                            'email' => 'aabdelmonaem@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Ahmed',
                            'last_name' => 'Abdulkarima',
                            'email' => 'aabdulkarima@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Amer',
                            'last_name' => 'Abdulmaksood',
                            'email' => 'aabdulmaksood@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Abdulaziz',
                            'last_name' => 'Alhisan',
                            'email' => 'aalhisan@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Amjad',
                            'last_name' => 'Alhothily',
                            'email' => 'aalhothily@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Amjad',
                            'last_name' => 'Alhotily',
                            'email' => 'aalhotily@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Ahmed',
                            'last_name' => 'Almanna',
                            'email' => 'aalmanna@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Ali',
                            'last_name' => 'Almotiri',
                            'email' => 'aalmotiri@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Abdulah',
                            'last_name' => 'Alonazi',
                            'email' => 'aalonazi@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Abdullah',
                            'last_name' => 'Alotaibi',
                            'email' => 'aalotaibi@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Abdullah',
                            'last_name' => 'Alsaleh',
                            'email' => 'aalsaleh@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Abdulaziz',
                            'last_name' => 'Alsalim',
                            'email' => 'aalsalim@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Abeer',
                            'last_name' => 'Alshammari',
                            'email' => 'aalshammar-c@zatca.gov.sa',
                            'phone' => '580006869',
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Abeer',
                            'last_name' => 'Alshamri',
                            'email' => 'aalshamri@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Abdullah',
                            'last_name' => 'Alsubaie',
                            'email' => 'aalsubaie@zatca.gov.sa',
                            'phone' => '505333689',
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Ahmed',
                            'last_name' => 'Alzahrani',
                            'email' => 'aalzahrani@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Amjad',
                            'last_name' => 'Amjad',
                            'email' => 'aamjad@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Asma',
                            'last_name' => 'Asma',
                            'email' => 'aasma@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Arnab',
                            'last_name' => 'Bhattacharya',
                            'email' => 'abhattacharya@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Donthireddy',
                            'last_name' => 'Anudeepreddy',
                            'email' => 'adonthired-c@zatca.gov.sa',
                            'phone' => '545638227',
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Anudeep',
                            'last_name' => 'Donthireddy',
                            'email' => 'adonthireddy@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Ali',
                            'last_name' => 'Farhan',
                            'email' => 'afarhan@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Abdullah',
                            'last_name' => 'Galal',
                            'email' => 'agalal@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Amjad',
                            'last_name' => 'Fahad',
                            'email' => 'ahuthaily-c@zatca.gov.sa',
                            'phone' => '535842515',
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Ayman',
                            'last_name' => 'Jad',
                            'email' => 'ajad@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Amjad',
                            'last_name' => 'Al-Jenidil',
                            'email' => 'ajenidil-c@zatca.gov.sa',
                            'phone' => '533159730',
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Ashfaq',
                            'last_name' => 'Khalifa',
                            'email' => 'akhalifa@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Ajith',
                            'last_name' => 'PG -Syed Siraj',
                            'email' => 'apg-syedsiraj@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Ajith',
                            'last_name' => 'PG',
                            'email' => 'apg@zatca.gov.sa',
                            'phone' => '536426372',
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Ahmad',
                            'last_name' => 'Saleh',
                            'email' => 'asaleh@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Batool',
                            'last_name' => 'Albubali',
                            'email' => 'balbubali@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Bassam',
                            'last_name' => 'Ismail',
                            'email' => 'bismail@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Utkarsh',
                            'last_name' => 'Chalkapurkar',
                            'email' => 'chalkapurk-c@zatca.gov.sa',
                            'phone' => '558299608',
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Chandra',
                            'last_name' => 'Mishara',
                            'email' => 'cmishara@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Chandra',
                            'last_name' => 'Mirsha',
                            'email' => 'cmishra-c@zatca.gov.sa',
                            'phone' => '509253778',
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Dev',
                            'last_name' => 'Dev',
                            'email' => 'ddev@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'DPP',
                            'last_name' => 'Team',
                            'email' => 'dteam@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Eyad',
                            'last_name' => 'Almalki',
                            'email' => 'ealmalki@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Fadi',
                            'last_name' => 'Abusafia',
                            'email' => 'fabusafia@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Fatima',
                            'last_name' => 'S. Ghazwani',
                            'email' => 'faghazwani-c@zatca.gov.sa',
                            'phone' => '537057160',
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Fawaz',
                            'last_name' => 'Alharbi',
                            'email' => 'fawharbi-c@zatca.gov.sa',
                            'phone' => '598217233',
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Fatimah',
                            'last_name' => 'Fatimah',
                            'email' => 'ffatimah@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Fawaz',
                            'last_name' => 'Fawaz',
                            'email' => 'ffawaz@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Fadi',
                            'last_name' => 'Ibrahim Abusafiyah',
                            'email' => 'fibrahimabusafiyah@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Firoz',
                            'last_name' => 'Khan',
                            'email' => 'fkhan@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'GOWNE',
                            'last_name' => 'SUMANTHKUMAR REDDY',
                            'email' => 'gokumar-c@zatca.gov.sa',
                            'phone' => '538728203',
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Gowne',
                            'last_name' => 'Sumant',
                            'email' => 'gsumant@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Gowne',
                            'last_name' => 'Sumanth',
                            'email' => 'gsumanth@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Haseena',
                            'last_name' => 'Pathiyassery Abdul Kareem',
                            'email' => 'habdulkari-c@zatca.gov.sa',
                            'phone' => '509651225',
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Hashash',
                            'last_name' => 'Aldousary',
                            'email' => 'haldousary@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Hassan',
                            'last_name' => 'Alkhwalda',
                            'email' => 'halkhwalda@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Hasan',
                            'last_name' => 'Alsadi',
                            'email' => 'halsadi@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Hajer',
                            'last_name' => 'Alsehri',
                            'email' => 'halsehri@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Hayfa',
                            'last_name' => 'Alsharif',
                            'email' => 'halsharif@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Hasena',
                            'last_name' => 'Hasena',
                            'email' => 'hhasena@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Hayfa',
                            'last_name' => 'Hayfa',
                            'email' => 'hhayfa@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Hisham',
                            'last_name' => 'Hisham',
                            'email' => 'hhisham@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'HAJAR',
                            'last_name' => 'AL-SHEHRI',
                            'email' => 'hsheri-c@zatca.gov.sa',
                            'phone' => '549453364',
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Islam',
                            'last_name' => 'Ibrahiem',
                            'email' => 'iibrahem-c@zatca.gov.sa',
                            'phone' => '560045848',
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Islam',
                            'last_name' => 'Ibrahim',
                            'email' => 'iibrahim@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Imran',
                            'last_name' => 'Imran',
                            'email' => 'iimran@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Indu',
                            'last_name' => 'Indu',
                            'email' => 'iindu@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Ismail',
                            'last_name' => 'Ismail',
                            'email' => 'iismail@zatca.gov.sa',
                            'phone' => null,
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Imran',
                            'last_name' => 'Ahmed Khan',
                            'email' => 'imrkhan-c@zatca.gov.sa',
                            'phone' => '536139122',
                            'role' => 'employee',
                        ],
                        [
                            'first_name' => 'Indu',
                            'last_name' => 'Prakash Nigam',
                            'email' => 'inigam-c@zatca.gov.sa',
                            'phone' => '531508748',
                            'role' => 'employee',
                        ],
                        [
                                'first_name' => 'Indu',
                                'last_name' => 'Nigam',
                                'email' => 'inigam@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Joud',
                                'last_name' => 'Albalwi',
                                'email' => 'jalbalwi@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Joud',
                                'last_name' => 'Albalawi',
                                'email' => 'jbalawi-c@zatca.gov.sa',
                                'phone' => '552936689',
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Jhona',
                                'last_name' => 'Jhona',
                                'email' => 'jjhona@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Jonah',
                                'last_name' => 'Jonah',
                                'email' => 'jjonah@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Jonah',
                                'last_name' => 'Anurag Rachapudi',
                                'email' => 'jrachapudi-c@zatca.gov.sa',
                                'phone' => '552812874',
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Karim',
                                'last_name' => 'Elmetenawy',
                                'email' => 'kelmetenawy@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Kiran',
                                'last_name' => 'J',
                                'email' => 'kjajula-c@zatca.gov.sa',
                                'phone' => '500438137',
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Kiran',
                                'last_name' => 'Jajula',
                                'email' => 'kjajula@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Kasim',
                                'last_name' => 'Kasim',
                                'email' => 'kkasim@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Katherbasha',
                                'last_name' => 'Katherbasha',
                                'email' => 'kkatherbasha@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Kishor',
                                'last_name' => 'Kishor',
                                'email' => 'kkishor@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Koti',
                                'last_name' => 'Koti',
                                'email' => 'kkoti@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Katherbhasha',
                                'last_name' => 'Katherbhasha',
                                'email' => 'kmabubasha-c@zatca.gov.sa',
                                'phone' => '572040143',
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Kishore',
                                'last_name' => 'Pentakota',
                                'email' => 'kpentakota-c@zatca.gov.sa',
                                'phone' => '508382963',
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Leen',
                                'last_name' => 'Alswid',
                                'email' => 'lalswid@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Latefa',
                                'last_name' => 'M. Alqhofaily',
                                'email' => 'lm.alqhofaily@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Laith',
                                'last_name' => 'N. Al-Momani',
                                'email' => 'ln.al-momani@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Mohammed',
                                'last_name' => 'Ahmed',
                                'email' => 'mahmed@zatca.gov.sa',
                                'phone' => '534824706',
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Mohammed',
                                'last_name' => 'Al Dhafer',
                                'email' => 'maldhafer@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Mujtaba',
                                'last_name' => 'Almuhana',
                                'email' => 'malmuhana@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Mishal',
                                'last_name' => 'Alobid',
                                'email' => 'malobid@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Mansour',
                                'last_name' => 'Alqahtani',
                                'email' => 'malqahtani@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Mohammed',
                                'last_name' => 'Alsadoon',
                                'email' => 'malsadoon@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Mohammed',
                                'last_name' => 'Alshaharani',
                                'email' => 'malshaharani@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Mohammed',
                                'last_name' => 'Alshiki',
                                'email' => 'malshiki@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Munirah',
                                'last_name' => 'Alsunaidi',
                                'email' => 'malsunaidi@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Mohammed',
                                'last_name' => 'Amer',
                                'email' => 'mamer@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Mohammed',
                                'last_name' => 'Ayman',
                                'email' => 'mayman@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Mohammed',
                                'last_name' => 'Diab',
                                'email' => 'mdiab@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Mahmoud',
                                'last_name' => 'Dorgamy',
                                'email' => 'mdorgamy@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Mahmoud',
                                'last_name' => 'El-Dorghamy',
                                'email' => 'mdorghamy-c@zatca.gov.sa',
                                'phone' => '555382905',
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Mohammed',
                                'last_name' => 'Ezz',
                                'email' => 'mezz@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Mohammed',
                                'last_name' => 'Hasan',
                                'email' => 'mhasan@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Mirza',
                                'last_name' => 'Beg',
                                'email' => 'mirbeg-c@zatca.gov.sa',
                                'phone' => '545623842',
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Mahmoud',
                                'last_name' => 'Kamal',
                                'email' => 'mkamal@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Mohamed',
                                'last_name' => 'Mahdy',
                                'email' => 'mmahdy@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Mirza',
                                'last_name' => 'Mirza',
                                'email' => 'mmirza@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Maysaa',
                                'last_name' => 'Mohammed',
                                'email' => 'mmohammed@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Muneeb',
                                'last_name' => 'Muneeb',
                                'email' => 'mmuneeb@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Muteb',
                                'last_name' => 'Muteb',
                                'email' => 'mmuteb@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Meshal',
                                'last_name' => 'Alobaid',
                                'email' => 'mobaid-c@zatca.gov.sa',
                                'phone' => '591921920',
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Mohd',
                                'last_name' => 'Sohail Khan',
                                'email' => 'mohkhan-c@zatca.gov.sa',
                                'phone' => '576869159',
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Moustafa',
                                'last_name' => 'Yehia',
                                'email' => 'moyehia-c@zatca.gov.sa',
                                'phone' => '534030870',
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Mohammed',
                                'last_name' => 'Alshaikhi',
                                'email' => 'mshaikhi-c@myzatca.gov.sa',
                                'phone' => '547149022',
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Mohammed',
                                'last_name' => 'Shoueb',
                                'email' => 'mshoueb@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Nadeem',
                                'last_name' => 'Ahmed',
                                'email' => 'nahmed@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Narender',
                                'last_name' => 'Alekatte',
                                'email' => 'nalekatte@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Najod',
                                'last_name' => 'Algulifi',
                                'email' => 'nalgulifi@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Nada',
                                'last_name' => 'Alonazi',
                                'email' => 'nalonazi@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Nada',
                                'last_name' => 'Alonazi Muteb',
                                'email' => 'nalonazimuteb@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Koteshwar',
                                'last_name' => 'Rao',
                                'email' => 'narao-c@zatca.gov.sa',
                                'phone' => '536276164',
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Nader',
                                'last_name' => 'Ezzat',
                                'email' => 'nezzat@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Nagy',
                                'last_name' => 'Farag Ali',
                                'email' => 'nfaragali@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Njoud',
                                'last_name' => 'Khaled Aljulayfi',
                                'email' => 'njulafi-c@zatca.gov.sa',
                                'phone' => '500912500',
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Nasser',
                                'last_name' => 'K. ALsubaie',
                                'email' => 'nk.alsubaie@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Nadeem',
                                'last_name' => 'Mohammed',
                                'email' => 'nmohammed@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Neehal',
                                'last_name' => 'Almuways',
                                'email' => 'nmuways-c@zatca.gov.sa',
                                'phone' => '599498909',
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Nabila',
                                'last_name' => 'Nabila',
                                'email' => 'nnabila@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Neehal',
                                'last_name' => 'Neehal',
                                'email' => 'nneehal@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Nehal',
                                'last_name' => 'Nehal',
                                'email' => 'nnehal@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Nikhilesh',
                                'last_name' => 'Nikhilesh',
                                'email' => 'nnikhilesh@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Niklish',
                                'last_name' => 'Niklish',
                                'email' => 'nniklish@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Nabila',
                                'last_name' => 'Sayed',
                                'email' => 'nsayed@zatca.gov.sa',
                                'phone' => '537694489',
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Nikilesh',
                                'last_name' => 'Nikilesh',
                                'email' => 'nsivakoti-c@zatca.gov.sa',
                                'phone' => '535791712',
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Syed',
                                'last_name' => 'Nisar Ahmed',
                                'email' => 'nsyed-c@zatca.gov.sa',
                                'phone' => '538896114',
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Osama',
                                'last_name' => 'Kalam',
                                'email' => 'okalam@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Raed',
                                'last_name' => 'Alabbad',
                                'email' => 'ralabbad@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Rahil',
                                'last_name' => 'Azahem',
                                'email' => 'razahem@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Rupam',
                                'last_name' => 'Dutta',
                                'email' => 'rdutta@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Renad',
                                'last_name' => 'Alhussain',
                                'email' => 'rhussain-c@zatca.gov.sa',
                                'phone' => '538942969',
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Renad',
                                'last_name' => 'Renad',
                                'email' => 'rrenad@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Syed',
                                'last_name' => 'Akram',
                                'email' => 'sakram@zatca.gov.sa',
                                'phone' => '503478360',
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Safar',
                                'last_name' => 'Alqahtani',
                                'email' => 'salqahtani@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Safar',
                                'last_name' => 'Alqahtani Ahmed Alzahrani Zaki Hussain',
                                'email' => 'salqahtaniahmedalzahranizakihussain@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Sridhar',
                                'last_name' => 'C',
                                'email' => 'schilukurt-c@zatca.gov.sa',
                                'phone' => '537909852',
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Sridhar',
                                'last_name' => 'Chilukurty',
                                'email' => 'schilukurty@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Sai',
                                'last_name' => 'Divyadhar Vidadala',
                                'email' => 'sdivyadharvidadala@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Shabbeer',
                                'last_name' => 'Mohammed',
                                'email' => 'shamohamme-c@zatca.gov.sa',
                                'phone' => '533864821',
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Shoueb',
                                'last_name' => 'Mohammed',
                                'email' => 'shomohamme-c@zatca.gov.sa',
                                'phone' => '556601937',
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Syed',
                                'last_name' => 'Nisar',
                                'email' => 'snisar@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Shaden',
                                'last_name' => 'Alowaidah',
                                'email' => 'sowaidah-c@zatca.gov.sa',
                                'phone' => '555221720',
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Surya',
                                'last_name' => 'Kumar',
                                'email' => 'srayee-c@zatca.gov.sa',
                                'phone' => '598329938',
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Syed',
                                'last_name' => 'Safiullah',
                                'email' => 'ssafiullah-c@zatca.gov.sa',
                                'phone' => '539069139',
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Syed',
                                'last_name' => 'Saifullah',
                                'email' => 'ssaifullah@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                            ],
                            [
                                'first_name' => 'Saleh',
                                'last_name' => 'Saleh',
                                'email' => 'ssaleh@zatca.gov.sa',
                                'phone' => null,
                                'role' => 'employee',
                                ],
                                [
                                    'first_name' => 'Srinath',
                                    'last_name' => 'Sampathy',
                                    'email' => 'ssampathy-c@zatca.gov.sa',
                                    'phone' => '507729232',
                                    'role' => 'employee',
                                ],
                                [
                                    'first_name' => 'Shaden',
                                    'last_name' => 'Shaden',
                                    'email' => 'sshaden@zatca.gov.sa',
                                    'phone' => null,
                                    'role' => 'employee',
                                ],
                                [
                                    'first_name' => 'Shoueb',
                                    'last_name' => 'Shoueb',
                                    'email' => 'sshoueb@zatca.gov.sa',
                                    'phone' => null,
                                    'role' => 'employee',
                                ],
                                [
                                    'first_name' => 'Syed',
                                    'last_name' => 'Siraj',
                                    'email' => 'ssiraj@zatca.gov.sa',
                                    'phone' => '509433698',
                                    'role' => 'employee',
                                ],
                                [
                                    'first_name' => 'Sohail',
                                    'last_name' => 'Sohail',
                                    'email' => 'ssohail@zatca.gov.sa',
                                    'phone' => null,
                                    'role' => 'employee',
                                ],
                                [
                                    'first_name' => 'Srinath',
                                    'last_name' => 'Srinath',
                                    'email' => 'ssrinath@zatca.gov.sa',
                                    'phone' => null,
                                    'role' => 'employee',
                                ],
                                [
                                    'first_name' => 'Surya',
                                    'last_name' => 'Surya',
                                    'email' => 'ssurya@zatca.gov.sa',
                                    'phone' => null,
                                    'role' => 'employee',
                                ],
                                [
                                    'first_name' => 'Tameem',
                                    'last_name' => 'Tameem',
                                    'email' => 'ttameem@zatca.gov.sa',
                                    'phone' => null,
                                    'role' => 'employee',
                                ],
                                [
                                    'first_name' => 'Utkash',
                                    'last_name' => 'Utkash',
                                    'email' => 'uutkash@zatca.gov.sa',
                                    'phone' => null,
                                    'role' => 'employee',
                                ],
                                [
                                    'first_name' => 'Vijender',
                                    'last_name' => 'Gadag',
                                    'email' => 'vgadag@zatca.gov.sa',
                                    'phone' => null,
                                    'role' => 'employee',
                                ],
                                [
                                    'first_name' => 'Venugopal',
                                    'last_name' => 'Pesari',
                                    'email' => 'vpesari-c@zatca.gov.sa',
                                    'phone' => '553714053',
                                    'role' => 'employee',
                                ],
                                [
                                    'first_name' => 'Venu',
                                    'last_name' => 'Pesari -Srinath Sampthy',
                                    'email' => 'vpesari-srinathsampthy@zatca.gov.sa',
                                    'phone' => null,
                                    'role' => 'employee',
                                ],
                                [
                                    'first_name' => 'Venu',
                                    'last_name' => 'Pesari',
                                    'email' => 'vpesari@zatca.gov.sa',
                                    'phone' => null,
                                    'role' => 'employee',
                                ],
                                [
                                    'first_name' => 'Venkata',
                                    'last_name' => 'Sabbarapu',
                                    'email' => 'vsabbarapu@zatca.gov.sa',
                                    'phone' => '552659136',
                                    'role' => 'employee',
                                ],
                                [
                                    'first_name' => 'Venkata',
                                    'last_name' => 'Venkata',
                                    'email' => 'vvenkata@zatca.gov.sa',
                                    'phone' => null,
                                    'role' => 'employee',
                                ],
                                [
                                    'first_name' => 'Venu',
                                    'last_name' => 'Venu',
                                    'email' => 'vvenu@zatca.gov.sa',
                                    'phone' => null,
                                    'role' => 'employee',
                                ],
                                [
                                    'first_name' => 'Wafa',
                                    'last_name' => 'Alofi',
                                    'email' => 'walofi@zatca.gov.sa',
                                    'phone' => null,
                                    'role' => 'employee',
                                ],
                                [
                                    'first_name' => 'Wafa',
                                    'last_name' => 'Aloufi',
                                    'email' => 'waloufi@zatca.gov.sa',
                                    'phone' => '549517499',
                                    'role' => 'employee',
                                ],
                                [
                                    'first_name' => 'Yaser',
                                    'last_name' => 'Hasan',
                                    'email' => 'yhasan@zatca.gov.sa',
                                    'phone' => null,
                                    'role' => 'employee',
                                ],
                                [
                                    'first_name' => 'Zubair',
                                    'last_name' => 'Ahmed',
                                    'email' => 'zahmed@zatca.gov.sa',
                                    'phone' => null,
                                    'role' => 'employee',
                                ],
                                [
                                    'first_name' => 'Zaid',
                                    'last_name' => 'Alharbi',
                                    'email' => 'zalharbi@zatca.gov.sa',
                                    'phone' => null,
                                    'role' => 'employee',
                                ],
                                [
                                    'first_name' => 'Zaki',
                                    'last_name' => 'Hussain',
                                    'email' => 'zhussain@zatca.gov.sa',
                                    'phone' => null,
                                    'role' => 'employee',
                                ],
                                [
                                    'first_name' => 'Zubair',
                                    'last_name' => 'j. shaik',
                                    'email' => 'zj.shaik@zatca.gov.sa',
                                    'phone' => null,
                                    'role' => 'employee',
                                ],
                            ];
                        }
                    
                        /**
                         * @return list<array<string, mixed>>
                         */
                        private function importedApplications(): array
                        {
                            return [
                                [
                                    'name_en' => '(SMS Portal) Rayah',
                                    'name_ar' => '(SMS Portal) Rayah',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Application',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['"Asp.net"', '"SharePoint"'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['malshaharani@zatca.gov.sa'],
                                    'application_lead_emails' => ['aalsalim@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => '(SMS Portal) Rich',
                                    'name_ar' => '(SMS Portal) Rich',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Application',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['Asp.net'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['malshaharani@zatca.gov.sa'],
                                    'application_lead_emails' => ['aalsalim@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'Alfabet & Aris',
                                    'name_ar' => 'Alfabet & Aris',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Tool',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['Business Process Management (BPM) Bizz Design'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['lm.alqhofaily@zatca.gov.sa'],
                                    'application_lead_emails' => ['zhussain@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'Alteryx',
                                    'name_ar' => 'Alteryx',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Tool',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['Alteryx'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['malshaharani@zatca.gov.sa'],
                                    'application_lead_emails' => [],
                                ],
                                [
                                    'name_en' => 'Application Performance Management - AppDynamics',
                                    'name_ar' => 'Application Performance Management - AppDynamics',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Tool',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['Cisco'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['malshaharani@zatca.gov.sa'],
                                    'application_lead_emails' => ['malshaharani@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'Ask Ziyad (tool)',
                                    'name_ar' => 'Ask Ziyad (tool)',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Tool',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['AI Tool'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['lm.alqhofaily@zatca.gov.sa'],
                                    'application_lead_emails' => ['aalzahrani@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'Auction',
                                    'name_ar' => 'Auction',
                                    'application_type' => 'Customs',
                                    'department' => 'Customes',
                                    'technical_category' => 'Application',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['Pega', 'Angular'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['malsadoon@zatca.gov.sa'],
                                    'application_lead_emails' => ['aasma@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'Audit Card',
                                    'name_ar' => 'Audit Card',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Application',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['Asp.net'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['lm.alqhofaily@zatca.gov.sa'],
                                    'application_lead_emails' => ['zhussain@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'Azure DevOps',
                                    'name_ar' => 'Azure DevOps',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Tool',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['Systems Development Life Cycle (SDLC)'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['lm.alqhofaily@zatca.gov.sa'],
                                    'application_lead_emails' => ['aalzahrani@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'Bitrix24',
                                    'name_ar' => 'Bitrix24',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Tool',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'Dev',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['Bitrix24'],
                                    'remarks' => 'Under Operation: Dev',
                                    'management_owner_emails' => [],
                                    'application_lead_emails' => [],
                                ],
                                [
                                    'name_en' => 'Board Management meeting app.',
                                    'name_ar' => 'Board Management meeting app.',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Tool',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['.Net'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['lm.alqhofaily@zatca.gov.sa'],
                                    'application_lead_emails' => ['aalzahrani@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'Bonded Zone Management solution',
                                    'name_ar' => 'Bonded Zone Management solution',
                                    'application_type' => 'Customs',
                                    'department' => 'Customes',
                                    'technical_category' => 'Application',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'Dev',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['"Pega systems". "Oracle. Harbor". "Kafka". "Hazelcast". "Elastic Search". "Java', 'Springboot". "ReactJs". "Rancher"'],
                                    'remarks' => 'Under Operation: Dev',
                                    'management_owner_emails' => [],
                                    'application_lead_emails' => [],
                                ],
                                [
                                    'name_en' => 'BPM (Webmethods)',
                                    'name_ar' => 'BPM (Webmethods)',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Application',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['Software AG', 'Java'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['malshaharani@zatca.gov.sa'],
                                    'application_lead_emails' => ['nalonazi@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'Chatbot',
                                    'name_ar' => 'Chatbot',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Application',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['Labiba.ai'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['malshaharani@zatca.gov.sa'],
                                    'application_lead_emails' => ['aalsalim@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'Collection system',
                                    'name_ar' => 'Collection system',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Application',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'Dev',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['SoftwareAG', 'Asp.net'],
                                    'remarks' => 'Under Operation: Dev',
                                    'management_owner_emails' => [],
                                    'application_lead_emails' => [],
                                ],
                                [
                                    'name_en' => 'Confluence',
                                    'name_ar' => 'Confluence',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Tool',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'Dev',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['Confluence'],
                                    'remarks' => 'Under Operation: Dev',
                                    'management_owner_emails' => [],
                                    'application_lead_emails' => [],
                                ],
                                [
                                    'name_en' => 'Convene',
                                    'name_ar' => 'Convene',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Application',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['Convene'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['lm.alqhofaily@zatca.gov.sa'],
                                    'application_lead_emails' => ['aalzahrani@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'Data Access Layer (tool)',
                                    'name_ar' => 'Data Access Layer (tool)',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Tool',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'Dev',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => [],
                                    'remarks' => 'Under Operation: Dev',
                                    'management_owner_emails' => [],
                                    'application_lead_emails' => [],
                                ],
                                [
                                    'name_en' => 'Declaration Reception System',
                                    'name_ar' => 'Declaration Reception System',
                                    'application_type' => 'Customs',
                                    'department' => 'Customes',
                                    'technical_category' => 'Application',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['Pega'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['okalam@zatca.gov.sa'],
                                    'application_lead_emails' => ['aalsalim@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'Diwan',
                                    'name_ar' => 'Diwan',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Application',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['"Software AG"', '"IBM"', '"IOS"', '"Android"', '"Angular"', '"Webmethods"', '"Java"'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['malshaharani@zatca.gov.sa'],
                                    'application_lead_emails' => ['nalonazimuteb@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'DPP',
                                    'name_ar' => 'DPP',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Application',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'ELM',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['Software AG', 'Java'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['malsadoon@zatca.gov.sa'],
                                    'application_lead_emails' => ['ssaleh@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'DWH',
                                    'name_ar' => 'DWH',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Tool',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['Informatica', 'DWH'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['malshaharani@zatca.gov.sa'],
                                    'application_lead_emails' => [],
                                ],
                                [
                                    'name_en' => 'E-Invoicing',
                                    'name_ar' => 'E-Invoicing',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Application',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['"SQL"', '"Java"', '"Python"', '"Automation"', '"Scripting"', '"Coding"', '"Integration"', '"Kubernetes"', '"CI', 'CD pipeline"', '"Terraform"', '"GITOps"', '"IaC"', '"Angular"', '"SAP4 Hana"', '"JavaScript"', '"HTML"', '"GKE"', '"Rancher"', '"Kafka"', '"ARGOCD"', '"Harbor"', '"DevOps"', '"Postman"', '"GCP cloud"', '"Product classification"'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['lm.alqhofaily@zatca.gov.sa'],
                                    'application_lead_emails' => ['aalzahrani@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'E-mail service Management',
                                    'name_ar' => 'E-mail service Management',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Application',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['Pega'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['malshaharani@zatca.gov.sa'],
                                    'application_lead_emails' => [],
                                ],
                                [
                                    'name_en' => 'E-Service & Customs Integration Services',
                                    'name_ar' => 'E-Service & Customs Integration Services',
                                    'application_type' => 'Customs',
                                    'department' => 'Customes',
                                    'technical_category' => 'Application',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['"Asp .net"', '"Sharepoint"'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['malsadoon@zatca.gov.sa'],
                                    'application_lead_emails' => ['aasma@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'EDI',
                                    'name_ar' => 'EDI',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Application',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['Java'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['okalam@zatca.gov.sa'],
                                    'application_lead_emails' => ['okalam@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'Fahes',
                                    'name_ar' => 'Fahes',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Application',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['Asp.net'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['lm.alqhofaily@zatca.gov.sa'],
                                    'application_lead_emails' => ['salqahtani@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'FATCA & Portal (ZATCA AEOI)',
                                    'name_ar' => 'FATCA & Portal (ZATCA AEOI)',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Application',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['"Asp.net"', '"Angular"'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['lm.alqhofaily@zatca.gov.sa'],
                                    'application_lead_emails' => ['aalzahrani@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'Financial & HR (Oracle System),',
                                    'name_ar' => 'Financial & HR (Oracle System),',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Application',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['Oracle Forms and Reports'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['malshaharani@zatca.gov.sa'],
                                    'application_lead_emails' => [],
                                ],
                                [
                                    'name_en' => 'GenAI',
                                    'name_ar' => 'GenAI',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'AI Model',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'Dev',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['AI Modules'],
                                    'remarks' => 'Under Operation: Dev',
                                    'management_owner_emails' => [],
                                    'application_lead_emails' => [],
                                ],
                                [
                                    'name_en' => 'Greeter System',
                                    'name_ar' => 'Greeter System',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Tool',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['Asp.net'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['lm.alqhofaily@zatca.gov.sa'],
                                    'application_lead_emails' => ['aalsalim@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'GSTC',
                                    'name_ar' => 'GSTC',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Application',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['"Pega"', '"Appian"', '"SharePoint"', '"Fingerprint for GSTC"'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['malshaharani@zatca.gov.sa'],
                                    'application_lead_emails' => ['ssaleh@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'IBM DataPpwer - APGEE -Yesser GSB/GSN',
                                    'name_ar' => 'IBM DataPpwer - APGEE -Yesser GSB/GSN',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Integration',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['"IBM datapower"', '"IBM MQ"', '"APIGEE"', '"Kafka"', '"IBM Maximo"'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['malsadoon@zatca.gov.sa'],
                                    'application_lead_emails' => ['ssaleh@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'IDEA',
                                    'name_ar' => 'IDEA',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Tool',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['Aldarco Company'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['malshaharani@zatca.gov.sa'],
                                    'application_lead_emails' => [],
                                ],
                                [
                                    'name_en' => 'Informatica - ETL',
                                    'name_ar' => 'Informatica - ETL',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Tool',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['"DI PowerCenter"', '"Data governance"', '"Axon"', '"EDC"', '"IDQ"', '"Mangement"', '"Power Exchange"', '"Erwin"'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['malshaharani@zatca.gov.sa'],
                                    'application_lead_emails' => ['malshaharani@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'Inquiry portal',
                                    'name_ar' => 'Inquiry portal',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Application',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['Asp.net'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['malshaharani@zatca.gov.sa'],
                                    'application_lead_emails' => ['ssaleh@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'Inspection Portal',
                                    'name_ar' => 'Inspection Portal',
                                    'application_type' => 'Customs',
                                    'department' => 'Customes',
                                    'technical_category' => 'Application',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['"SharePoint"', '"Mobile App"'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['okalam@zatca.gov.sa'],
                                    'application_lead_emails' => [],
                                ],
                                [
                                    'name_en' => 'Jira',
                                    'name_ar' => 'Jira',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Tool',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['JIRA'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['lm.alqhofaily@zatca.gov.sa'],
                                    'application_lead_emails' => ['hhayfa@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'Kronos',
                                    'name_ar' => 'Kronos',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Tool',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['Kronos'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['malshaharani@zatca.gov.sa'],
                                    'application_lead_emails' => ['nalonazi@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'Lijan',
                                    'name_ar' => 'Lijan',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Tool',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'Dev',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['Asp .Net'],
                                    'remarks' => 'Under Operation: Dev',
                                    'management_owner_emails' => [],
                                    'application_lead_emails' => [],
                                ],
                                [
                                    'name_en' => 'Live Chat system',
                                    'name_ar' => 'Live Chat system',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Application',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['Labiba'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['lm.alqhofaily@zatca.gov.sa'],
                                    'application_lead_emails' => ['aalotaibi@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'Manafeth',
                                    'name_ar' => 'Manafeth',
                                    'application_type' => 'Customs',
                                    'department' => 'Customes',
                                    'technical_category' => 'Application',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['"Apex"', '"Oracle"'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['okalam@zatca.gov.sa'],
                                    'application_lead_emails' => ['aalonazi@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'Mashroat – P+',
                                    'name_ar' => 'Mashroat – P+',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Application',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'Dev',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['SharePoint'],
                                    'remarks' => 'Under Operation: Dev',
                                    'management_owner_emails' => [],
                                    'application_lead_emails' => [],
                                ],
                                [
                                    'name_en' => 'MC suspension',
                                    'name_ar' => 'MC suspension',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Application',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['Asp.net'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['lm.alqhofaily@zatca.gov.sa'],
                                    'application_lead_emails' => ['salqahtaniahmedalzahranizakihussain@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'Microsoft CRM',
                                    'name_ar' => 'Microsoft CRM',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Application',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['MS CRM'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['lm.alqhofaily@zatca.gov.sa'],
                                    'application_lead_emails' => ['halsharif@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'MinIO (tool)',
                                    'name_ar' => 'MinIO (tool)',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Tool',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'Dev',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['DWH'],
                                    'remarks' => 'Under Operation: Dev',
                                    'management_owner_emails' => [],
                                    'application_lead_emails' => [],
                                ],
                                [
                                    'name_en' => 'Murasalat',
                                    'name_ar' => 'Murasalat',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Application',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['Java'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['malshaharani@zatca.gov.sa'],
                                    'application_lead_emails' => ['malshaharani@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'Naseej',
                                    'name_ar' => 'Naseej',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Service',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'Dev',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => [],
                                    'remarks' => 'Under Operation: Dev',
                                    'management_owner_emails' => [],
                                    'application_lead_emails' => [],
                                ],
                                [
                                    'name_en' => 'Nibras',
                                    'name_ar' => 'Nibras',
                                    'application_type' => 'Customs',
                                    'department' => 'Customes',
                                    'technical_category' => 'Application',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['"Oracle"', '"Java"', '"Asp.net"'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['okalam@zatca.gov.sa'],
                                    'application_lead_emails' => ['okalam@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'Notification Engine',
                                    'name_ar' => 'Notification Engine',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Application',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['"Asp.net"', '" IBM MQ"'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['malsadoon@zatca.gov.sa'],
                                    'application_lead_emails' => ['aasma@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'Objection & Settlment',
                                    'name_ar' => 'Objection & Settlment',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Application',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['Asp.net'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['lm.alqhofaily@zatca.gov.sa'],
                                    'application_lead_emails' => ['salqahtani@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'OpenText',
                                    'name_ar' => 'OpenText',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Tool',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['OpenText'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['malshaharani@zatca.gov.sa'],
                                    'application_lead_emails' => ['malshaharani@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'PEGA',
                                    'name_ar' => 'PEGA',
                                    'application_type' => 'Customs',
                                    'department' => 'Customes',
                                    'technical_category' => 'Application',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['PEGA'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['okalam@zatca.gov.sa'],
                                    'application_lead_emails' => ['aalsalim@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'Power BI',
                                    'name_ar' => 'Power BI',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Tool',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['"Power BI"', '"SQL"'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['malshaharani@zatca.gov.sa'],
                                    'application_lead_emails' => ['malshaharani@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'Product Classification',
                                    'name_ar' => 'Product Classification',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Application',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['AI Tool'],
                                    'remarks' => 'Under Operation: HO In Progress',
                                    'management_owner_emails' => [],
                                    'application_lead_emails' => [],
                                ],
                                [
                                    'name_en' => 'QPR',
                                    'name_ar' => 'QPR',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Application',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'Dev',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['"Asp.net"', '"C#"'],
                                    'remarks' => 'Under Operation: Dev',
                                    'management_owner_emails' => [],
                                    'application_lead_emails' => [],
                                ],
                                [
                                    'name_en' => 'Quality Management System (QMS)',
                                    'name_ar' => 'Quality Management System (QMS)',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Tool',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'Dev',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => [],
                                    'remarks' => 'Under Operation: Dev',
                                    'management_owner_emails' => [],
                                    'application_lead_emails' => [],
                                ],
                                [
                                    'name_en' => 'Remedy',
                                    'name_ar' => 'Remedy',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Tool',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['BMC Remedy'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['malshaharani@zatca.gov.sa'],
                                    'application_lead_emails' => ['halsharif@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'RETT',
                                    'name_ar' => 'RETT',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Application',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['Asp.net'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['lm.alqhofaily@zatca.gov.sa'],
                                    'application_lead_emails' => ['zhussain@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'SAMA Portal service',
                                    'name_ar' => 'SAMA Portal service',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Application',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['Asp.net'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['lm.alqhofaily@zatca.gov.sa'],
                                    'application_lead_emails' => ['salqahtaniahmedalzahranizakihussain@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'SAP S4HANA (FICO, FIORI, CPI, ALM, MM, and HCM ABAP)',
                                    'name_ar' => 'SAP S4HANA (FICO, FIORI, CPI, ALM, MM, and HCM ABAP)',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Application',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['SAP', 'S4Hana'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['malshaharani@zatca.gov.sa'],
                                    'application_lead_emails' => ['nalonazi@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'SAP SuccessFactors',
                                    'name_ar' => 'SAP SuccessFactors',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Application',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['SAP'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['malshaharani@zatca.gov.sa'],
                                    'application_lead_emails' => ['nalonazi@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'SAS Risk Engine',
                                    'name_ar' => 'SAS Risk Engine',
                                    'application_type' => 'Customs',
                                    'department' => 'Customes',
                                    'technical_category' => 'Tool',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['"SAS"', '"SAS 9.4"', '"Viya 3.5"', '"Viya 4.0"'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['okalam@zatca.gov.sa'],
                                    'application_lead_emails' => ['aalmanna@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'Sayen',
                                    'name_ar' => 'Sayen',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Tool',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'Dev',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['Sayen'],
                                    'remarks' => null,
                                    'management_owner_emails' => [],
                                    'application_lead_emails' => [],
                                ],
                                [
                                    'name_en' => 'Shamel Middleware',
                                    'name_ar' => 'Shamel Middleware',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Tool',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['.Net'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['lm.alqhofaily@zatca.gov.sa'],
                                    'application_lead_emails' => ['ssaleh@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'Smart Contracts',
                                    'name_ar' => 'Smart Contracts',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Application',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['SharePoint"', '"MVC"', '"Asp.net"'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['lm.alqhofaily@zatca.gov.sa'],
                                    'application_lead_emails' => ['hhisham@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'Taxation support system, Contracts and Imports oracle system',
                                    'name_ar' => 'Taxation support system, Contracts and Imports oracle system',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Application',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['Oracle Forms and Reports'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['lm.alqhofaily@zatca.gov.sa'],
                                    'application_lead_emails' => ['zhussain@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'TeamMate',
                                    'name_ar' => 'TeamMate',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Tool',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['TeamMate'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['lm.alqhofaily@zatca.gov.sa'],
                                    'application_lead_emails' => ['hhisham@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'Terradata',
                                    'name_ar' => 'Terradata',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Tool',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'Dev',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['"Terradata"', '"DAL"', '"MiniIO"'],
                                    'remarks' => 'Under Operation: Dev',
                                    'management_owner_emails' => [],
                                    'application_lead_emails' => [],
                                ],
                                [
                                    'name_en' => 'Vendor Portal',
                                    'name_ar' => 'Vendor Portal',
                                    'application_type' => 'Customs',
                                    'department' => 'Customes',
                                    'technical_category' => 'Application',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['Angular', '.Net'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['malsadoon@zatca.gov.sa'],
                                    'application_lead_emails' => ['aasma@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'VoC - Medallia',
                                    'name_ar' => 'VoC - Medallia',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Tool',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['"Survey2"', '" MangoDB"', '"Medallia"'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['lm.alqhofaily@zatca.gov.sa'],
                                    'application_lead_emails' => ['nalonazi@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'WebEOC/DRA',
                                    'name_ar' => 'WebEOC/DRA',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Application',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['"WebEOC"', '"Asp.net"'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['malsadoon@zatca.gov.sa'],
                                    'application_lead_emails' => ['mmuteb@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'Zakaty',
                                    'name_ar' => 'Zakaty',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Application',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['.Net'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['lm.alqhofaily@zatca.gov.sa'],
                                    'application_lead_emails' => ['salqahtani@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'ZATCA & Conference Portal',
                                    'name_ar' => 'ZATCA & Conference Portal',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Application',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['SharePoint'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['lm.alqhofaily@zatca.gov.sa'],
                                    'application_lead_emails' => ['aalzahrani@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'ZATCA Mobile',
                                    'name_ar' => 'ZATCA Mobile',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Application',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['Maui'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['lm.alqhofaily@zatca.gov.sa'],
                                    'application_lead_emails' => ['zhussain@zatca.gov.sa'],
                                ],
                                [
                                    'name_en' => 'Ziyad',
                                    'name_ar' => 'Ziyad',
                                    'application_type' => 'Internal App',
                                    'department' => 'taxation and Zakat Department',
                                    'technical_category' => 'Tool',
                                    'description' => 'TODO - Needs Review',
                                    'vendor' => 'TCS',
                                    'status' => 'Active',
                                    'criticality' => 'Medium',
                                    'support_type' => 'Business Hours',
                                    'technologies' => ['AI Module'],
                                    'remarks' => null,
                                    'management_owner_emails' => ['malshaharani@zatca.gov.sa'],
                                    'application_lead_emails' => [],
                                ],
                            ];
                        }
                    
                        /**
                         * @return list<array<string, mixed>>
                         */
                        private function importedAssignments(): array
                        {
                return [
                        [
                        'user_email' => 'aalsalim@zatca.gov.sa',
                        'application_name' => '(SMS Portal) Rayah',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'iimran@zatca.gov.sa',
                        'application_name' => '(SMS Portal) Rayah',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'malshaharani@zatca.gov.sa',
                        'application_name' => '(SMS Portal) Rayah',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'sshaden@zatca.gov.sa',
                        'application_name' => '(SMS Portal) Rayah',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'aalsalim@zatca.gov.sa',
                        'application_name' => '(SMS Portal) Rich',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'iimran@zatca.gov.sa',
                        'application_name' => '(SMS Portal) Rich',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'malshaharani@zatca.gov.sa',
                        'application_name' => '(SMS Portal) Rich',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'sshaden@zatca.gov.sa',
                        'application_name' => '(SMS Portal) Rich',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'jjonah@zatca.gov.sa',
                        'application_name' => 'Alfabet & Aris',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'lm.alqhofaily@zatca.gov.sa',
                        'application_name' => 'Alfabet & Aris',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'zhussain@zatca.gov.sa',
                        'application_name' => 'Alfabet & Aris',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'malshaharani@zatca.gov.sa',
                        'application_name' => 'Alteryx',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'nsyed-c@zatca.gov.sa',
                        'application_name' => 'Alteryx',
                        'app_role' => 'Viewer',
                        'is_primary' => false,
                        'remarks' => 'Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'snisar@zatca.gov.sa',
                        'application_name' => 'Alteryx',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'aalhothily@zatca.gov.sa',
                        'application_name' => 'Application Performance Management - AppDynamics',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'malshaharani@zatca.gov.sa',
                        'application_name' => 'Application Performance Management - AppDynamics',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner | PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'mmirza@zatca.gov.sa',
                        'application_name' => 'Application Performance Management - AppDynamics',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'aalzahrani@zatca.gov.sa',
                        'application_name' => 'Ask Ziyad (tool)',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'cmishara@zatca.gov.sa',
                        'application_name' => 'Ask Ziyad (tool)',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'inigam@zatca.gov.sa',
                        'application_name' => 'Ask Ziyad (tool)',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'lm.alqhofaily@zatca.gov.sa',
                        'application_name' => 'Ask Ziyad (tool)',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'aasma@zatca.gov.sa',
                        'application_name' => 'Auction',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'fkhan@zatca.gov.sa',
                        'application_name' => 'Auction',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'ln.al-momani@zatca.gov.sa',
                        'application_name' => 'Auction',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'malsadoon@zatca.gov.sa',
                        'application_name' => 'Auction',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'mkamal@zatca.gov.sa',
                        'application_name' => 'Auction',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'nezzat@zatca.gov.sa',
                        'application_name' => 'Auction',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'ralabbad@zatca.gov.sa',
                        'application_name' => 'Auction',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'zalharbi@zatca.gov.sa',
                        'application_name' => 'Auction',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'lm.alqhofaily@zatca.gov.sa',
                        'application_name' => 'Audit Card',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'mshoueb@zatca.gov.sa',
                        'application_name' => 'Audit Card',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'nneehal@zatca.gov.sa',
                        'application_name' => 'Audit Card',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'nsayed@zatca.gov.sa',
                        'application_name' => 'Audit Card',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'zhussain@zatca.gov.sa',
                        'application_name' => 'Audit Card',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'aalzahrani@zatca.gov.sa',
                        'application_name' => 'Azure DevOps',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'lm.alqhofaily@zatca.gov.sa',
                        'application_name' => 'Azure DevOps',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'mdorgamy@zatca.gov.sa',
                        'application_name' => 'Azure DevOps',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'ddev@zatca.gov.sa',
                        'application_name' => 'Bitrix24',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'aalzahrani@zatca.gov.sa',
                        'application_name' => 'Board Management meeting app.',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'iimran@zatca.gov.sa',
                        'application_name' => 'Board Management meeting app.',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'lm.alqhofaily@zatca.gov.sa',
                        'application_name' => 'Board Management meeting app.',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'sshaden@zatca.gov.sa',
                        'application_name' => 'Board Management meeting app.',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'ddev@zatca.gov.sa',
                        'application_name' => 'Bonded Zone Management solution',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'kkoti@zatca.gov.sa',
                        'application_name' => 'BPM (Webmethods)',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'malshaharani@zatca.gov.sa',
                        'application_name' => 'BPM (Webmethods)',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'nalonazi@zatca.gov.sa',
                        'application_name' => 'BPM (Webmethods)',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'nnikhilesh@zatca.gov.sa',
                        'application_name' => 'BPM (Webmethods)',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'ssurya@zatca.gov.sa',
                        'application_name' => 'BPM (Webmethods)',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'uutkash@zatca.gov.sa',
                        'application_name' => 'BPM (Webmethods)',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'aalsalim@zatca.gov.sa',
                        'application_name' => 'Chatbot',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'iimran@zatca.gov.sa',
                        'application_name' => 'Chatbot',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'imrkhan-c@zatca.gov.sa',
                        'application_name' => 'Chatbot',
                        'app_role' => 'Viewer',
                        'is_primary' => false,
                        'remarks' => 'Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'malshaharani@zatca.gov.sa',
                        'application_name' => 'Chatbot',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'sowaidah-c@zatca.gov.sa',
                        'application_name' => 'Chatbot',
                        'app_role' => 'Viewer',
                        'is_primary' => false,
                        'remarks' => 'Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'sshaden@zatca.gov.sa',
                        'application_name' => 'Chatbot',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'ddev@zatca.gov.sa',
                        'application_name' => 'Collection system',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'ddev@zatca.gov.sa',
                        'application_name' => 'Confluence',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'aalzahrani@zatca.gov.sa',
                        'application_name' => 'Convene',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'iimran@zatca.gov.sa',
                        'application_name' => 'Convene',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'lm.alqhofaily@zatca.gov.sa',
                        'application_name' => 'Convene',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'sshaden@zatca.gov.sa',
                        'application_name' => 'Convene',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'ddev@zatca.gov.sa',
                        'application_name' => 'Data Access Layer (tool)',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'aalhisan@zatca.gov.sa',
                        'application_name' => 'Declaration Reception System',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'aalsalim@zatca.gov.sa',
                        'application_name' => 'Declaration Reception System',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'abhattacharya@zatca.gov.sa',
                        'application_name' => 'Declaration Reception System',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'fibrahimabusafiyah@zatca.gov.sa',
                        'application_name' => 'Declaration Reception System',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'maldhafer@zatca.gov.sa',
                        'application_name' => 'Declaration Reception System',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'malqahtani@zatca.gov.sa',
                        'application_name' => 'Declaration Reception System',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'nmohammed@zatca.gov.sa',
                        'application_name' => 'Declaration Reception System',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'okalam@zatca.gov.sa',
                        'application_name' => 'Declaration Reception System',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'faghazwani-c@zatca.gov.sa',
                        'application_name' => 'Diwan',
                        'app_role' => 'Viewer',
                        'is_primary' => false,
                        'remarks' => 'Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'ffatimah@zatca.gov.sa',
                        'application_name' => 'Diwan',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'iindu@zatca.gov.sa',
                        'application_name' => 'Diwan',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'inigam-c@zatca.gov.sa',
                        'application_name' => 'Diwan',
                        'app_role' => 'Viewer',
                        'is_primary' => false,
                        'remarks' => 'Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'kkatherbasha@zatca.gov.sa',
                        'application_name' => 'Diwan',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'kmabubasha-c@zatca.gov.sa',
                        'application_name' => 'Diwan',
                        'app_role' => 'Viewer',
                        'is_primary' => false,
                        'remarks' => 'Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'malshaharani@zatca.gov.sa',
                        'application_name' => 'Diwan',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'nalonazimuteb@zatca.gov.sa',
                        'application_name' => 'Diwan',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'narao-c@zatca.gov.sa',
                        'application_name' => 'Diwan',
                        'app_role' => 'Viewer',
                        'is_primary' => false,
                        'remarks' => 'Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'nmuways-c@zatca.gov.sa',
                        'application_name' => 'Diwan',
                        'app_role' => 'Viewer',
                        'is_primary' => false,
                        'remarks' => 'Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'nnehal@zatca.gov.sa',
                        'application_name' => 'Diwan',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'nsayed@zatca.gov.sa',
                        'application_name' => 'Diwan',
                        'app_role' => 'Viewer',
                        'is_primary' => false,
                        'remarks' => 'Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'rhussain-c@zatca.gov.sa',
                        'application_name' => 'Diwan',
                        'app_role' => 'Viewer',
                        'is_primary' => false,
                        'remarks' => 'Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'rrenad@zatca.gov.sa',
                        'application_name' => 'Diwan',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'sakram@zatca.gov.sa',
                        'application_name' => 'Diwan',
                        'app_role' => 'Viewer',
                        'is_primary' => false,
                        'remarks' => 'Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'dteam@zatca.gov.sa',
                        'application_name' => 'DPP',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'malsadoon@zatca.gov.sa',
                        'application_name' => 'DPP',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'ssaleh@zatca.gov.sa',
                        'application_name' => 'DPP',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'malshaharani@zatca.gov.sa',
                        'application_name' => 'DWH',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'nsyed-c@zatca.gov.sa',
                        'application_name' => 'DWH',
                        'app_role' => 'Viewer',
                        'is_primary' => false,
                        'remarks' => 'Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'snisar@zatca.gov.sa',
                        'application_name' => 'DWH',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'aalzahrani@zatca.gov.sa',
                        'application_name' => 'E-Invoicing',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'fawharbi-c@zatca.gov.sa',
                        'application_name' => 'E-Invoicing',
                        'app_role' => 'Viewer',
                        'is_primary' => false,
                        'remarks' => 'Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'ffawaz@zatca.gov.sa',
                        'application_name' => 'E-Invoicing',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'lm.alqhofaily@zatca.gov.sa',
                        'application_name' => 'E-Invoicing',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'mahmed@zatca.gov.sa',
                        'application_name' => 'E-Invoicing',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support | Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'malshiki@zatca.gov.sa',
                        'application_name' => 'E-Invoicing',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'mshaikhi-c@myzatca.gov.sa',
                        'application_name' => 'E-Invoicing',
                        'app_role' => 'Viewer',
                        'is_primary' => false,
                        'remarks' => 'Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'nnabila@zatca.gov.sa',
                        'application_name' => 'E-Invoicing',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'nsayed@zatca.gov.sa',
                        'application_name' => 'E-Invoicing',
                        'app_role' => 'Viewer',
                        'is_primary' => false,
                        'remarks' => 'Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'nsivakoti-c@zatca.gov.sa',
                        'application_name' => 'E-Invoicing',
                        'app_role' => 'Viewer',
                        'is_primary' => false,
                        'remarks' => 'Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'srayee-c@zatca.gov.sa',
                        'application_name' => 'E-Invoicing',
                        'app_role' => 'Viewer',
                        'is_primary' => false,
                        'remarks' => 'Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'ssampathy-c@zatca.gov.sa',
                        'application_name' => 'E-Invoicing',
                        'app_role' => 'Viewer',
                        'is_primary' => false,
                        'remarks' => 'Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'ssrinath@zatca.gov.sa',
                        'application_name' => 'E-Invoicing',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'vpesari-c@zatca.gov.sa',
                        'application_name' => 'E-Invoicing',
                        'app_role' => 'Viewer',
                        'is_primary' => false,
                        'remarks' => 'Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'vvenu@zatca.gov.sa',
                        'application_name' => 'E-Invoicing',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'waloufi@zatca.gov.sa',
                        'application_name' => 'E-Invoicing',
                        'app_role' => 'Viewer',
                        'is_primary' => false,
                        'remarks' => 'Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'malshaharani@zatca.gov.sa',
                        'application_name' => 'E-mail service Management',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'mirbeg-c@zatca.gov.sa',
                        'application_name' => 'E-mail service Management',
                        'app_role' => 'Viewer',
                        'is_primary' => false,
                        'remarks' => 'Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'mmirza@zatca.gov.sa',
                        'application_name' => 'E-mail service Management',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'nahmed@zatca.gov.sa',
                        'application_name' => 'E-mail service Management',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'aasma@zatca.gov.sa',
                        'application_name' => 'E-Service & Customs Integration Services',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'fkhan@zatca.gov.sa',
                        'application_name' => 'E-Service & Customs Integration Services',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'ln.al-momani@zatca.gov.sa',
                        'application_name' => 'E-Service & Customs Integration Services',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'malsadoon@zatca.gov.sa',
                        'application_name' => 'E-Service & Customs Integration Services',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'mkamal@zatca.gov.sa',
                        'application_name' => 'E-Service & Customs Integration Services',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'nezzat@zatca.gov.sa',
                        'application_name' => 'E-Service & Customs Integration Services',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'ralabbad@zatca.gov.sa',
                        'application_name' => 'E-Service & Customs Integration Services',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'zalharbi@zatca.gov.sa',
                        'application_name' => 'E-Service & Customs Integration Services',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'afarhan@zatca.gov.sa',
                        'application_name' => 'EDI',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'iismail@zatca.gov.sa',
                        'application_name' => 'EDI',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'kkasim@zatca.gov.sa',
                        'application_name' => 'EDI',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'mamer@zatca.gov.sa',
                        'application_name' => 'EDI',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'mmuneeb@zatca.gov.sa',
                        'application_name' => 'EDI',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'okalam@zatca.gov.sa',
                        'application_name' => 'EDI',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner | PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'ttameem@zatca.gov.sa',
                        'application_name' => 'EDI',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'jalbalwi@zatca.gov.sa',
                        'application_name' => 'Fahes',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'jbalawi-c@zatca.gov.sa',
                        'application_name' => 'Fahes',
                        'app_role' => 'Viewer',
                        'is_primary' => false,
                        'remarks' => 'Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'lm.alqhofaily@zatca.gov.sa',
                        'application_name' => 'Fahes',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'mdorgamy@zatca.gov.sa',
                        'application_name' => 'Fahes',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'mdorghamy-c@zatca.gov.sa',
                        'application_name' => 'Fahes',
                        'app_role' => 'Viewer',
                        'is_primary' => false,
                        'remarks' => 'Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'salqahtani@zatca.gov.sa',
                        'application_name' => 'Fahes',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'ssiraj@zatca.gov.sa',
                        'application_name' => 'Fahes',
                        'app_role' => 'Viewer',
                        'is_primary' => false,
                        'remarks' => 'Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'aalzahrani@zatca.gov.sa',
                        'application_name' => 'FATCA & Portal (ZATCA AEOI)',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'lm.alqhofaily@zatca.gov.sa',
                        'application_name' => 'FATCA & Portal (ZATCA AEOI)',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'nnikhilesh@zatca.gov.sa',
                        'application_name' => 'FATCA & Portal (ZATCA AEOI)',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'uutkash@zatca.gov.sa',
                        'application_name' => 'FATCA & Portal (ZATCA AEOI)',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'jjonah@zatca.gov.sa',
                        'application_name' => 'Financial & HR (Oracle System),',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'malshaharani@zatca.gov.sa',
                        'application_name' => 'Financial & HR (Oracle System),',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'ddev@zatca.gov.sa',
                        'application_name' => 'GenAI',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'aalsalim@zatca.gov.sa',
                        'application_name' => 'Greeter System',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'iimran@zatca.gov.sa',
                        'application_name' => 'Greeter System',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'lm.alqhofaily@zatca.gov.sa',
                        'application_name' => 'Greeter System',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'sshaden@zatca.gov.sa',
                        'application_name' => 'Greeter System',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'halsehri@zatca.gov.sa',
                        'application_name' => 'GSTC',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'malobid@zatca.gov.sa',
                        'application_name' => 'GSTC',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'malshaharani@zatca.gov.sa',
                        'application_name' => 'GSTC',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'nalgulifi@zatca.gov.sa',
                        'application_name' => 'GSTC',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'ssaleh@zatca.gov.sa',
                        'application_name' => 'GSTC',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'aamjad@zatca.gov.sa',
                        'application_name' => 'IBM DataPpwer - APGEE -Yesser GSB/GSN',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'hhasena@zatca.gov.sa',
                        'application_name' => 'IBM DataPpwer - APGEE -Yesser GSB/GSN',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'kkishor@zatca.gov.sa',
                        'application_name' => 'IBM DataPpwer - APGEE -Yesser GSB/GSN',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'malsadoon@zatca.gov.sa',
                        'application_name' => 'IBM DataPpwer - APGEE -Yesser GSB/GSN',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'ssaleh@zatca.gov.sa',
                        'application_name' => 'IBM DataPpwer - APGEE -Yesser GSB/GSN',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'ssohail@zatca.gov.sa',
                        'application_name' => 'IBM DataPpwer - APGEE -Yesser GSB/GSN',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'jjonah@zatca.gov.sa',
                        'application_name' => 'IDEA',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'malshaharani@zatca.gov.sa',
                        'application_name' => 'IDEA',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'malshaharani@zatca.gov.sa',
                        'application_name' => 'Informatica - ETL',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner | PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'snisar@zatca.gov.sa',
                        'application_name' => 'Informatica - ETL',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'aalsubaie@zatca.gov.sa',
                        'application_name' => 'Inquiry portal',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'jjonah@zatca.gov.sa',
                        'application_name' => 'Inquiry portal',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'malshaharani@zatca.gov.sa',
                        'application_name' => 'Inquiry portal',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'ssaleh@zatca.gov.sa',
                        'application_name' => 'Inquiry portal',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'fabusafia@zatca.gov.sa',
                        'application_name' => 'Inspection Portal',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'halkhwalda@zatca.gov.sa',
                        'application_name' => 'Inspection Portal',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'mmahdy@zatca.gov.sa',
                        'application_name' => 'Inspection Portal',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'okalam@zatca.gov.sa',
                        'application_name' => 'Inspection Portal',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'gokumar-c@zatca.gov.sa',
                        'application_name' => 'Jira',
                        'app_role' => 'Viewer',
                        'is_primary' => false,
                        'remarks' => 'Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'gsumant@zatca.gov.sa',
                        'application_name' => 'Jira',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'hhayfa@zatca.gov.sa',
                        'application_name' => 'Jira',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'lm.alqhofaily@zatca.gov.sa',
                        'application_name' => 'Jira',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'vsabbarapu@zatca.gov.sa',
                        'application_name' => 'Jira',
                        'app_role' => 'Viewer',
                        'is_primary' => false,
                        'remarks' => 'Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'vvenkata@zatca.gov.sa',
                        'application_name' => 'Jira',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'aalhotily@zatca.gov.sa',
                        'application_name' => 'Kronos',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'ahuthaily-c@zatca.gov.sa',
                        'application_name' => 'Kronos',
                        'app_role' => 'Viewer',
                        'is_primary' => false,
                        'remarks' => 'Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'malshaharani@zatca.gov.sa',
                        'application_name' => 'Kronos',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'nalonazi@zatca.gov.sa',
                        'application_name' => 'Kronos',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'sakram@zatca.gov.sa',
                        'application_name' => 'Kronos',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support | Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'ddev@zatca.gov.sa',
                        'application_name' => 'Lijan',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'aalotaibi@zatca.gov.sa',
                        'application_name' => 'Live Chat system',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'iimran@zatca.gov.sa',
                        'application_name' => 'Live Chat system',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'lm.alqhofaily@zatca.gov.sa',
                        'application_name' => 'Live Chat system',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'sshaden@zatca.gov.sa',
                        'application_name' => 'Live Chat system',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'aalonazi@zatca.gov.sa',
                        'application_name' => 'Manafeth',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'asaleh@zatca.gov.sa',
                        'application_name' => 'Manafeth',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'fabusafia@zatca.gov.sa',
                        'application_name' => 'Manafeth',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'halkhwalda@zatca.gov.sa',
                        'application_name' => 'Manafeth',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'halsadi@zatca.gov.sa',
                        'application_name' => 'Manafeth',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'mezz@zatca.gov.sa',
                        'application_name' => 'Manafeth',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'mhasan@zatca.gov.sa',
                        'application_name' => 'Manafeth',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'mmahdy@zatca.gov.sa',
                        'application_name' => 'Manafeth',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'okalam@zatca.gov.sa',
                        'application_name' => 'Manafeth',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'yhasan@zatca.gov.sa',
                        'application_name' => 'Manafeth',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'ddev@zatca.gov.sa',
                        'application_name' => 'Mashroat – P+',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'jalbalwi@zatca.gov.sa',
                        'application_name' => 'MC suspension',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'lm.alqhofaily@zatca.gov.sa',
                        'application_name' => 'MC suspension',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'mdorgamy@zatca.gov.sa',
                        'application_name' => 'MC suspension',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'salqahtaniahmedalzahranizakihussain@zatca.gov.sa',
                        'application_name' => 'MC suspension',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'ssiraj@zatca.gov.sa',
                        'application_name' => 'MC suspension',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'halsharif@zatca.gov.sa',
                        'application_name' => 'Microsoft CRM',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'iibrahim@zatca.gov.sa',
                        'application_name' => 'Microsoft CRM',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'lm.alqhofaily@zatca.gov.sa',
                        'application_name' => 'Microsoft CRM',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'walofi@zatca.gov.sa',
                        'application_name' => 'Microsoft CRM',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'ddev@zatca.gov.sa',
                        'application_name' => 'MinIO (tool)',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'gokumar-c@zatca.gov.sa',
                        'application_name' => 'Murasalat',
                        'app_role' => 'Viewer',
                        'is_primary' => false,
                        'remarks' => 'Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'gsumant@zatca.gov.sa',
                        'application_name' => 'Murasalat',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'malshaharani@zatca.gov.sa',
                        'application_name' => 'Murasalat',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner | PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'uutkash@zatca.gov.sa',
                        'application_name' => 'Murasalat',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'ddev@zatca.gov.sa',
                        'application_name' => 'Naseej',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'aabdelmonaem@zatca.gov.sa',
                        'application_name' => 'Nibras',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'aabdulmaksood@zatca.gov.sa',
                        'application_name' => 'Nibras',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'aalmotiri@zatca.gov.sa',
                        'application_name' => 'Nibras',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'aalsaleh@zatca.gov.sa',
                        'application_name' => 'Nibras',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'ajad@zatca.gov.sa',
                        'application_name' => 'Nibras',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'asaleh@zatca.gov.sa',
                        'application_name' => 'Nibras',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'balbubali@zatca.gov.sa',
                        'application_name' => 'Nibras',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'ealmalki@zatca.gov.sa',
                        'application_name' => 'Nibras',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'haldousary@zatca.gov.sa',
                        'application_name' => 'Nibras',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'halsadi@zatca.gov.sa',
                        'application_name' => 'Nibras',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'kelmetenawy@zatca.gov.sa',
                        'application_name' => 'Nibras',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'lalswid@zatca.gov.sa',
                        'application_name' => 'Nibras',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'malmuhana@zatca.gov.sa',
                        'application_name' => 'Nibras',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'malsunaidi@zatca.gov.sa',
                        'application_name' => 'Nibras',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'mayman@zatca.gov.sa',
                        'application_name' => 'Nibras',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'mdiab@zatca.gov.sa',
                        'application_name' => 'Nibras',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'mezz@zatca.gov.sa',
                        'application_name' => 'Nibras',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'mhasan@zatca.gov.sa',
                        'application_name' => 'Nibras',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'mmohammed@zatca.gov.sa',
                        'application_name' => 'Nibras',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'okalam@zatca.gov.sa',
                        'application_name' => 'Nibras',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner | PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'razahem@zatca.gov.sa',
                        'application_name' => 'Nibras',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'yhasan@zatca.gov.sa',
                        'application_name' => 'Nibras',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'aasma@zatca.gov.sa',
                        'application_name' => 'Notification Engine',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'adonthired-c@zatca.gov.sa',
                        'application_name' => 'Notification Engine',
                        'app_role' => 'Viewer',
                        'is_primary' => false,
                        'remarks' => 'Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'adonthireddy@zatca.gov.sa',
                        'application_name' => 'Notification Engine',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'apg@zatca.gov.sa',
                        'application_name' => 'Notification Engine',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support | Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'hsheri-c@zatca.gov.sa',
                        'application_name' => 'Notification Engine',
                        'app_role' => 'Viewer',
                        'is_primary' => false,
                        'remarks' => 'Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'malsadoon@zatca.gov.sa',
                        'application_name' => 'Notification Engine',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'jalbalwi@zatca.gov.sa',
                        'application_name' => 'Objection & Settlment',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'lm.alqhofaily@zatca.gov.sa',
                        'application_name' => 'Objection & Settlment',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'mdorgamy@zatca.gov.sa',
                        'application_name' => 'Objection & Settlment',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'salqahtani@zatca.gov.sa',
                        'application_name' => 'Objection & Settlment',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'ssiraj@zatca.gov.sa',
                        'application_name' => 'Objection & Settlment',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'malshaharani@zatca.gov.sa',
                        'application_name' => 'OpenText',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner | PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'ssafiullah-c@zatca.gov.sa',
                        'application_name' => 'OpenText',
                        'app_role' => 'Viewer',
                        'is_primary' => false,
                        'remarks' => 'Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'ssaifullah@zatca.gov.sa',
                        'application_name' => 'OpenText',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'ssampathy-c@zatca.gov.sa',
                        'application_name' => 'OpenText',
                        'app_role' => 'Viewer',
                        'is_primary' => false,
                        'remarks' => 'Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'vpesari-c@zatca.gov.sa',
                        'application_name' => 'OpenText',
                        'app_role' => 'Viewer',
                        'is_primary' => false,
                        'remarks' => 'Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'vpesari-srinathsampthy@zatca.gov.sa',
                        'application_name' => 'OpenText',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'aalhisan@zatca.gov.sa',
                        'application_name' => 'PEGA',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'aalsalim@zatca.gov.sa',
                        'application_name' => 'PEGA',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'abhattacharya@zatca.gov.sa',
                        'application_name' => 'PEGA',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'fibrahimabusafiyah@zatca.gov.sa',
                        'application_name' => 'PEGA',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'maldhafer@zatca.gov.sa',
                        'application_name' => 'PEGA',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'malqahtani@zatca.gov.sa',
                        'application_name' => 'PEGA',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'nmohammed@zatca.gov.sa',
                        'application_name' => 'PEGA',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'okalam@zatca.gov.sa',
                        'application_name' => 'PEGA',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'aalshamri@zatca.gov.sa',
                        'application_name' => 'Power BI',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'malshaharani@zatca.gov.sa',
                        'application_name' => 'Power BI',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner | PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'ffawaz@zatca.gov.sa',
                        'application_name' => 'Product Classification',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'mahmed@zatca.gov.sa',
                        'application_name' => 'Product Classification',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'malshiki@zatca.gov.sa',
                        'application_name' => 'Product Classification',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'nnabila@zatca.gov.sa',
                        'application_name' => 'Product Classification',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'ssrinath@zatca.gov.sa',
                        'application_name' => 'Product Classification',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'vvenu@zatca.gov.sa',
                        'application_name' => 'Product Classification',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'ddev@zatca.gov.sa',
                        'application_name' => 'QPR',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'ddev@zatca.gov.sa',
                        'application_name' => 'Quality Management System (QMS)',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'halsharif@zatca.gov.sa',
                        'application_name' => 'Remedy',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'malshaharani@zatca.gov.sa',
                        'application_name' => 'Remedy',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'vsabbarapu@zatca.gov.sa',
                        'application_name' => 'Remedy',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support | Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'waloufi@zatca.gov.sa',
                        'application_name' => 'Remedy',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support | Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'jjhona@zatca.gov.sa',
                        'application_name' => 'RETT',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'jrachapudi-c@zatca.gov.sa',
                        'application_name' => 'RETT',
                        'app_role' => 'Viewer',
                        'is_primary' => false,
                        'remarks' => 'Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'lm.alqhofaily@zatca.gov.sa',
                        'application_name' => 'RETT',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'mobaid-c@zatca.gov.sa',
                        'application_name' => 'RETT',
                        'app_role' => 'Viewer',
                        'is_primary' => false,
                        'remarks' => 'Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'mshoueb@zatca.gov.sa',
                        'application_name' => 'RETT',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'njulafi-c@zatca.gov.sa',
                        'application_name' => 'RETT',
                        'app_role' => 'Viewer',
                        'is_primary' => false,
                        'remarks' => 'Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'shomohamme-c@zatca.gov.sa',
                        'application_name' => 'RETT',
                        'app_role' => 'Viewer',
                        'is_primary' => false,
                        'remarks' => 'Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'zhussain@zatca.gov.sa',
                        'application_name' => 'RETT',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'jalbalwi@zatca.gov.sa',
                        'application_name' => 'SAMA Portal service',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'lm.alqhofaily@zatca.gov.sa',
                        'application_name' => 'SAMA Portal service',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'mdorgamy@zatca.gov.sa',
                        'application_name' => 'SAMA Portal service',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'salqahtaniahmedalzahranizakihussain@zatca.gov.sa',
                        'application_name' => 'SAMA Portal service',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'ssiraj@zatca.gov.sa',
                        'application_name' => 'SAMA Portal service',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'akhalifa@zatca.gov.sa',
                        'application_name' => 'SAP S4HANA (FICO, FIORI, CPI, ALM, MM, and HCM ABAP)',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'malshaharani@zatca.gov.sa',
                        'application_name' => 'SAP S4HANA (FICO, FIORI, CPI, ALM, MM, and HCM ABAP)',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'nalekatte@zatca.gov.sa',
                        'application_name' => 'SAP S4HANA (FICO, FIORI, CPI, ALM, MM, and HCM ABAP)',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'nalonazi@zatca.gov.sa',
                        'application_name' => 'SAP S4HANA (FICO, FIORI, CPI, ALM, MM, and HCM ABAP)',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'nfaragali@zatca.gov.sa',
                        'application_name' => 'SAP S4HANA (FICO, FIORI, CPI, ALM, MM, and HCM ABAP)',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'rdutta@zatca.gov.sa',
                        'application_name' => 'SAP S4HANA (FICO, FIORI, CPI, ALM, MM, and HCM ABAP)',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'vgadag@zatca.gov.sa',
                        'application_name' => 'SAP S4HANA (FICO, FIORI, CPI, ALM, MM, and HCM ABAP)',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'zahmed@zatca.gov.sa',
                        'application_name' => 'SAP S4HANA (FICO, FIORI, CPI, ALM, MM, and HCM ABAP)',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'zj.shaik@zatca.gov.sa',
                        'application_name' => 'SAP S4HANA (FICO, FIORI, CPI, ALM, MM, and HCM ABAP)',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'aabdulkarima@zatca.gov.sa',
                        'application_name' => 'SAP SuccessFactors',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'agalal@zatca.gov.sa',
                        'application_name' => 'SAP SuccessFactors',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'bismail@zatca.gov.sa',
                        'application_name' => 'SAP SuccessFactors',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'malshaharani@zatca.gov.sa',
                        'application_name' => 'SAP SuccessFactors',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'nalonazi@zatca.gov.sa',
                        'application_name' => 'SAP SuccessFactors',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'nk.alsubaie@zatca.gov.sa',
                        'application_name' => 'SAP SuccessFactors',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'sdivyadharvidadala@zatca.gov.sa',
                        'application_name' => 'SAP SuccessFactors',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'aalmanna@zatca.gov.sa',
                        'application_name' => 'SAS Risk Engine',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'kjajula@zatca.gov.sa',
                        'application_name' => 'SAS Risk Engine',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'okalam@zatca.gov.sa',
                        'application_name' => 'SAS Risk Engine',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'schilukurty@zatca.gov.sa',
                        'application_name' => 'SAS Risk Engine',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'imrkhan-c@zatca.gov.sa',
                        'application_name' => 'Sayen',
                        'app_role' => 'Viewer',
                        'is_primary' => false,
                        'remarks' => 'Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'sowaidah-c@zatca.gov.sa',
                        'application_name' => 'Sayen',
                        'app_role' => 'Viewer',
                        'is_primary' => false,
                        'remarks' => 'Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'aamjad@zatca.gov.sa',
                        'application_name' => 'Shamel Middleware',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'jjonah@zatca.gov.sa',
                        'application_name' => 'Shamel Middleware',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'jrachapudi-c@zatca.gov.sa',
                        'application_name' => 'Shamel Middleware',
                        'app_role' => 'Viewer',
                        'is_primary' => false,
                        'remarks' => 'Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'lm.alqhofaily@zatca.gov.sa',
                        'application_name' => 'Shamel Middleware',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'ssaleh@zatca.gov.sa',
                        'application_name' => 'Shamel Middleware',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'hhisham@zatca.gov.sa',
                        'application_name' => 'Smart Contracts',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'jjonah@zatca.gov.sa',
                        'application_name' => 'Smart Contracts',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'lm.alqhofaily@zatca.gov.sa',
                        'application_name' => 'Smart Contracts',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'jjonah@zatca.gov.sa',
                        'application_name' => 'Taxation support system, Contracts and Imports oracle system',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'lm.alqhofaily@zatca.gov.sa',
                        'application_name' => 'Taxation support system, Contracts and Imports oracle system',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'sshoueb@zatca.gov.sa',
                        'application_name' => 'Taxation support system, Contracts and Imports oracle system',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'zhussain@zatca.gov.sa',
                        'application_name' => 'Taxation support system, Contracts and Imports oracle system',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'hhisham@zatca.gov.sa',
                        'application_name' => 'TeamMate',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'lm.alqhofaily@zatca.gov.sa',
                        'application_name' => 'TeamMate',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'ssiraj@zatca.gov.sa',
                        'application_name' => 'TeamMate',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'ddev@zatca.gov.sa',
                        'application_name' => 'Terradata',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'aasma@zatca.gov.sa',
                        'application_name' => 'Vendor Portal',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'fkhan@zatca.gov.sa',
                        'application_name' => 'Vendor Portal',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'ln.al-momani@zatca.gov.sa',
                        'application_name' => 'Vendor Portal',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'malsadoon@zatca.gov.sa',
                        'application_name' => 'Vendor Portal',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'mkamal@zatca.gov.sa',
                        'application_name' => 'Vendor Portal',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'nezzat@zatca.gov.sa',
                        'application_name' => 'Vendor Portal',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'ralabbad@zatca.gov.sa',
                        'application_name' => 'Vendor Portal',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'zalharbi@zatca.gov.sa',
                        'application_name' => 'Vendor Portal',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'gsumanth@zatca.gov.sa',
                        'application_name' => 'VoC - Medallia',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'lm.alqhofaily@zatca.gov.sa',
                        'application_name' => 'VoC - Medallia',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'nalonazi@zatca.gov.sa',
                        'application_name' => 'VoC - Medallia',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'nneehal@zatca.gov.sa',
                        'application_name' => 'VoC - Medallia',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'vpesari@zatca.gov.sa',
                        'application_name' => 'VoC - Medallia',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'malsadoon@zatca.gov.sa',
                        'application_name' => 'WebEOC/DRA',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'mmuteb@zatca.gov.sa',
                        'application_name' => 'WebEOC/DRA',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'nniklish@zatca.gov.sa',
                        'application_name' => 'WebEOC/DRA',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'rrenad@zatca.gov.sa',
                        'application_name' => 'WebEOC/DRA',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'jalbalwi@zatca.gov.sa',
                        'application_name' => 'Zakaty',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'jbalawi-c@zatca.gov.sa',
                        'application_name' => 'Zakaty',
                        'app_role' => 'Viewer',
                        'is_primary' => false,
                        'remarks' => 'Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'lm.alqhofaily@zatca.gov.sa',
                        'application_name' => 'Zakaty',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'mdorgamy@zatca.gov.sa',
                        'application_name' => 'Zakaty',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'mdorghamy-c@zatca.gov.sa',
                        'application_name' => 'Zakaty',
                        'app_role' => 'Viewer',
                        'is_primary' => false,
                        'remarks' => 'Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'salqahtani@zatca.gov.sa',
                        'application_name' => 'Zakaty',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'ssiraj@zatca.gov.sa',
                        'application_name' => 'Zakaty',
                        'app_role' => 'Viewer',
                        'is_primary' => false,
                        'remarks' => 'Imported from Users Excel',
                        ],
                        [
                        'user_email' => 'aalzahrani@zatca.gov.sa',
                        'application_name' => 'ZATCA & Conference Portal',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'cmishara@zatca.gov.sa',
                        'application_name' => 'ZATCA & Conference Portal',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'inigam@zatca.gov.sa',
                        'application_name' => 'ZATCA & Conference Portal',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'lm.alqhofaily@zatca.gov.sa',
                        'application_name' => 'ZATCA & Conference Portal',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'adonthireddy@zatca.gov.sa',
                        'application_name' => 'ZATCA Mobile',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'apg-syedsiraj@zatca.gov.sa',
                        'application_name' => 'ZATCA Mobile',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'lm.alqhofaily@zatca.gov.sa',
                        'application_name' => 'ZATCA Mobile',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                        [
                        'user_email' => 'zhussain@zatca.gov.sa',
                        'application_name' => 'ZATCA Mobile',
                        'app_role' => 'Application Lead',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA App Lead',
                        ],
                        [
                        'user_email' => 'cmishara@zatca.gov.sa',
                        'application_name' => 'Ziyad',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'inigam@zatca.gov.sa',
                        'application_name' => 'Ziyad',
                        'app_role' => 'Support',
                        'is_primary' => false,
                        'remarks' => 'PHASE2 Support',
                        ],
                        [
                        'user_email' => 'malshaharani@zatca.gov.sa',
                        'application_name' => 'Ziyad',
                        'app_role' => 'ZATCA Management',
                        'is_primary' => true,
                        'remarks' => 'PHASE2 ZATCA Management Owner',
                        ],
                ];
        }
}
                             