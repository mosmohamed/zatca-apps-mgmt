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
            // Apps licenses catalogue.
            'licenses.view',
            'licenses.create',
            'licenses.update',
            'licenses.delete',
            'licenses.export',
            'infra-licenses.view',
            'infra-licenses.create',
            'infra-licenses.update',
            'infra-licenses.delete',
            'infra-licenses.export',
            'service-desk-licenses.view',
            'service-desk-licenses.create',
            'service-desk-licenses.update',
            'service-desk-licenses.delete',
            'service-desk-licenses.export',
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
            'applications-details.view',
            'applications-details.create',
            'applications-details.update',
            'applications-details.delete',
            'applications-details.export',
            'assignments.view',
            'assignments.create',
            'assignments.update',
            'assignments.delete',
            'assignments.export',
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
            'service-desk-levels.view',
            'service-desk-levels.create',
            'service-desk-levels.update',
            'service-desk-levels.delete',
            'service-desk-categories.view',
            'service-desk-categories.create',
            'service-desk-categories.update',
            'service-desk-categories.delete',
            'service-desk-team-assignments.view',
            'service-desk-team-assignments.create',
            'service-desk-team-assignments.update',
            'service-desk-team-assignments.delete',
        ];

        foreach ($permissions as $permission) {
            Permission::findOrCreate($permission, $guardName);
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $superAdmin = Role::findOrCreate('super_admin', $guardName);
        $employee = Role::findOrCreate('employee', $guardName);
        $infraAdmin = Role::findOrCreate('infra_admin', $guardName);
        $sdAdmin = Role::findOrCreate('sd_admin', $guardName);
        $viewer = Role::findOrCreate('viewer', $guardName);

        $viewPermissions = [
            'departments.view',
            'application-types.view',
            'app-roles.view',
            'job-titles.view',
            'support-types.view',
            'criticalities.view',
            'application-statuses.view',
            'technologies.view',
            'licenses.view',
            'infra-licenses.view',
            'service-desk-licenses.view',
            'vendors.view',
            'users.view',
            'applications.view',
            'applications-details.view',
            'assignments.view',
            'settings.view',
            'dashboard-layout.manage',
            'application-infrastructure.view',
            'infra-levels.view',
            'infra-categories.view',
            'infra-team-assignments.view',
            'service-desk-levels.view',
            'service-desk-categories.view',
            'service-desk-team-assignments.view',
        ];

        $superAdmin->syncPermissions($permissions);

        $employee->syncPermissions($viewPermissions);
        $viewer->syncPermissions($viewPermissions);

        $infraAdmin->syncPermissions([
            ...$viewPermissions,
            'infra-licenses.view',
            'infra-licenses.create',
            'infra-licenses.update',
            'infra-licenses.delete',
            'infra-licenses.export',
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
        ]);

        $sdAdmin->syncPermissions([
            ...$viewPermissions,
            'service-desk-licenses.view',
            'service-desk-licenses.create',
            'service-desk-licenses.update',
            'service-desk-licenses.delete',
            'service-desk-licenses.export',
            'service-desk-levels.view',
            'service-desk-levels.create',
            'service-desk-levels.update',
            'service-desk-levels.delete',
            'service-desk-categories.view',
            'service-desk-categories.create',
            'service-desk-categories.update',
            'service-desk-categories.delete',
            'service-desk-team-assignments.view',
            'service-desk-team-assignments.create',
            'service-desk-team-assignments.update',
            'service-desk-team-assignments.delete',
        ]);
    }
}
