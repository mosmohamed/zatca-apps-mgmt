<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\Concerns\SeedsRolesAndPermissions;
use Tests\TestCase;

class LoginDefaultCredentialsSettingsFeatureTest extends TestCase
{
    use RefreshDatabase;
    use SeedsRolesAndPermissions;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedRolesAndPermissions();

        $this->admin = User::factory()->create([
            'email' => 'login-defaults-admin@zatca.sa',
        ]);
        $this->admin->assignRole('super_admin');
    }

    #[Test]
    public function the_login_page_can_read_the_default_credentials_without_authentication(): void
    {
        $this->getJson('/api/v1/settings/public')
            ->assertOk()
            ->assertJsonPath('data.login_default_credentials_enabled', true)
            ->assertJsonPath('data.login_default_email', 'viewer@zatca.gov.sa')
            ->assertJsonPath('data.login_default_password', 'password');
    }

    #[Test]
    public function a_super_admin_can_change_the_default_credentials(): void
    {
        Sanctum::actingAs($this->admin);

        $this->putJson('/api/v1/settings', [
            'settings' => [
                'login_default_credentials_enabled' => false,
                'login_default_email' => 'demo@zatca.gov.sa',
                'login_default_password' => 'secret-demo',
            ],
        ])
            ->assertOk()
            ->assertJsonPath('data.login_default_credentials_enabled', false)
            ->assertJsonPath('data.login_default_email', 'demo@zatca.gov.sa')
            ->assertJsonPath('data.login_default_password', 'secret-demo');

        $this->assertDatabaseHas('settings', [
            'key' => 'login_default_credentials_enabled',
            'value' => '0',
        ]);
    }

    #[Test]
    public function settings_managers_who_are_not_super_admins_cannot_change_the_default_credentials(): void
    {
        $role = Role::findOrCreate('settings_manager', 'web');
        $role->syncPermissions(['settings.view', 'settings.update']);

        $manager = User::factory()->create(['email' => 'settings-manager@zatca.sa']);
        $manager->assignRole($role);

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        Sanctum::actingAs($manager);

        $this->putJson('/api/v1/settings', [
            'settings' => [
                'login_default_email' => 'attacker@example.com',
            ],
        ])->assertForbidden();

        $this->assertDatabaseHas('settings', [
            'key' => 'login_default_email',
            'value' => 'viewer@zatca.gov.sa',
        ]);

        $this->putJson('/api/v1/settings', [
            'settings' => [
                'company_name' => 'CENTRIX Operations',
            ],
        ])->assertOk();
    }
}
