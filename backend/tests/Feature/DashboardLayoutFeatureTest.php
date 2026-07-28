<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use App\Support\DashboardWidgets;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\SeedsRolesAndPermissions;
use Tests\TestCase;

class DashboardLayoutFeatureTest extends TestCase
{
    use RefreshDatabase;
    use SeedsRolesAndPermissions;

    private User $employee;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedRolesAndPermissions();

        $this->employee = User::factory()->create([
            'email' => 'dashboard-layout@zatca.sa',
        ]);
        $this->employee->assignRole('employee');
    }

    #[Test]
    public function guests_cannot_read_the_dashboard_layout(): void
    {
        $this->getJson('/api/v1/dashboard/layout')->assertUnauthorized();
    }

    #[Test]
    public function default_layout_is_returned_when_no_custom_layout_exists(): void
    {
        Sanctum::actingAs($this->employee);

        $this->getJson('/api/v1/dashboard/layout')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.is_custom', false)
            ->assertJsonPath('data.widget_order', DashboardWidgets::keys());
    }

    #[Test]
    public function a_user_can_persist_a_custom_widget_order(): void
    {
        Sanctum::actingAs($this->employee);

        $this->putJson('/api/v1/dashboard/layout', [
            'widget_order' => ['recent_activity', 'license_usage', 'top_technologies'],
        ])
            ->assertOk()
            ->assertJsonPath('data.is_custom', true)
            ->assertJsonPath('data.widget_order.0', 'recent_activity')
            ->assertJsonPath('data.widget_order.1', 'license_usage')
            ->assertJsonPath('data.widget_order.2', 'top_technologies');

        $this->assertDatabaseHas('user_dashboard_layouts', [
            'user_id' => $this->employee->id,
        ]);

        $this->assertDatabaseCount('user_dashboard_layouts', 1);
    }

    #[Test]
    public function a_saved_layout_is_restored_and_new_widgets_are_appended(): void
    {
        Sanctum::actingAs($this->employee);

        $this->putJson('/api/v1/dashboard/layout', [
            'widget_order' => ['weather', 'applications_by_status'],
        ])->assertOk();

        $saved = ['weather', 'applications_by_status'];
        $expected = array_merge($saved, array_values(array_diff(DashboardWidgets::keys(), $saved)));

        $this->getJson('/api/v1/dashboard/layout')
            ->assertOk()
            ->assertJsonPath('data.is_custom', true)
            ->assertJsonPath('data.widget_order', $expected);
    }

    #[Test]
    public function persisting_a_partial_order_keeps_the_remaining_widgets_available(): void
    {
        Sanctum::actingAs($this->employee);

        $response = $this->putJson('/api/v1/dashboard/layout', [
            'widget_order' => ['license_usage'],
        ])->assertOk();

        $order = $response->json('data.widget_order');

        $this->assertIsArray($order);
        $this->assertSame('license_usage', $order[0]);
        $this->assertCount(count(DashboardWidgets::keys()), $order);

        foreach (DashboardWidgets::keys() as $key) {
            $this->assertContains($key, $order);
        }
    }

    #[Test]
    public function resetting_the_layout_removes_the_stored_row_and_returns_defaults(): void
    {
        Sanctum::actingAs($this->employee);

        $this->putJson('/api/v1/dashboard/layout', [
            'widget_order' => ['recent_activity', 'top_technologies'],
        ])->assertOk();

        $this->deleteJson('/api/v1/dashboard/layout')
            ->assertOk()
            ->assertJsonPath('data.is_custom', false)
            ->assertJsonPath('data.widget_order', DashboardWidgets::keys());

        $this->assertDatabaseCount('user_dashboard_layouts', 0);

        $this->getJson('/api/v1/dashboard/layout')
            ->assertOk()
            ->assertJsonPath('data.is_custom', false)
            ->assertJsonPath('data.widget_order', DashboardWidgets::keys());
    }

    #[Test]
    public function unknown_widget_keys_are_rejected(): void
    {
        Sanctum::actingAs($this->employee);

        $this->putJson('/api/v1/dashboard/layout', [
            'widget_order' => ['top_technologies', 'not_a_widget'],
        ])
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonValidationErrors('widget_order.1');

        $this->assertDatabaseCount('user_dashboard_layouts', 0);
    }

    #[Test]
    public function duplicate_and_empty_widget_orders_are_rejected(): void
    {
        Sanctum::actingAs($this->employee);

        $this->putJson('/api/v1/dashboard/layout', [
            'widget_order' => ['top_technologies', 'top_technologies'],
        ])->assertUnprocessable();

        $this->putJson('/api/v1/dashboard/layout', [
            'widget_order' => [],
        ])->assertUnprocessable();

        $this->assertDatabaseCount('user_dashboard_layouts', 0);
    }

    #[Test]
    public function layouts_are_isolated_per_user(): void
    {
        $other = User::factory()->create(['email' => 'dashboard-layout-other@zatca.sa']);
        $other->assignRole('employee');

        Sanctum::actingAs($this->employee);
        $this->putJson('/api/v1/dashboard/layout', [
            'widget_order' => ['recent_activity'],
        ])->assertOk();

        Sanctum::actingAs($other);
        $this->getJson('/api/v1/dashboard/layout')
            ->assertOk()
            ->assertJsonPath('data.is_custom', false)
            ->assertJsonPath('data.widget_order', DashboardWidgets::keys());
    }

    #[Test]
    public function updating_the_layout_is_recorded_in_the_activity_log(): void
    {
        Sanctum::actingAs($this->employee);

        $this->putJson('/api/v1/dashboard/layout', [
            'widget_order' => ['recent_activity', 'license_usage'],
        ])->assertOk();

        $this->assertDatabaseHas('activity_log', [
            'log_name' => 'dashboard_layout',
            'description' => 'dashboard_layout.updated',
            'causer_id' => $this->employee->id,
        ]);

        $this->deleteJson('/api/v1/dashboard/layout')->assertOk();

        $this->assertDatabaseHas('activity_log', [
            'log_name' => 'dashboard_layout',
            'description' => 'dashboard_layout.reset',
            'causer_id' => $this->employee->id,
        ]);
    }

    #[Test]
    public function users_without_the_permission_cannot_manage_layouts(): void
    {
        $outsider = User::factory()->create(['email' => 'dashboard-layout-outsider@zatca.sa']);

        Sanctum::actingAs($outsider);

        $this->getJson('/api/v1/dashboard/layout')->assertForbidden();
        $this->putJson('/api/v1/dashboard/layout', [
            'widget_order' => ['recent_activity'],
        ])->assertForbidden();
        $this->deleteJson('/api/v1/dashboard/layout')->assertForbidden();
    }
}
