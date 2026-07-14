<?php

declare(strict_types=1);

namespace Tests\Concerns;

use Database\Seeders\PermissionSeeder;
use Spatie\Permission\PermissionRegistrar;

trait SeedsRolesAndPermissions
{
    protected function seedRolesAndPermissions(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();
        $this->seed(PermissionSeeder::class);
        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }
}
