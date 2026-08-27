<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\InfraLicense;
use App\Models\License;
use App\Models\ServiceDeskLicense;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;
use Tests\Concerns\SeedsRolesAndPermissions;
use Tests\TestCase;

class DashboardLicenseChartsFeatureTest extends TestCase
{
    use RefreshDatabase;
    use SeedsRolesAndPermissions;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedRolesAndPermissions();

        $this->admin = User::factory()->create([
            'email' => 'dashboard-licenses@zatca.sa',
        ]);
        $this->admin->assignRole('super_admin');

        License::factory()->create(['licensed' => 100, 'used' => 40, 'available' => 60]);
        InfraLicense::factory()->create(['licensed' => 70, 'used' => 30, 'available' => 40]);
        ServiceDeskLicense::factory()->create(['licensed' => 25, 'used' => 5, 'available' => 20]);
    }

    #[Test]
    public function dashboard_exposes_a_separate_usage_chart_per_license_catalogue(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->getJson('/api/v1/dashboard')->assertOk();

        $this->assertSame(100, $this->chartCount($response->json('data.charts.license_usage'), 'licensed'));
        $this->assertSame(70, $this->chartCount($response->json('data.charts.infra_license_usage'), 'licensed'));
        $this->assertSame(25, $this->chartCount($response->json('data.charts.service_desk_license_usage'), 'licensed'));

        $this->assertSame(40, $this->chartCount($response->json('data.charts.license_usage'), 'used'));
        $this->assertSame(40, $this->chartCount($response->json('data.charts.infra_license_usage'), 'available'));
        $this->assertSame(20, $this->chartCount($response->json('data.charts.service_desk_license_usage'), 'available'));
    }

    #[Test]
    public function each_license_chart_is_gated_by_its_own_view_permission(): void
    {
        $role = Role::findOrCreate('apps-licenses-viewer', 'web');
        $role->syncPermissions(['licenses.view']);

        $viewer = User::factory()->create(['email' => 'dashboard-licenses-viewer@zatca.sa']);
        $viewer->assignRole($role);

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        Sanctum::actingAs($viewer);

        $response = $this->getJson('/api/v1/dashboard')->assertOk();

        $this->assertSame(100, $this->chartCount($response->json('data.charts.license_usage'), 'licensed'));
        $this->assertSame([], $response->json('data.charts.infra_license_usage'));
        $this->assertSame([], $response->json('data.charts.service_desk_license_usage'));
    }

    private function chartCount(mixed $chart, string $key): int
    {
        $this->assertIsArray($chart);

        foreach ($chart as $slice) {
            if (is_array($slice) && ($slice['key'] ?? null) === $key) {
                return (int) $slice['count'];
            }
        }

        $this->fail(sprintf('Chart slice "%s" was not found.', $key));
    }
}
