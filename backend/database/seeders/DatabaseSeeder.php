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
        $this->call([
            PermissionSeeder::class,
            SettingsSeeder::class,
            DepartmentSeeder::class,
            ApplicationTypeSeeder::class,
            SupportTypeSeeder::class,
            CriticalitySeeder::class,
            ApplicationStatusSeeder::class,
            TechnologySeeder::class,
            AppRoleSeeder::class,
            JobTitleSeeder::class,
            VendorSeeder::class,
            SuperAdminSeeder::class,
            LegacyApplicationImportSeeder::class,
        ]);
    }
}
