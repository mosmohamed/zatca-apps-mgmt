<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\User;
use App\Support\DashboardWidgetLayout;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\SeedsRolesAndPermissions;
use Tests\TestCase;

class DashboardWidgetLayoutSettingsFeatureTest extends TestCase
{
    use RefreshDatabase;
    use SeedsRolesAndPermissions;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedRolesAndPermissions();

        $this->admin = User::factory()->create([
            'email' => 'layout-settings@zatca.sa',
        ]);
        $this->admin->assignRole('super_admin');
    }

    #[Test]
    public function public_settings_include_normalized_widget_layout(): void
    {
        $response = $this->getJson('/api/v1/settings/public')
            ->assertOk()
            ->assertJsonPath('data.dashboard_widget_layout.widgets.license_usage.span_desktop', 2)
            ->assertJsonPath('data.dashboard_widget_layout.widgets.top_technologies.span_desktop', 3)
            ->assertJsonPath('data.dashboard_widget_layout.widgets.recent_activity.show_header', true);

        $order = $response->json('data.dashboard_widget_layout.default_order');
        $this->assertIsArray($order);
        $this->assertContains('license_usage', $order);
        $this->assertContains('weather', $order);
    }

    #[Test]
    public function administrator_can_update_widget_layout_spans_and_chrome(): void
    {
        Sanctum::actingAs($this->admin);

        $layout = DashboardWidgetLayout::defaults();
        $layout['widgets']['license_usage']['span_desktop'] = 6;
        $layout['widgets']['license_usage']['show_description'] = false;
        $layout['widgets']['license_usage']['chart_height_px'] = 320;
        $layout['default_order'] = array_values(array_unique(array_merge(
            ['recent_activity', 'license_usage'],
            $layout['default_order'],
        )));

        $this->putJson('/api/v1/settings', [
            'settings' => [
                'dashboard_widget_layout' => $layout,
            ],
        ])
            ->assertOk()
            ->assertJsonPath('data.dashboard_widget_layout.widgets.license_usage.span_desktop', 6)
            ->assertJsonPath('data.dashboard_widget_layout.widgets.license_usage.show_description', false)
            ->assertJsonPath('data.dashboard_widget_layout.widgets.license_usage.chart_height_px', 320)
            ->assertJsonPath('data.dashboard_widget_layout.default_order.0', 'recent_activity');

        $stored = Setting::query()->where('key', DashboardWidgetLayout::SETTING_KEY)->first();
        $this->assertNotNull($stored);
        $decoded = json_decode((string) $stored->value, true);
        $this->assertSame(6, $decoded['widgets']['license_usage']['span_desktop']);
    }

    #[Test]
    public function widget_layout_rejects_invalid_span_and_unknown_widget_keys(): void
    {
        Sanctum::actingAs($this->admin);

        $this->putJson('/api/v1/settings', [
            'settings' => [
                'dashboard_widget_layout' => [
                    'widgets' => [
                        'license_usage' => [
                            'span_desktop' => 9,
                        ],
                        'not_a_widget' => [
                            'span_desktop' => 2,
                        ],
                    ],
                ],
            ],
        ])
            ->assertStatus(422);
    }

    #[Test]
    public function layout_normalization_fills_missing_new_widget_keys(): void
    {
        Setting::query()->updateOrCreate(
            ['key' => DashboardWidgetLayout::SETTING_KEY],
            [
                'value' => json_encode([
                    'default_order' => ['license_usage'],
                    'widgets' => [
                        'license_usage' => ['span_desktop' => 6],
                    ],
                ], JSON_THROW_ON_ERROR),
                'type' => 'json',
                'group' => 'dashboard',
                'label' => 'Dashboard Widget Layout',
                'is_public' => true,
            ],
        );

        $response = $this->getJson('/api/v1/settings/public')->assertOk();

        $widgets = $response->json('data.dashboard_widget_layout.widgets');
        $this->assertIsArray($widgets);
        $this->assertArrayHasKey('top_technologies', $widgets);
        $this->assertArrayHasKey('network_ops_license_usage', $widgets);
        $this->assertArrayHasKey('smart_facilities_license_usage', $widgets);
        $this->assertArrayHasKey('prayer_times', $widgets);
        $this->assertSame(6, $widgets['license_usage']['span_desktop']);
        $this->assertSame(3, $widgets['top_technologies']['span_desktop']);
    }

    #[Test]
    public function user_dashboard_default_order_follows_admin_layout_config(): void
    {
        Sanctum::actingAs($this->admin);

        $layout = DashboardWidgetLayout::defaults();
        $layout['default_order'] = array_values(array_unique(array_merge(
            ['recent_activity', 'applications_by_status'],
            $layout['default_order'],
        )));

        $this->putJson('/api/v1/settings', [
            'settings' => [
                'dashboard_widget_layout' => $layout,
            ],
        ])->assertOk();

        $this->getJson('/api/v1/dashboard/layout')
            ->assertOk()
            ->assertJsonPath('data.is_custom', false)
            ->assertJsonPath('data.widget_order.0', 'recent_activity')
            ->assertJsonPath('data.widget_order.1', 'applications_by_status');
    }
}
