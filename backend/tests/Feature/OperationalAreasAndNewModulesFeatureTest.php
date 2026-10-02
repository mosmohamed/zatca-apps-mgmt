<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Application;
use App\Models\NetworkOpsCategory;
use App\Models\NetworkOpsLevel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\Concerns\SeedsRolesAndPermissions;
use Tests\TestCase;

class OperationalAreasAndNewModulesFeatureTest extends TestCase
{
    use RefreshDatabase;
    use SeedsRolesAndPermissions;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedRolesAndPermissions();
    }

    #[Test]
    public function users_can_be_filtered_and_synced_by_operational_area(): void
    {
        $admin = User::factory()->create(['email' => 'areas-admin@zatca.sa']);
        $admin->assignRole('super_admin');

        Sanctum::actingAs($admin);

        $create = $this->postJson('/api/v1/users', [
            'first_name' => 'Net',
            'last_name' => 'Ops',
            'email' => 'netops-user@zatca.gov.sa',
            'password' => 'password',
            'password_confirmation' => 'password',
            'is_active' => true,
            'areas' => ['network_ops', 'infra'],
        ])->assertCreated();

        $areas = $create->json('data.areas');
        $this->assertIsArray($areas);
        sort($areas);
        $this->assertSame(['infra', 'network_ops'], $areas);

        $this->getJson('/api/v1/users?area=network_ops')
            ->assertOk()
            ->assertJsonFragment(['email' => 'netops-user@zatca.gov.sa']);

        $this->getJson('/api/v1/users?area=smart_facilities')
            ->assertOk()
            ->assertJsonMissing(['email' => 'netops-user@zatca.gov.sa']);
    }

    #[Test]
    public function applications_details_view_can_list_applications_without_applications_view(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();
        Permission::findOrCreate('applications-details.view', 'web');
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $viewer = User::factory()->create(['email' => 'apps-details-only@zatca.sa']);
        $viewer->givePermissionTo('applications-details.view');

        Application::factory()->create([
            'name_en' => 'Portfolio App',
            'name_ar' => 'تطبيق المحفظة',
        ]);

        Sanctum::actingAs($viewer);

        $this->getJson('/api/v1/applications')
            ->assertOk()
            ->assertJsonPath('success', true);

        $forbidden = User::factory()->create(['email' => 'no-apps@zatca.sa']);
        Sanctum::actingAs($forbidden);

        $this->getJson('/api/v1/applications')->assertForbidden();
    }

    #[Test]
    public function escalation_matrix_details_require_matrix_permission_not_team_assignments(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();
        foreach ([
            'network-ops-team-assignments.view',
            'network-ops-escalation-matrix.view',
        ] as $permission) {
            Permission::findOrCreate($permission, 'web');
        }
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        NetworkOpsLevel::query()->create([
            'code' => 'L0',
            'name_en' => 'L0',
            'name_ar' => 'L0',
            'sort_order' => 0,
            'is_active' => true,
        ]);
        NetworkOpsCategory::query()->create([
            'code' => 'NO-TEST',
            'name_en' => 'Test Stream',
            'name_ar' => 'اختبار',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $teamOnly = User::factory()->create(['email' => 'matrix-team-only@zatca.sa']);
        $teamOnly->givePermissionTo('network-ops-team-assignments.view');

        Sanctum::actingAs($teamOnly);
        $this->getJson('/api/v1/network-ops-team-assignments/details')->assertForbidden();

        $matrixViewer = User::factory()->create(['email' => 'matrix-viewer@zatca.sa']);
        $matrixViewer->givePermissionTo('network-ops-escalation-matrix.view');

        Sanctum::actingAs($matrixViewer);
        $this->getJson('/api/v1/network-ops-team-assignments/details')
            ->assertOk()
            ->assertJsonPath('success', true);
    }

    #[Test]
    public function network_ops_categories_smoke_crud_works(): void
    {
        $admin = User::factory()->create(['email' => 'netops-admin@zatca.sa']);
        $admin->assignRole('super_admin');

        Sanctum::actingAs($admin);

        $this->postJson('/api/v1/network-ops-categories', [
            'name_en' => 'Core',
            'name_ar' => 'الأساسية',
            'code' => 'NO-SMOKE',
            'sort_order' => 1,
            'is_active' => true,
        ])->assertCreated()
            ->assertJsonPath('data.code', 'NO-SMOKE');

        $this->getJson('/api/v1/network-ops-categories')
            ->assertOk()
            ->assertJsonFragment(['code' => 'NO-SMOKE']);
    }
}
