<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\HaModel;
use App\Models\Application;
use App\Models\Setting;
use App\Models\User;
use App\Support\DashboardWidgets;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Spatie\Permission\Models\Role;
use Tests\Concerns\SeedsRolesAndPermissions;
use Tests\TestCase;

class DashboardWidgetsSettingsFeatureTest extends TestCase
{
    use RefreshDatabase;
    use SeedsRolesAndPermissions;

    private User $admin;

    private User $employee;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedRolesAndPermissions();

        $this->admin = User::factory()->create([
            'email' => 'dashboard-settings@zatca.sa',
        ]);
        $this->admin->assignRole('super_admin');

        $this->employee = User::factory()->create([
            'email' => 'dashboard-employee@zatca.sa',
        ]);
        $this->employee->assignRole('employee');
    }

    #[Test]
    public function public_settings_include_normalized_dashboard_widgets(): void
    {
        $this->getJson('/api/v1/settings/public')
            ->assertOk()
            ->assertJsonPath('data.dashboard_widgets.top_technologies', true)
            ->assertJsonPath('data.dashboard_widgets.applications_by_ha_model', true)
            ->assertJsonPath('data.dashboard_widgets.network_ops_license_usage', true)
            ->assertJsonPath('data.dashboard_widgets.smart_facilities_license_usage', true)
            ->assertJsonPath('data.dashboard_widgets.weather', false)
            ->assertJsonPath('data.dashboard_widgets.local_time', false)
            ->assertJsonPath('data.dashboard_widgets.prayer_times', false)
            ->assertJsonMissingPath('data.dashboard_widgets_by_role');
    }

    #[Test]
    public function authenticated_admin_receives_role_scoped_widget_configuration(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->getJson('/api/v1/settings/public')
            ->assertOk()
            ->assertJsonPath('data.dashboard_widgets.weather', false);

        $byRole = $response->json('data.dashboard_widgets_by_role');
        $this->assertIsArray($byRole);
        $this->assertNotEmpty($byRole);

        $roles = $response->json('data.dashboard_widget_roles');
        $this->assertIsArray($roles);
        $this->assertNotEmpty($roles);
    }

    #[Test]
    public function administrator_can_toggle_dashboard_widgets_per_role(): void
    {
        Sanctum::actingAs($this->admin);

        $employeeRole = Role::query()->where('name', 'employee')->firstOrFail();
        $adminRole = Role::query()->where('name', 'super_admin')->firstOrFail();

        $employeeMap = DashboardWidgets::defaults();
        $employeeMap['applications_by_ha_model'] = false;
        $employeeMap['recent_activity'] = false;
        $employeeMap['weather'] = true;

        $adminMap = DashboardWidgets::defaults();
        $adminMap['weather'] = false;

        $this->putJson('/api/v1/settings', [
            'settings' => [
                'dashboard_widgets' => [
                    'roles' => [
                        (string) $employeeRole->id => $employeeMap,
                        (string) $adminRole->id => $adminMap,
                    ],
                ],
            ],
        ])
            ->assertOk()
            ->assertJsonPath('data.dashboard_widgets.weather', false)
            ->assertJsonPath(
                'data.dashboard_widgets_by_role.'.$employeeRole->id.'.applications_by_ha_model',
                false
            )
            ->assertJsonPath(
                'data.dashboard_widgets_by_role.'.$employeeRole->id.'.weather',
                true
            );

        Sanctum::actingAs($this->employee);

        $this->getJson('/api/v1/settings/public')
            ->assertOk()
            ->assertJsonPath('data.dashboard_widgets.applications_by_ha_model', false)
            ->assertJsonPath('data.dashboard_widgets.recent_activity', false)
            ->assertJsonPath('data.dashboard_widgets.weather', true)
            ->assertJsonPath('data.dashboard_widgets.top_technologies', true);
    }

    #[Test]
    public function legacy_flat_widget_payload_applies_to_all_roles(): void
    {
        Sanctum::actingAs($this->admin);

        $payload = DashboardWidgets::defaults();
        $payload['applications_by_ha_model'] = false;
        $payload['recent_activity'] = false;

        $this->putJson('/api/v1/settings', [
            'settings' => [
                'dashboard_widgets' => $payload,
            ],
        ])
            ->assertOk()
            ->assertJsonPath('data.dashboard_widgets.applications_by_ha_model', false)
            ->assertJsonPath('data.dashboard_widgets.recent_activity', false)
            ->assertJsonPath('data.dashboard_widgets.top_technologies', true);

        Sanctum::actingAs($this->employee);

        $this->getJson('/api/v1/settings/public')
            ->assertOk()
            ->assertJsonPath('data.dashboard_widgets.applications_by_ha_model', false)
            ->assertJsonPath('data.dashboard_widgets.recent_activity', false);
    }

    #[Test]
    public function widget_preferences_are_created_if_the_setting_record_is_missing(): void
    {
        Sanctum::actingAs($this->admin);

        Setting::query()->where('key', DashboardWidgets::SETTING_KEY)->delete();

        $payload = DashboardWidgets::defaults();
        $payload['license_usage'] = false;

        $this->putJson('/api/v1/settings', [
            'settings' => [
                'dashboard_widgets' => $payload,
            ],
        ])
            ->assertOk()
            ->assertJsonPath('data.dashboard_widgets.license_usage', false);

        $this->assertDatabaseHas('settings', [
            'key' => DashboardWidgets::SETTING_KEY,
            'type' => 'json',
            'is_public' => true,
        ]);
    }

    #[Test]
    public function creating_a_role_seeds_default_dashboard_widgets(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->postJson('/api/v1/roles', [
            'name' => 'ops_analyst',
        ])->assertCreated();

        $roleId = (string) $response->json('data.id');

        $this->getJson('/api/v1/settings/public')
            ->assertOk()
            ->assertJsonPath('data.dashboard_widgets_by_role.'.$roleId.'.top_technologies', true)
            ->assertJsonPath('data.dashboard_widgets_by_role.'.$roleId.'.weather', false)
            ->assertJsonPath('data.dashboard_widgets_by_role.'.$roleId.'.local_time', false)
            ->assertJsonPath('data.dashboard_widgets_by_role.'.$roleId.'.prayer_times', false);
    }

    #[Test]
    public function dashboard_returns_ha_model_distribution(): void
    {
        Sanctum::actingAs($this->admin);

        Application::factory()->create(['ha_model' => HaModel::ActiveActive->value]);
        Application::factory()->create(['ha_model' => HaModel::ActiveActive->value]);
        Application::factory()->create(['ha_model' => HaModel::HotStandby->value]);

        $response = $this->getJson('/api/v1/dashboard');

        $response
            ->assertOk()
            ->assertJsonPath('success', true);

        $haChart = collect($response->json('data.charts.applications_by_ha_model'));

        $this->assertSame(4, $haChart->count());
        $this->assertSame(
            2,
            (int) $haChart->firstWhere('key', HaModel::ActiveActive->value)['count']
        );
        $this->assertSame(
            1,
            (int) $haChart->firstWhere('key', HaModel::HotStandby->value)['count']
        );
        $this->assertSame(
            0,
            (int) $haChart->firstWhere('key', HaModel::ColdStandby->value)['count']
        );
    }
}
