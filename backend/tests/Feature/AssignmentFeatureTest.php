<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Application;
use App\Models\ApplicationAssignment;
use App\Models\AppRole;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\SeedsRolesAndPermissions;
use Tests\TestCase;

class AssignmentFeatureTest extends TestCase
{
    use RefreshDatabase;
    use SeedsRolesAndPermissions;

    private User $admin;

    private User $employee;

    private User $assignee;

    private Application $application;

    private AppRole $roleAdmin;

    private AppRole $roleViewer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedRolesAndPermissions();

        $this->admin = User::factory()->create([
            'email' => 'admin-test@itportfolio.local',
        ]);
        $this->admin->assignRole('super_admin');

        $this->employee = User::factory()->create([
            'email' => 'employee-test@itportfolio.local',
        ]);
        $this->employee->assignRole('employee');

        $this->assignee = User::factory()->create([
            'email' => 'assignee-test@itportfolio.local',
        ]);
        $this->assignee->assignRole('employee');

        $this->application = Application::factory()->create();
        $this->roleAdmin = AppRole::factory()->create(['name' => 'App Admin']);
        $this->roleViewer = AppRole::factory()->create(['name' => 'App Viewer']);
    }

    #[Test]
    public function creating_assignment_opens_a_history_record(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->postJson('/api/v1/assignments', [
            'application_id' => $this->application->id,
            'user_id' => $this->assignee->id,
            'app_role_id' => $this->roleAdmin->id,
            'is_primary' => true,
            'remarks' => 'Initial access',
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.application_id', $this->application->id)
            ->assertJsonPath('data.user_id', $this->assignee->id)
            ->assertJsonPath('data.app_role_id', $this->roleAdmin->id)
            ->assertJsonPath('data.is_open', true)
            ->assertJsonPath('data.ended_at', null);

        $this->assertDatabaseCount('application_assignments', 1);
        $this->assertDatabaseHas('application_assignments', [
            'application_id' => $this->application->id,
            'user_id' => $this->assignee->id,
            'app_role_id' => $this->roleAdmin->id,
            'assigned_by' => $this->admin->id,
            'ended_at' => null,
            'is_primary' => 1,
            'remarks' => 'Initial access',
        ]);
    }

    #[Test]
    public function reassigning_closes_open_assignment_and_creates_new_history_row(): void
    {
        Sanctum::actingAs($this->admin);

        $first = $this->postJson('/api/v1/assignments', [
            'application_id' => $this->application->id,
            'user_id' => $this->assignee->id,
            'app_role_id' => $this->roleAdmin->id,
            'is_primary' => true,
            'remarks' => 'First role',
        ])->assertCreated();

        $firstId = (int) $first->json('data.id');

        $second = $this->postJson('/api/v1/assignments', [
            'application_id' => $this->application->id,
            'user_id' => $this->assignee->id,
            'app_role_id' => $this->roleViewer->id,
            'is_primary' => false,
            'remarks' => 'Role change',
        ])->assertCreated();

        $secondId = (int) $second->json('data.id');

        $this->assertNotSame($firstId, $secondId);
        $this->assertDatabaseCount('application_assignments', 2);

        $closed = ApplicationAssignment::query()->findOrFail($firstId);
        $open = ApplicationAssignment::query()->findOrFail($secondId);

        $this->assertNotNull($closed->ended_at);
        $this->assertNull($open->ended_at);
        $this->assertSame($this->roleAdmin->id, $closed->app_role_id);
        $this->assertSame($this->roleViewer->id, $open->app_role_id);

        $openCount = ApplicationAssignment::query()
            ->where('application_id', $this->application->id)
            ->where('user_id', $this->assignee->id)
            ->open()
            ->count();

        $this->assertSame(1, $openCount);

        $second
            ->assertJsonPath('data.id', $secondId)
            ->assertJsonPath('data.is_open', true)
            ->assertJsonPath('data.app_role_id', $this->roleViewer->id)
            ->assertJsonPath('data.remarks', 'Role change');
    }

    #[Test]
    public function ending_an_assignment_closes_without_replacement(): void
    {
        Sanctum::actingAs($this->admin);

        $created = $this->postJson('/api/v1/assignments', [
            'application_id' => $this->application->id,
            'user_id' => $this->assignee->id,
            'app_role_id' => $this->roleAdmin->id,
        ])->assertCreated();

        $assignmentId = (int) $created->json('data.id');

        $this->deleteJson("/api/v1/assignments/{$assignmentId}")
            ->assertOk()
            ->assertJsonPath('success', true);

        $assignment = ApplicationAssignment::query()->findOrFail($assignmentId);

        $this->assertNotNull($assignment->ended_at);
        $this->assertDatabaseCount('application_assignments', 1);
        $this->assertSame(0, ApplicationAssignment::query()->open()->count());
    }

    #[Test]
    public function closed_assignments_cannot_be_updated(): void
    {
        Sanctum::actingAs($this->admin);

        $assignment = ApplicationAssignment::factory()->ended()->create([
            'application_id' => $this->application->id,
            'user_id' => $this->assignee->id,
            'app_role_id' => $this->roleAdmin->id,
            'assigned_by' => $this->admin->id,
        ]);

        $this->putJson("/api/v1/assignments/{$assignment->id}", [
            'is_primary' => true,
            'remarks' => 'Should fail',
        ])
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    #[Test]
    public function employee_cannot_create_assignments(): void
    {
        Sanctum::actingAs($this->employee);

        $this->postJson('/api/v1/assignments', [
            'application_id' => $this->application->id,
            'user_id' => $this->assignee->id,
            'app_role_id' => $this->roleAdmin->id,
        ])->assertForbidden();
    }

    #[Test]
    public function employee_can_list_assignments(): void
    {
        ApplicationAssignment::factory()->create([
            'application_id' => $this->application->id,
            'user_id' => $this->assignee->id,
            'app_role_id' => $this->roleAdmin->id,
            'assigned_by' => $this->admin->id,
        ]);

        Sanctum::actingAs($this->employee);

        $this->getJson('/api/v1/assignments')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'success',
                'message',
                'data' => [
                    'items' => [
                        '*' => [
                            'id',
                            'application_id',
                            'user_id',
                            'app_role_id',
                            'is_open',
                            'application',
                            'user',
                            'app_role',
                        ],
                    ],
                    'pagination',
                ],
                'errors',
            ]);
    }

    #[Test]
    public function assignment_index_eager_loads_relations_without_n_plus_one(): void
    {
        foreach (range(1, 8) as $index) {
            ApplicationAssignment::factory()->create([
                'application_id' => Application::factory()->create([
                    'code' => "APP-N1-{$index}",
                ])->id,
                'user_id' => User::factory()->forVendor()->create()->id,
                'app_role_id' => $this->roleAdmin->id,
                'assigned_by' => $this->admin->id,
            ]);
        }

        Sanctum::actingAs($this->admin);

        DB::flushQueryLog();
        DB::enableQueryLog();

        $response = $this->getJson('/api/v1/assignments?per_page=15');

        $queries = DB::getQueryLog();
        DB::disableQueryLog();

        $response
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertNotEmpty($response->json('data.items.0.application'));
        $this->assertNotEmpty($response->json('data.items.0.user'));
        $this->assertNotEmpty($response->json('data.items.0.app_role'));

        $this->assertLessThan(
            30,
            count($queries),
            sprintf(
                'Expected bounded query count for assignment index, got %d queries.',
                count($queries)
            ),
        );
    }

    #[Test]
    public function open_only_filter_hides_closed_assignments(): void
    {
        ApplicationAssignment::factory()->create([
            'application_id' => $this->application->id,
            'user_id' => $this->assignee->id,
            'app_role_id' => $this->roleAdmin->id,
            'assigned_by' => $this->admin->id,
            'ended_at' => null,
        ]);

        ApplicationAssignment::factory()->ended()->create([
            'application_id' => $this->application->id,
            'user_id' => $this->employee->id,
            'app_role_id' => $this->roleViewer->id,
            'assigned_by' => $this->admin->id,
        ]);

        Sanctum::actingAs($this->admin);

        $response = $this->getJson('/api/v1/assignments?open_only=1');

        $response->assertOk();
        $this->assertCount(1, $response->json('data.items'));
        $this->assertTrue($response->json('data.items.0.is_open'));
    }
}
