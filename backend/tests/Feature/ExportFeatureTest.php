<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\SeedsRolesAndPermissions;
use Tests\TestCase;

class ExportFeatureTest extends TestCase
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
            'email' => 'export-admin@itportfolio.local',
        ]);
        $this->admin->assignRole('super_admin');

        $this->employee = User::factory()->create([
            'email' => 'export-employee@itportfolio.local',
        ]);
        $this->employee->assignRole('employee');
    }

    #[Test]
    public function admin_can_export_vendors_as_xlsx(): void
    {
        Vendor::factory()->count(3)->create();

        Sanctum::actingAs($this->admin);

        $response = $this->postJson('/api/v1/exports/vendors', [
            'format' => 'xlsx',
            'scope' => 'all',
        ]);

        $response->assertOk();
        $this->assertStringContainsString('Vendors_', (string) $response->headers->get('Content-Disposition'));
        $this->assertStringContainsString('.xlsx', (string) $response->headers->get('Content-Disposition'));

        $this->assertDatabaseHas('activity_log', [
            'description' => 'Exported Vendors Report (all, xlsx)',
        ]);
    }

    #[Test]
    public function admin_can_export_vendors_as_json_with_selected_scope(): void
    {
        $vendors = Vendor::factory()->count(3)->create();

        Sanctum::actingAs($this->admin);

        $response = $this->postJson('/api/v1/exports/vendors', [
            'format' => 'json',
            'scope' => 'selected',
            'ids' => [$vendors->first()->id],
        ]);

        $response->assertOk();

        $content = $response->streamedContent();
        $decoded = json_decode($content, true);

        $this->assertIsArray($decoded);
        $this->assertCount(1, $decoded);
        $this->assertSame($vendors->first()->name, $decoded[0]['Name']);
    }

    #[Test]
    public function employee_without_export_permission_is_forbidden(): void
    {
        Sanctum::actingAs($this->employee);

        $this->postJson('/api/v1/exports/vendors', [
            'format' => 'json',
            'scope' => 'all',
        ])->assertForbidden();
    }

    #[Test]
    public function unknown_entity_returns_not_found(): void
    {
        Sanctum::actingAs($this->admin);

        $this->postJson('/api/v1/exports/unknown-entity', [
            'format' => 'json',
            'scope' => 'all',
        ])->assertNotFound();
    }

    #[Test]
    public function selected_scope_requires_ids(): void
    {
        Sanctum::actingAs($this->admin);

        $this->postJson('/api/v1/exports/vendors', [
            'format' => 'json',
            'scope' => 'selected',
        ])->assertStatus(422);
    }
}
