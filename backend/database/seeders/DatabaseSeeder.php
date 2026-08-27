<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // Lookup / platform masters that ImportedPortfolioSeeder reads but does not own.
        $this->call([
            PermissionSeeder::class,
            EnvironmentSeeder::class,
            SettingsSeeder::class,
            ApplicationTypeSeeder::class,
            SupportTypeSeeder::class,
            CriticalitySeeder::class,
            ApplicationStatusSeeder::class,
            JobTitleSeeder::class,
        ]);

        // Portfolio data source of truth for:
        // users, app_roles, departments, vendors, technologies,
        // applications, application_assignments (+ pivots).
        //
        // Disabled overlapping seeders (do not re-enable alongside this one):
        // - AppRoleSeeder
        // - DepartmentSeeder
        // - TechnologySeeder
        // - VendorSeeder
        // - SuperAdminSeeder
        // - ViewerSeeder
        // - LegacyApplicationImportSeeder
        $this->call(ImportedPortfolioSeeder::class);

        $this->call([
            LicenseSeeder::class,
            OperationInfraSeeder::class,
            ServiceDeskSeeder::class,
        ]);
    }
}
