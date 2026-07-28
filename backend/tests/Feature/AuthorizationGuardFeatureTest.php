<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Application;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Spatie\Permission\Models\Role;
use Tests\Concerns\SeedsRolesAndPermissions;
use Tests\TestCase;

class AuthorizationGuardFeatureTest extends TestCase
{
    use RefreshDatabase;
    use SeedsRolesAndPermissions;

    private User $viewer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedRolesAndPermissions();

        $role = Role::findOrCreate('limited_viewer', 'web');
        $role->syncPermissions([
            'applications.view',
            'vendors.view',
        ]);

        $this->viewer = User::factory()->create([
            'email' => 'limited-viewer@zatca.sa',
        ]);
        $this->viewer->assignRole($role);
    }

    #[Test]
    public function lookups_require_matching_view_or_related_permissions(): void
    {
        Sanctum::actingAs($this->viewer);

        $this->getJson('/api/v1/lookups/departments')->assertOk();
        $this->getJson('/api/v1/lookups/technologies')->assertOk();
        $this->getJson('/api/v1/lookups/job-titles')->assertForbidden();
        $this->getJson('/api/v1/lookups/app-roles')->assertForbidden();
    }

    #[Test]
    public function crud_endpoints_return_forbidden_without_permission(): void
    {
        Sanctum::actingAs($this->viewer);

        $this->getJson('/api/v1/users')->assertForbidden();
        $this->getJson('/api/v1/departments')->assertForbidden();
        $this->getJson('/api/v1/licenses')->assertForbidden();
        $this->getJson('/api/v1/roles')->assertForbidden();
        $this->getJson('/api/v1/activity-logs')->assertForbidden();
        $this->putJson('/api/v1/settings', [
            'settings' => ['company_name' => 'Hacked'],
        ])->assertForbidden();

        $this->getJson('/api/v1/applications')->assertOk();
        $this->getJson('/api/v1/vendors')->assertOk();
    }

    #[Test]
    public function global_search_only_returns_permitted_categories(): void
    {
        $vendor = Vendor::factory()->create(['name' => 'Zeta Networks Solutions']);
        $application = Application::factory()->create(['name_en' => 'Zeta Portfolio Manager']);
        $user = User::factory()->create([
            'first_name' => 'Zeta',
            'last_name' => 'Operator',
            'email' => 'zeta.operator@zatca.sa',
        ]);

        Sanctum::actingAs($this->viewer);

        $response = $this->getJson('/api/v1/search?query=Zeta');

        $response
            ->assertOk()
            ->assertJsonPath('success', true);

        $applications = collect($response->json('data.applications'));
        $vendors = collect($response->json('data.vendors'));

        $this->assertTrue($applications->contains(fn (array $row): bool => $row['id'] === $application->id));
        $this->assertTrue($vendors->contains(fn (array $row): bool => $row['id'] === $vendor->id));
        $this->assertSame(
            '/applications/'.$application->id,
            $applications->firstWhere('id', $application->id)['url'],
        );
        $this->assertSame([], $response->json('data.users'));
        $this->assertSame([], $response->json('data.departments'));
        $this->assertFalse(
            collect($response->json('data.users'))->contains(fn (array $row): bool => $row['id'] === $user->id),
        );
    }

    #[Test]
    public function dashboard_redacts_data_the_user_cannot_view(): void
    {
        Cache::forget('dashboard.summary');

        Application::factory()->count(2)->create();
        Vendor::factory()->create();

        Sanctum::actingAs($this->viewer);

        $response = $this->getJson('/api/v1/dashboard');

        $response
            ->assertOk()
            ->assertJsonPath('data.totals.applications', 2)
            ->assertJsonPath('data.totals.vendors', 1)
            ->assertJsonPath('data.totals.active_users', 0)
            ->assertJsonPath('data.totals.licenses', 0)
            ->assertJsonPath('data.charts.license_usage', [])
            ->assertJsonPath('data.recent_activity', []);

        $this->assertNotEmpty($response->json('data.charts.applications_by_status'));
    }
}
