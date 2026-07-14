<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Enums\TechnologyCategory;
use App\Models\Application;
use App\Models\ApplicationStatus;
use App\Models\Technology;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\SeedsRolesAndPermissions;
use Tests\TestCase;

class TechnologyFeatureTest extends TestCase
{
    use RefreshDatabase;
    use SeedsRolesAndPermissions;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedRolesAndPermissions();

        $this->admin = User::factory()->create([
            'email' => 'tech-admin@zatca.sa',
        ]);
        $this->admin->assignRole('super_admin');
    }

    #[Test]
    public function admin_can_create_and_list_technologies(): void
    {
        Sanctum::actingAs($this->admin);

        $create = $this->postJson('/api/v1/technologies', [
            'name' => 'React',
            'category' => TechnologyCategory::Frontend->value,
            'description' => 'UI library',
            'is_active' => true,
        ]);

        $create
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.name', 'React')
            ->assertJsonPath('data.category', 'Frontend');

        $this->assertDatabaseHas('technologies', [
            'name' => 'React',
            'category' => 'Frontend',
        ]);

        $list = $this->getJson('/api/v1/technologies');
        $list->assertOk()->assertJsonPath('success', true);

        $lookup = $this->getJson('/api/v1/lookups/technologies');
        $lookup
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.0.name', 'React');
    }

    #[Test]
    public function application_create_and_update_sync_technologies(): void
    {
        Sanctum::actingAs($this->admin);

        $react = Technology::factory()->create([
            'name' => 'React Sync',
            'category' => TechnologyCategory::Frontend,
        ]);
        $laravel = Technology::factory()->create([
            'name' => 'Laravel Sync',
            'category' => TechnologyCategory::Backend,
        ]);

        $application = Application::factory()->create();

        $createPayload = [
            'department_id' => $application->department_id,
            'application_type_id' => $application->application_type_id,
            'name_ar' => 'تطبيق تقنيات',
            'name_en' => 'Tech Sync App',
            'code' => 'TECH-SYNC-001',
            'status_id' => $application->status_id,
            'criticality_id' => $application->criticality_id,
            'support_type_id' => $application->support_type_id,
            'technologies' => [$react->id, $laravel->id],
        ];

        $create = $this->postJson('/api/v1/applications', $createPayload);
        $create
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonCount(2, 'data.technologies');

        $applicationId = (int) $create->json('data.id');

        $this->assertDatabaseHas('application_technology', [
            'application_id' => $applicationId,
            'technology_id' => $react->id,
        ]);
        $this->assertDatabaseHas('application_technology', [
            'application_id' => $applicationId,
            'technology_id' => $laravel->id,
        ]);

        $update = $this->putJson("/api/v1/applications/{$applicationId}", [
            'technologies' => [$react->id],
        ]);

        $update
            ->assertOk()
            ->assertJsonCount(1, 'data.technologies')
            ->assertJsonPath('data.technologies.0.id', $react->id);

        $this->assertDatabaseMissing('application_technology', [
            'application_id' => $applicationId,
            'technology_id' => $laravel->id,
        ]);
    }

    #[Test]
    public function dashboard_includes_technology_chart_payloads(): void
    {
        Sanctum::actingAs($this->admin);

        $activeStatus = ApplicationStatus::query()->firstOrCreate(
            ['code' => 'Active'],
            [
                'name_en' => 'Active',
                'name_ar' => 'نشط',
                'is_active' => true,
            ],
        );

        $react = Technology::factory()->create([
            'name' => 'React Dash',
            'category' => TechnologyCategory::Frontend,
            'is_active' => true,
        ]);

        $application = Application::factory()->create([
            'status_id' => $activeStatus->id,
        ]);
        $application->technologies()->sync([$react->id]);

        $response = $this->getJson('/api/v1/dashboard');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'totals' => ['applications', 'active_users', 'vendors', 'technologies'],
                    'charts' => [
                        'technologies_usage',
                        'employees_per_application',
                        'applications_by_department',
                        'applications_by_status',
                    ],
                    'recent_activity',
                ],
            ]);

        $usage = collect($response->json('data.charts.technologies_usage'));
        $this->assertTrue($usage->contains(fn (array $row): bool => $row['name'] === 'React Dash'));

        $employees = collect($response->json('data.charts.employees_per_application'));
        $this->assertIsArray($employees->all());
    }
}
