<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\AppRole;
use Illuminate\Database\Seeder;

class AppRoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            ['name' => 'Admin', 'description' => 'Full application administration', 'sort_order' => 1],
            ['name' => 'Developer', 'description' => 'Development and deployment access', 'sort_order' => 2],
            ['name' => 'QA', 'description' => 'Quality assurance and testing', 'sort_order' => 3],
            ['name' => 'Support', 'description' => 'Operational support access', 'sort_order' => 4],
            ['name' => 'Business Owner', 'description' => 'Business ownership and oversight', 'sort_order' => 5],
            ['name' => 'Viewer', 'description' => 'Read-only application access', 'sort_order' => 6],
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
}
