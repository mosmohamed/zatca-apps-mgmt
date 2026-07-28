<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\AppRole;
use App\Models\Application;
use App\Models\ApplicationAssignment;
use App\Models\ApplicationStatus;
use App\Models\ApplicationType;
use App\Models\Criticality;
use App\Models\Department;
use App\Models\SupportType;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Throwable;

class LegacyApplicationImportSeeder extends Seeder
{
    public function run(): void
    {
        $csvPath = $this->resolveCsvPath();

        if ($csvPath === null) {
            Log::warning('LegacyApplicationImportSeeder: CSV file not found.');
            $this->command?->warn('LegacyApplicationImportSeeder skipped: CSV file not found.');

            return;
        }

        $admin = $this->resolveAssigner();
        $supportRole = AppRole::query()->firstOrCreate(
            ['name' => 'Support Engineer'],
            [
                'description' => 'Legacy support engineer assignment',
                'is_active' => true,
                'sort_order' => 100,
            ],
        );

        $department = Department::query()->firstOrCreate(
            ['name_en' => 'General IT'],
            ['name_ar' => 'General IT'],
        );

        $statusActiveId = (int) ApplicationStatus::query()->where('code', 'Active')->value('id');
        $statusMaintenanceId = (int) ApplicationStatus::query()->where('code', 'Maintenance')->value('id');
        $criticalityMediumId = (int) Criticality::query()->where('code', 'Medium')->value('id');
        $supportBusinessHoursId = (int) SupportType::query()->where('code', 'Business Hours')->value('id');

        if ($statusActiveId === 0 || $statusMaintenanceId === 0 || $criticalityMediumId === 0 || $supportBusinessHoursId === 0) {
            Log::warning('LegacyApplicationImportSeeder: Required master data (status/criticality/support type) is missing. Run ApplicationStatusSeeder, CriticalitySeeder, and SupportTypeSeeder first.');
            $this->command?->error('LegacyApplicationImportSeeder aborted: master data missing.');

            return;
        }

        $handle = fopen($csvPath, 'rb');

        if ($handle === false) {
            Log::warning('LegacyApplicationImportSeeder: Unable to open CSV file.', ['path' => $csvPath]);

            return;
        }

        try {
            $headers = fgetcsv($handle);

            if ($headers === false) {
                Log::warning('LegacyApplicationImportSeeder: CSV appears empty.', ['path' => $csvPath]);

                return;
            }

            $columnMap = $this->mapHeaders($headers);

            if (! isset($columnMap['App Names'])) {
                Log::warning('LegacyApplicationImportSeeder: Required header "App Names" was not found.', [
                    'headers' => $headers,
                ]);

                return;
            }

            $imported = 0;
            $failed = 0;

            while (($row = fgetcsv($handle)) !== false) {
                try {
                    if ($this->isBlankRow($row)) {
                        continue;
                    }

                    $appName = trim((string) $this->cell($row, $columnMap, 'App Names'));

                    if ($appName === '') {
                        continue;
                    }

                    $category = trim((string) $this->cell($row, $columnMap, 'Category?'));
                    $live = trim((string) $this->cell($row, $columnMap, 'Live? Yes/No'));
                    $whoSupport = trim((string) $this->cell($row, $columnMap, 'Who Support?'));
                    $remarks = trim((string) $this->cell($row, $columnMap, 'Remarks'));

                    $applicationType = $this->resolveApplicationType(
                        $category !== '' ? $category : 'Application'
                    );

                    $statusId = strcasecmp($live, 'Yes') === 0
                        ? $statusActiveId
                        : $statusMaintenanceId;

                    $application = Application::query()->firstOrNew(['name_en' => $appName]);

                    if (! $application->exists) {
                        $application->code = $this->uniqueApplicationCode($appName);
                        $application->created_by = $admin->id;
                    }

                    $application->fill([
                        'name_ar' => $appName,
                        'department_id' => $department->id,
                        'application_type_id' => $applicationType->id,
                        'status_id' => $statusId,
                        'criticality_id' => $criticalityMediumId,
                        'support_type_id' => $supportBusinessHoursId,
                        'updated_by' => $admin->id,
                    ]);
                    $application->save();

                    if ($whoSupport !== '') {
                        $this->importSupportAssignments(
                            $application,
                            $whoSupport,
                            $supportRole,
                            $admin,
                        );
                        $this->syncOwnersFromNames($application, $whoSupport, 'technical');
                    }

                    if ($remarks !== '') {
                        $this->syncOwnersFromNames($application, $remarks, 'business');
                    }

                    $imported++;
                } catch (Throwable $exception) {
                    $failed++;
                    Log::warning('LegacyApplicationImportSeeder: Failed to import CSV row.', [
                        'row' => $row,
                        'message' => $exception->getMessage(),
                    ]);

                    continue;
                }
            }

            $this->command?->info(sprintf(
                'LegacyApplicationImportSeeder finished. Imported/updated: %d, failed rows: %d.',
                $imported,
                $failed,
            ));
        } finally {
            fclose($handle);
        }
    }

    private function resolveCsvPath(): ?string
    {
        // Packaged with the app for Docker / Coolify seeding.
        $candidates = [
            database_path('data'.DIRECTORY_SEPARATOR.'apps_master_sheet.csv'),
            database_path('data'.DIRECTORY_SEPARATOR.'Apps_Master_Sheet - Sheet1.csv'),
            base_path('..'.DIRECTORY_SEPARATOR.'Apps_Master_Sheet - Sheet1.csv'),
            base_path('Apps_Master_Sheet - Sheet1.csv'),
        ];

        foreach ($candidates as $path) {
            if (is_file($path)) {
                return $path;
            }
        }

        return null;
    }

    private function resolveAssigner(): User
    {
        $admin = User::query()
            ->role('super_admin')
            ->orderBy('id')
            ->first();

        if ($admin instanceof User) {
            return $admin;
        }

        return User::query()->firstOrCreate(
            ['email' => 'system@zatca.sa'],
            [
                'first_name' => 'System',
                'last_name' => 'Importer',
                'password' => 'password',
                'is_active' => true,
                'email_verified_at' => now(),
            ],
        );
    }

    private function resolveApplicationType(string $categoryName): ApplicationType
    {
        $normalized = trim($categoryName);
        $code = Str::upper(Str::slug($normalized, '_'));

        if ($code === '') {
            $code = 'APPLICATION';
        }

        return ApplicationType::query()->firstOrCreate(
            ['code' => $code],
            [
                'name_en' => $normalized,
                'name_ar' => $normalized,
            ],
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

    private function importSupportAssignments(
        Application $application,
        string $supportString,
        AppRole $supportRole,
        User $assigner,
    ): void {
        $names = explode('-', $supportString);

        foreach ($names as $rawName) {
            $name = trim($rawName);

            if ($name === '') {
                continue;
            }

            $parts = preg_split('/\s+/', $name) ?: [];
            $parts = array_values(array_filter($parts, static fn (string $part): bool => $part !== ''));

            if ($parts === []) {
                continue;
            }

            $firstName = $parts[0];
            $lastName = count($parts) > 1
                ? implode(' ', array_slice($parts, 1))
                : 'Support';

            $email = Str::slug($name).'@zatca.sa';

            if ($email === '@zatca.sa') {
                $email = 'support-'.Str::lower(Str::random(8)).'@zatca.sa';
            }

            $user = User::withTrashed()->firstOrCreate(
                ['email' => $email],
                [
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'password' => 'password',
                    'is_active' => true,
                    'email_verified_at' => now(),
                ],
            );

            if ($user->trashed()) {
                $user->restore();
            }

            if (! $user->is_active) {
                $user->update(['is_active' => true]);
            }

            ApplicationAssignment::query()->firstOrCreate(
                [
                    'application_id' => $application->id,
                    'user_id' => $user->id,
                    'ended_at' => null,
                ],
                [
                    'app_role_id' => $supportRole->id,
                    'assigned_by' => $assigner->id,
                    'assigned_at' => now(),
                    'is_primary' => false,
                    'remarks' => 'Imported from legacy Apps Master Sheet',
                ],
            );
        }
    }

    private function syncOwnersFromNames(
        Application $application,
        string $rawNames,
        string $kind,
    ): void {
        $chunks = preg_split('/\s*[-,]\s*/u', $rawNames) ?: [];
        $userIds = [];

        foreach ($chunks as $chunk) {
            $normalized = trim((string) preg_replace('/\s+/u', ' ', (string) $chunk));
            if ($normalized === '') {
                continue;
            }

            $needle = mb_strtolower($normalized, 'UTF-8');
            $userId = User::query()
                ->whereRaw(
                    'LOWER(CONCAT(TRIM(first_name), \' \', TRIM(last_name))) = ?',
                    [$needle]
                )
                ->value('id');

            if ($userId !== null) {
                $userIds[] = (int) $userId;
            }
        }

        $userIds = array_values(array_unique($userIds));
        if ($userIds === []) {
            return;
        }

        if ($kind === 'business') {
            $application->businessOwners()->syncWithoutDetaching($userIds);

            return;
        }

        $application->technicalOwners()->syncWithoutDetaching($userIds);
    }

    /**
     * @param  list<string|null>  $headers
     * @return array<string, int>
     */
    private function mapHeaders(array $headers): array
    {
        $map = [];

        foreach ($headers as $index => $header) {
            $normalized = trim((string) $header);

            if ($normalized === '') {
                continue;
            }

            $map[$normalized] = $index;
        }

        return $map;
    }

    /**
     * @param  list<string|null>  $row
     * @param  array<string, int>  $columnMap
     */
    private function cell(array $row, array $columnMap, string $header): mixed
    {
        if (! isset($columnMap[$header])) {
            return null;
        }

        return $row[$columnMap[$header]] ?? null;
    }

    /**
     * @param  list<string|null>  $row
     */
    private function isBlankRow(array $row): bool
    {
        foreach ($row as $value) {
            if (trim((string) $value) !== '') {
                return false;
            }
        }

        return true;
    }
}
