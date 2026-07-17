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
use Tests\Concerns\SeedsRolesAndPermissions;
use Tests\TestCase;

class DashboardWidgetsSettingsFeatureTest extends TestCase
{
    use RefreshDatabase;
    use SeedsRolesAndPermissions;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedRolesAndPermissions();

        $this->admin = User::factory()->create([
            'email' => 'dashboard-settings@zatca.sa',
        ]);
        $this->admin->assignRole('super_admin');
    }

    #[Test]
    public function public_settings_include_normalized_dashboard_widgets(): void
    {
        $this->getJson('/api/v1/settings/public')
            ->assertOk()
            ->assertJsonPath('data.dashboard_widgets.top_technologies', true)
            ->assertJsonPath('data.dashboard_widgets.applications_by_ha_model', true);
    }

    #[Test]
    public function administrator_can_toggle_dashboard_widgets(): void
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
