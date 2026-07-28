<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Application;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\SeedsRolesAndPermissions;
use Tests\TestCase;

class ApplicationOwnersFeatureTest extends TestCase
{
    use RefreshDatabase;
    use SeedsRolesAndPermissions;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedRolesAndPermissions();

        $this->admin = User::factory()->create([
            'email' => 'owners-admin@zatca.sa',
        ]);
        $this->admin->assignRole('super_admin');
    }

    #[Test]
    public function admin_can_create_application_with_multiple_owners(): void
    {
        Sanctum::actingAs($this->admin);

        $template = Application::factory()->create();
        $businessA = User::factory()->create(['first_name' => 'Sara', 'last_name' => 'Ali']);
        $businessB = User::factory()->create(['first_name' => 'Omar', 'last_name' => 'Hassan']);
        $technical = User::factory()->create(['first_name' => 'Noura', 'last_name' => 'Fahad']);

        $response = $this->postJson('/api/v1/applications', [
            'department_id' => $template->department_id,
            'application_type_id' => $template->application_type_id,
            'name_ar' => 'تطبيق متعدد الملاك',
            'name_en' => 'Multi Owner App',
            'code' => 'OWNERS-001',
            'status_id' => $template->status_id,
            'criticality_id' => $template->criticality_id,
            'support_type_id' => $template->support_type_id,
            'business_owners' => [$businessA->id, $businessB->id],
            'technical_owners' => [$technical->id],
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonCount(2, 'data.business_owners')
            ->assertJsonCount(1, 'data.technical_owners');

        $this->assertDatabaseHas('application_business_owners', [
            'application_id' => $response->json('data.id'),
            'user_id' => $businessA->id,
        ]);
        $this->assertDatabaseHas('application_business_owners', [
            'application_id' => $response->json('data.id'),
            'user_id' => $businessB->id,
        ]);
        $this->assertDatabaseHas('application_technical_owners', [
            'application_id' => $response->json('data.id'),
            'user_id' => $technical->id,
        ]);
        $this->assertDatabaseCount('application_business_owners', 2);
    }

    #[Test]
    public function admin_can_update_and_clear_application_owners(): void
    {
        Sanctum::actingAs($this->admin);

        $application = Application::factory()->create();
        $first = User::factory()->create();
        $second = User::factory()->create();
        $application->businessOwners()->sync([$first->id]);
        $application->technicalOwners()->sync([$first->id]);

        $this->putJson('/api/v1/applications/'.$application->id, [
            'business_owners' => [$second->id],
            'technical_owners' => [],
        ])
            ->assertOk()
            ->assertJsonCount(1, 'data.business_owners')
            ->assertJsonPath('data.business_owners.0.id', $second->id)
            ->assertJsonCount(0, 'data.technical_owners');

        $this->assertDatabaseHas('application_business_owners', [
            'application_id' => $application->id,
            'user_id' => $second->id,
        ]);
        $this->assertDatabaseMissing('application_business_owners', [
            'application_id' => $application->id,
            'user_id' => $first->id,
        ]);
        $this->assertDatabaseMissing('application_technical_owners', [
            'application_id' => $application->id,
            'user_id' => $first->id,
        ]);
    }

    #[Test]
    public function owner_payload_rejects_unknown_and_duplicate_user_ids(): void
    {
        Sanctum::actingAs($this->admin);

        $template = Application::factory()->create();
        $user = User::factory()->create();

        $this->postJson('/api/v1/applications', [
            'department_id' => $template->department_id,
            'application_type_id' => $template->application_type_id,
            'name_ar' => 'تطبيق غير صالح',
            'name_en' => 'Invalid Owners App',
            'code' => 'OWNERS-INVALID',
            'status_id' => $template->status_id,
            'criticality_id' => $template->criticality_id,
            'support_type_id' => $template->support_type_id,
            'business_owners' => [$user->id, $user->id],
            'technical_owners' => [999999],
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['business_owners.1', 'technical_owners.0']);
    }

    #[Test]
    public function application_show_includes_hydrated_owners(): void
    {
        Sanctum::actingAs($this->admin);

        $application = Application::factory()->create();
        $owner = User::factory()->create([
            'first_name' => 'Lina',
            'last_name' => 'Nasser',
            'email' => 'lina.nasser@zatca.sa',
        ]);
        $application->businessOwners()->sync([$owner->id]);

        $this->getJson('/api/v1/applications/'.$application->id)
            ->assertOk()
            ->assertJsonPath('data.business_owners.0.id', $owner->id)
            ->assertJsonPath('data.business_owners.0.full_name', 'Lina Nasser')
            ->assertJsonPath('data.business_owners.0.email', 'lina.nasser@zatca.sa');
    }
}
