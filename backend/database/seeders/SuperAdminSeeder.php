<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\JobTitle;
use App\Models\User;
use Illuminate\Database\Seeder;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $email = (string) env('SUPER_ADMIN_EMAIL', 'admin@zatca.sa');
        $password = (string) env('SUPER_ADMIN_PASSWORD', 'password');

        $jobTitleId = JobTitle::query()
            ->where('name_en', 'System Administrator')
            ->value('id');

        $admin = User::query()->firstOrCreate(
            ['email' => $email],
            [
                'first_name' => 'Super',
                'last_name' => 'Admin',
                'password' => $password,
                'authentication_type' => 'local',
                'phone' => null,
                'teams' => null,
                'whatsapp' => null,
                'extension' => null,
                'job_title_id' => $jobTitleId,
                'is_active' => true,
                'email_verified_at' => now(),
            ],
        );

        if ($jobTitleId !== null && $admin->job_title_id !== $jobTitleId) {
            $admin->update(['job_title_id' => $jobTitleId]);
        }

        if (! $admin->hasRole('super_admin')) {
            $admin->assignRole('super_admin');
        }
    }
}
