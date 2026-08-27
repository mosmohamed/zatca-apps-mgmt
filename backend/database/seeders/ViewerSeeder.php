<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\JobTitle;
use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

/**
 * Read-only demo account advertised on the login screen via the
 * `login_default_*` settings.
 *
 * Unlike the Super Admin seeder this never resets the password of an existing
 * account, so an administrator can rotate it without the next deploy undoing it.
 */
class ViewerSeeder extends Seeder
{
    public function run(): void
    {
        $email = (string) env('VIEWER_EMAIL', 'viewer@zatca.gov.sa');
        $password = (string) env('VIEWER_PASSWORD', 'password');

        $jobTitleId = JobTitle::query()
            ->where('name_en', 'System Administrator')
            ->value('id');

        $viewer = User::query()->firstOrCreate(
            ['email' => $email],
            [
                'first_name' => 'Default',
                'last_name' => 'Viewer',
                'password' => $password,
                'phone' => null,
                'teams' => null,
                'whatsapp' => null,
                'extension' => null,
                'job_title_id' => $jobTitleId,
                'is_active' => true,
                'email_verified_at' => now(),
            ],
        );

        $roleName = Role::query()->where('name', 'viewer')->exists() ? 'viewer' : 'employee';

        if (! $viewer->hasRole($roleName)) {
            $viewer->assignRole($roleName);
        }
    }
}
