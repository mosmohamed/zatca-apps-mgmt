<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\InfraLicense;
use App\Models\License;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\SeedsRolesAndPermissions;
use Tests\TestCase;

class InfraLicenseFeatureTest extends TestCase
{
    use RefreshDatabase;
    use SeedsRolesAndPermissions;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedRolesAndPermissions();

        $this->admin = User::factory()->create([
            'email' => 'infra-license-admin@zatca.sa',
        ]);
        $this->admin->assignRole('super_admin');
    }

    #[Test]
    public function admin_can_create_list_update_and_delete_infra_licenses(): void
    {
        Sanctum::actingAs($this->admin);

        $create = $this->postJson('/api/v1/infra-licenses', [
            'publisher' => 'VMware',
            'name' => 'vSphere Enterprise Plus',
            'product' => 'vSphere',
            'version' => '8.0',
            'description' => 'Hypervisor licensing for the private cloud',
            'environment' => 'Production',
            'licensed' => 100,
            'used' => 40,
            'available' => 999,
            'proof_of_entitlement' => 'https://example.com/poe.pdf',
            'start_date' => '2026-01-01',
            'end_date' => '2026-12-31',
        ]);

        $create
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.publisher', 'VMware')
            ->assertJsonPath('data.name', 'vSphere Enterprise Plus')
            ->assertJsonPath('data.available', 60)
            ->assertJsonPath('data.status', 'active');

        $infraLicenseId = (int) $create->json('data.id');

        $this->assertDatabaseHas('infra_licenses', [
            'id' => $infraLicenseId,
            'licensed' => 100,
            'used' => 40,
            'available' => 60,
        ]);

        $this->getJson('/api/v1/infra-licenses')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.pagination.total', 1);

        $this->getJson("/api/v1/infra-licenses/{$infraLicenseId}")
            ->assertOk()
            ->assertJsonPath('data.id', $infraLicenseId);

        $this->putJson("/api/v1/infra-licenses/{$infraLicenseId}", [
            'licensed' => 80,
            'used' => 50,
            'available' => 1,
        ])
            ->assertOk()
            ->assertJsonPath('data.licensed', 80)
            ->assertJsonPath('data.used', 50)
            ->assertJsonPath('data.available', 30);

        $this->deleteJson("/api/v1/infra-licenses/{$infraLicenseId}")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertSoftDeleted('infra_licenses', ['id' => $infraLicenseId]);
    }

    #[Test]
    public function infra_licenses_are_isolated_from_apps_licenses(): void
    {
        Sanctum::actingAs($this->admin);

        InfraLicense::factory()->count(3)->create();
        License::factory()->create();

        $this->getJson('/api/v1/infra-licenses')
            ->assertOk()
            ->assertJsonPath('data.pagination.total', 3);

        $this->getJson('/api/v1/licenses')
            ->assertOk()
            ->assertJsonPath('data.pagination.total', 1);

        $this->assertDatabaseCount('infra_licenses', 3);
        $this->assertDatabaseCount('licenses', 1);
    }

    #[Test]
    public function admin_can_retrieve_infra_license_statistics(): void
    {
        Sanctum::actingAs($this->admin);

        InfraLicense::factory()->create([
            'licensed' => 100,
            'used' => 40,
            'available' => 60,
            'end_date' => now()->addMonths(6)->toDateString(),
        ]);
        InfraLicense::factory()->expired()->create([
            'licensed' => 50,
            'used' => 20,
            'available' => 30,
        ]);
        InfraLicense::factory()->expiringSoon()->create([
            'licensed' => 30,
            'used' => 10,
            'available' => 20,
        ]);

        // Apps licenses must never leak into the infrastructure statistics.
        License::factory()->create([
            'licensed' => 1000,
            'used' => 900,
            'available' => 100,
        ]);

        $this->getJson('/api/v1/infra-licenses/statistics')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.total_licenses', 3)
            ->assertJsonPath('data.total_licensed', 180)
            ->assertJsonPath('data.total_used', 70)
            ->assertJsonPath('data.total_available', 110)
            ->assertJsonPath('data.expired', 1)
            ->assertJsonPath('data.expiring_within_30_days', 1);
    }

    #[Test]
    public function employees_can_read_but_not_write_infra_licenses(): void
    {
        $employee = User::factory()->create(['email' => 'infra-license-employee@zatca.sa']);
        $employee->assignRole('employee');

        InfraLicense::factory()->create();

        Sanctum::actingAs($employee);

        $this->getJson('/api/v1/infra-licenses')->assertOk();

        $this->postJson('/api/v1/infra-licenses', [
            'publisher' => 'Red Hat',
            'name' => 'OpenShift',
            'product' => 'OpenShift',
            'environment' => 'UAT',
            'licensed' => 10,
            'used' => 2,
        ])->assertForbidden();
    }
}
