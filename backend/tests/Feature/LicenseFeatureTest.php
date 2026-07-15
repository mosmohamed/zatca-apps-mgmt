<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\License;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\SeedsRolesAndPermissions;
use Tests\TestCase;

class LicenseFeatureTest extends TestCase
{
    use RefreshDatabase;
    use SeedsRolesAndPermissions;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedRolesAndPermissions();

        $this->admin = User::factory()->create([
            'email' => 'license-admin@zatca.sa',
        ]);
        $this->admin->assignRole('super_admin');
    }

    #[Test]
    public function admin_can_create_list_update_and_delete_licenses(): void
    {
        Sanctum::actingAs($this->admin);

        $create = $this->postJson('/api/v1/licenses', [
            'publisher' => 'Microsoft',
            'name' => 'Office 365 E3',
            'product' => 'Microsoft 365',
            'version' => '2024',
            'description' => 'Enterprise productivity suite',
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
            ->assertJsonPath('data.publisher', 'Microsoft')
            ->assertJsonPath('data.name', 'Office 365 E3')
            ->assertJsonPath('data.available', 60)
            ->assertJsonPath('data.status', 'active');

        $licenseId = (int) $create->json('data.id');

        $this->assertDatabaseHas('licenses', [
            'id' => $licenseId,
            'licensed' => 100,
            'used' => 40,
            'available' => 60,
        ]);

        $list = $this->getJson('/api/v1/licenses');
        $list->assertOk()->assertJsonPath('success', true);

        $update = $this->putJson("/api/v1/licenses/{$licenseId}", [
            'licensed' => 80,
            'used' => 50,
            'available' => 1,
        ]);

        $update
            ->assertOk()
            ->assertJsonPath('data.licensed', 80)
            ->assertJsonPath('data.used', 50)
            ->assertJsonPath('data.available', 30);

        $this->assertDatabaseHas('licenses', [
            'id' => $licenseId,
            'available' => 30,
        ]);

        $delete = $this->deleteJson("/api/v1/licenses/{$licenseId}");
        $delete->assertOk()->assertJsonPath('success', true);

        $this->assertSoftDeleted('licenses', ['id' => $licenseId]);
    }

    #[Test]
    public function available_is_computed_as_max_zero_licensed_minus_used(): void
    {
        Sanctum::actingAs($this->admin);

        $create = $this->postJson('/api/v1/licenses', [
            'publisher' => 'Oracle',
            'name' => 'DB Enterprise',
            'product' => 'Oracle DB',
            'environment' => 'UAT',
            'licensed' => 10,
            'used' => 25,
            'available' => 100,
        ]);

        $create
            ->assertCreated()
            ->assertJsonPath('data.available', 0);

        $this->assertDatabaseHas('licenses', [
            'name' => 'DB Enterprise',
            'available' => 0,
        ]);
    }

    #[Test]
    public function admin_can_retrieve_license_statistics(): void
    {
        Sanctum::actingAs($this->admin);

        License::factory()->create([
            'licensed' => 100,
            'used' => 40,
            'available' => 60,
            'end_date' => now()->addMonths(6)->toDateString(),
        ]);
        License::factory()->expired()->create([
            'licensed' => 50,
            'used' => 20,
            'available' => 30,
        ]);
        License::factory()->expiringSoon()->create([
            'licensed' => 30,
            'used' => 10,
            'available' => 20,
        ]);

        $response = $this->getJson('/api/v1/licenses/statistics');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.total_licenses', 3)
            ->assertJsonPath('data.total_licensed', 180)
            ->assertJsonPath('data.total_used', 70)
            ->assertJsonPath('data.total_available', 110)
            ->assertJsonPath('data.expired', 1)
            ->assertJsonPath('data.expiring_within_30_days', 1);
    }
}
