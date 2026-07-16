<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\HaModel;
use App\Models\Application;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\SeedsRolesAndPermissions;
use Tests\TestCase;

class ApplicationHaModelFeatureTest extends TestCase
{
    use RefreshDatabase;
    use SeedsRolesAndPermissions;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedRolesAndPermissions();

        $this->admin = User::factory()->create([
            'email' => 'ha-admin@zatca.sa',
        ]);
        $this->admin->assignRole('super_admin');
    }

    #[Test]
    public function admin_can_create_application_with_ha_model(): void
    {
        Sanctum::actingAs($this->admin);

        $template = Application::factory()->create();

        $response = $this->postJson('/api/v1/applications', [
            'department_id' => $template->department_id,
            'application_type_id' => $template->application_type_id,
            'name_ar' => 'تطبيق توافر عالي',
            'name_en' => 'HA Model App',
            'code' => 'HA-MODEL-001',
            'status_id' => $template->status_id,
            'criticality_id' => $template->criticality_id,
            'support_type_id' => $template->support_type_id,
            'ha_model' => HaModel::ActiveActive->value,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.ha_model', HaModel::ActiveActive->value);

        $this->assertDatabaseHas('applications', [
            'code' => 'HA-MODEL-001',
            'ha_model' => HaModel::ActiveActive->value,
        ]);
    }

    #[Test]
    public function admin_can_clear_ha_model_on_update(): void
    {
        Sanctum::actingAs($this->admin);

        $application = Application::factory()->create([
            'ha_model' => HaModel::HotStandby->value,
        ]);

        $response = $this->putJson('/api/v1/applications/'.$application->id, [
            'ha_model' => null,
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.ha_model', null);

        $this->assertDatabaseHas('applications', [
            'id' => $application->id,
            'ha_model' => null,
        ]);
    }

    #[Test]
    public function ha_model_rejects_invalid_values(): void
    {
        Sanctum::actingAs($this->admin);

        $template = Application::factory()->create();

        $response = $this->postJson('/api/v1/applications', [
            'department_id' => $template->department_id,
            'application_type_id' => $template->application_type_id,
            'name_ar' => 'تطبيق غير صالح',
            'name_en' => 'Invalid HA App',
            'code' => 'HA-INVALID-001',
            'status_id' => $template->status_id,
            'criticality_id' => $template->criticality_id,
            'support_type_id' => $template->support_type_id,
            'ha_model' => 'Not A Real Model',
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonValidationErrors(['ha_model']);
    }
}
