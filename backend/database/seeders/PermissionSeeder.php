<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $guardName = 'web';

        $permissions = [
            'departments.view',
            'departments.create',
            'departments.update',
            'departments.delete',
            'departments.export',
            'application-types.view',
            'application-types.create',
            'application-types.update',
            'application-types.delete',
            'app-roles.view',
            'app-roles.create',
            'app-roles.update',
            'app-roles.delete',
            'job-titles.view',
            'job-titles.create',
            'job-titles.update',
            'job-titles.delete',
            'support-types.view',
            'support-types.create',
            'support-types.update',
            'support-types.delete',
            'criticalities.view',
            'criticalities.create',
            'criticalities.update',
            'criticalities.delete',
            'application-statuses.view',
            'application-statuses.create',
            'application-statuses.update',
            'application-statuses.delete',
            'technologies.view',
            'technologies.create',
            'technologies.update',
            'technologies.delete',
            'technologies.export',
            'licenses.view',
            'licenses.create',
            'licenses.update',
            'licenses.delete',
            'licenses.export',
            'vendors.view',
            'vendors.create',
            'vendors.update',
            'vendors.delete',
            'vendors.export',
            'users.view',
            'users.create',
            'users.update',
            'users.delete',
            'users.export',
            'applications.view',
            'applications.create',
            'applications.update',
            'applications.delete',
            'applications.export',
            'assignments.view',
            'assignments.create',
            'assignments.update',
            'assignments.delete',
            'roles.view',
            'roles.create',
            'roles.update',
            'roles.delete',
            'permissions.view',
            'activity-log.view',
            'settings.view',
            'settings.update',
            'dashboard-layout.manage',
            'application-infrastructure.view',
            'application-infrastructure.create',
            'application-infrastructure.update',
            'application-infrastructure.delete',
            'application-infrastructure.view-public',
            'application-infrastructure.view-operational',
            'application-infrastructure.copy-environment',
            'infra-levels.view',
            'infra-levels.create',
            'infra-levels.update',
            'infra-levels.delete',
            'infra-categories.view',
            'infra-categories.create',
            'infra-categories.update',
            'infra-categories.delete',
            'infra-team-assignments.view',
            'infra-team-assignments.create',
            'infra-team-assignments.update',
            'infra-team-assignments.delete',
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission, $guardName);
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $superAdmin = Role::findOrCreate('super_admin', $guardName);
        $employee = Role::findOrCreate('employee', $guardName);

        $superAdmin->syncPermissions($permissions);

        $employee->syncPermissions([
            'departments.view',
            'application-types.view',
            'app-roles.view',
            'job-titles.view',
            'support-types.view',
            'criticalities.view',
            'application-statuses.view',
            'technologies.view',
            'licenses.view',
            'vendors.view',
            'users.view',
            'applications.view',
            'assignments.view',
            'settings.view',
            'dashboard-layout.manage',
            'application-infrastructure.view',
            'infra-levels.view',
            'infra-categories.view',
            'infra-team-assignments.view',
        ]);
    }
}
