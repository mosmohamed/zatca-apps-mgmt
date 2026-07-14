<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Exceptions\DomainException;
use App\Models\Application;
use App\Models\ApplicationAssignment;
use App\Models\AppRole;
use App\Models\User;
use App\Services\AssignmentService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AssignmentServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_assign_closes_existing_open_assignment_inside_transaction(): void
    {
        $actor = User::factory()->create();
        $assignee = User::factory()->create();
        $application = Application::factory()->create();
        $firstRole = AppRole::factory()->create(['name' => 'Role A']);
        $secondRole = AppRole::factory()->create(['name' => 'Role B']);

        $service = app(AssignmentService::class);

        $first = $service->assign([
            'application_id' => $application->id,
            'user_id' => $assignee->id,
            'app_role_id' => $firstRole->id,
            'is_primary' => true,
        ], $actor);

        $second = $service->assign([
            'application_id' => $application->id,
            'user_id' => $assignee->id,
            'app_role_id' => $secondRole->id,
            'is_primary' => false,
            'remarks' => 'Switched role',
        ], $actor);

        $this->assertNotSame($first->id, $second->id);
        $this->assertNotNull($first->fresh()->ended_at);
        $this->assertNull($second->ended_at);
        $this->assertSame($secondRole->id, $second->app_role_id);
        $this->assertSame(1, ApplicationAssignment::query()->open()->count());
    }

    public function test_update_rejects_closed_assignment(): void
    {
        $actor = User::factory()->create();
        $assignment = ApplicationAssignment::factory()->ended()->create([
            'assigned_by' => $actor->id,
        ]);

        $this->expectException(DomainException::class);

        app(AssignmentService::class)->update($assignment, [
            'remarks' => 'No longer mutable',
        ]);
    }

    public function test_end_rejects_already_closed_assignment(): void
    {
        $actor = User::factory()->create();
        $assignment = ApplicationAssignment::factory()->ended()->create([
            'assigned_by' => $actor->id,
        ]);

        $this->expectException(DomainException::class);

        app(AssignmentService::class)->end($assignment);
    }
}
