<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\InfraCategory;
use App\Models\InfraLevel;
use App\Models\InfraTeamAssignment;
use App\Models\User;
use Database\Seeders\OperationInfraSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class OperationInfraFeatureTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        foreach ([
            'infra-levels.view',
            'infra-levels.create',
            'infra-levels.update',
            'infra-levels.delete',
            'infra-categories.view',
            'infra-categories.create',
            'infra-categories.update',
            'infra-categories.delete',
            'infra-team-assignments.view',
            'infra-team-assignments.create',
            'infra-team-assignments.update',
            'infra-team-assignments.delete',
            'users.view',
        ] as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $this->admin = User::factory()->create(['is_active' => true]);
        $this->admin->givePermissionTo([
            'infra-levels.view',
            'infra-levels.create',
            'infra-categories.view',
            'infra-categories.create',
            'infra-team-assignments.view',
            'infra-team-assignments.create',
            'users.view',
        ]);

        $this->seed(OperationInfraSeeder::class);
    }

    #[Test]
    public function seeded_levels_and_category_tree_are_available(): void
    {
        Sanctum::actingAs($this->admin);

        $this->getJson('/api/v1/infra-levels?per_page=50')
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertGreaterThanOrEqual(4, InfraLevel::query()->count());

        $tree = $this->getJson('/api/v1/infra-categories/tree')
            ->assertOk()
            ->json('data');

        $this->assertNotEmpty($tree);
        $database = collect($tree)->firstWhere('code', 'DATABASE');
        $this->assertNotNull($database);
        $this->assertGreaterThanOrEqual(3, count($database['children'] ?? []));

        $this->getJson('/api/v1/infra-categories/statistics')
            ->assertOk()
            ->assertJsonPath('data.total', InfraCategory::query()->count())
            ->assertJsonPath('data.parents', InfraCategory::query()->whereNull('parent_id')->count());

        $subcategories = $this->getJson(
            '/api/v1/infra-categories?category_type=subcategory&active_status=active'
        )
            ->assertOk()
            ->json('data.items');
        $this->assertNotEmpty($subcategories);
        $this->assertTrue(
            collect($subcategories)->every(
                static fn (array $category): bool => $category['parent_id'] !== null
            )
        );
    }

    #[Test]
    public function team_assignment_and_details_cards_work(): void
    {
        Sanctum::actingAs($this->admin);

        $level = InfraLevel::query()->where('code', 'L0')->firstOrFail();
        $stream = InfraCategory::query()->where('code', 'DB-ORACLE')->firstOrFail();
        $baselineMembers = (int) $stream->teamAssignments()->count();
        $members = User::factory()->count(2)->create(['is_active' => true]);

        $this->postJson('/api/v1/infra-team-assignments', [
            'infra_category_id' => $stream->id,
            'users' => $members->map(static fn (User $member): array => [
                'user_id' => $member->id,
                'infra_level_id' => $level->id,
                'sort_order' => 1,
            ])->all(),
        ])
            ->assertCreated()
            ->assertJsonCount(2, 'data');

        foreach ($members as $member) {
            $this->assertDatabaseHas('infra_team_assignments', [
                'infra_category_id' => $stream->id,
                'user_id' => $member->id,
                'infra_level_id' => $level->id,
            ]);
        }

        $details = $this->getJson('/api/v1/infra-team-assignments/details')
            ->assertOk()
            ->json('data');

        $oracleCard = collect($details)->firstWhere('code', 'DB-ORACLE');
        $this->assertNotNull($oracleCard);
        $this->assertSame($baselineMembers + 2, $oracleCard['members_count']);

        $levelZero = collect($oracleCard['levels'])->firstWhere('code', 'L0');
        $assignedIds = collect($levelZero['members'])->pluck('user_id');
        foreach ($members as $member) {
            $this->assertTrue($assignedIds->contains($member->id));
        }

        $this->getJson('/api/v1/infra-team-assignments/statistics')
            ->assertOk()
            ->assertJsonPath('data.total', InfraTeamAssignment::query()->count())
            ->assertJsonPath(
                'data.unique_users',
                InfraTeamAssignment::query()->distinct()->count('user_id'),
            )
            ->assertJsonStructure(['data' => ['assigned_categories', 'unassigned_categories']]);
    }

    #[Test]
    public function escalation_matrix_seeder_creates_users_and_assignments(): void
    {
        $this->seed(OperationInfraSeeder::class);

        $oracle = InfraCategory::query()->where('code', 'DB-ORACLE')->firstOrFail();
        $levelZero = InfraLevel::query()->where('code', 'L0')->firstOrFail();
        $levelOne = InfraLevel::query()->where('code', 'L1')->firstOrFail();

        $engineer = User::query()->where('email', 'ashah-c@zatca.gov.sa')->firstOrFail();
        $vendorLead = User::query()->where('email', 'razikhan@zatca.gov.sa')->firstOrFail();

        $this->assertSame('Arif', $engineer->first_name);
        $this->assertSame('966569136855', $engineer->phone);

        $this->assertDatabaseHas('infra_team_assignments', [
            'infra_category_id' => $oracle->id,
            'user_id' => $engineer->id,
            'infra_level_id' => $levelZero->id,
        ]);
        $this->assertDatabaseHas('infra_team_assignments', [
            'infra_category_id' => $oracle->id,
            'user_id' => $vendorLead->id,
            'infra_level_id' => $levelOne->id,
        ]);
    }

    #[Test]
    public function cannot_assign_users_to_parent_category_with_children(): void
    {
        Sanctum::actingAs($this->admin);

        $parent = InfraCategory::query()->where('code', 'DATABASE')->firstOrFail();
        $level = InfraLevel::query()->where('code', 'L0')->firstOrFail();
        $member = User::factory()->create(['is_active' => true]);

        $this->postJson('/api/v1/infra-team-assignments', [
            'infra_category_id' => $parent->id,
            'users' => [
                [
                    'user_id' => $member->id,
                    'infra_level_id' => $level->id,
                ],
            ],
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['infra_category_id']);
    }

    #[Test]
    public function details_cards_use_parent_subcategory_titles(): void
    {
        Sanctum::actingAs($this->admin);

        $details = $this->getJson('/api/v1/infra-team-assignments/details')
            ->assertOk()
            ->json('data');

        $oracle = collect($details)->firstWhere('code', 'DB-ORACLE');
        $this->assertNotNull($oracle);
        $this->assertSame('Database - Oracle', $oracle['title_en']);

        $member = collect($oracle['levels'])->flatMap(static fn (array $level) => $level['members'])->first();
        $this->assertNotNull($member);
        $this->assertArrayNotHasKey('level_note', $member);

        $servers = collect($details)->firstWhere('code', 'SERVERS-VMWARE');
        $this->assertNotNull($servers);
        $this->assertSame('Servers & VMware', $servers['title_en']);
        $this->assertNull($servers['parent']);
    }

    #[Test]
    public function subcategory_cannot_be_nested_under_another_subcategory(): void
    {
        Sanctum::actingAs($this->admin);

        $oracle = InfraCategory::query()->where('code', 'DB-ORACLE')->firstOrFail();

        $this->postJson('/api/v1/infra-categories', [
            'parent_id' => $oracle->id,
            'name_en' => 'Nested',
            'name_ar' => 'متداخل',
            'code' => 'NESTED-BAD',
            'sort_order' => 1,
            'is_active' => true,
        ])->assertStatus(422);
    }

    #[Test]
    public function categories_index_returns_hierarchical_parents_with_children(): void
    {
        Sanctum::actingAs($this->admin);

        $items = $this->getJson('/api/v1/infra-categories?per_page=50')
            ->assertOk()
            ->json('data.items');

        $this->assertTrue(
            collect($items)->every(
                static fn (array $category): bool => $category['parent_id'] === null
            )
        );

        $database = collect($items)->firstWhere('code', 'DATABASE');
        $this->assertNotNull($database);
        $this->assertGreaterThanOrEqual(3, count($database['children'] ?? []));
        $childCodes = collect($database['children'])->pluck('code')->all();
        $this->assertSame(['DB-ORACLE', 'DB-SQL', 'DB-HANA'], $childCodes);
    }

    #[Test]
    public function escalation_matrix_excel_export_downloads_successfully(): void
    {
        Sanctum::actingAs($this->admin);

        $this->get('/api/v1/infra-team-assignments/export')
            ->assertOk()
            ->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        $oracle = InfraCategory::query()->where('code', 'DB-ORACLE')->firstOrFail();

        $this->get('/api/v1/infra-team-assignments/export/'.$oracle->id)
            ->assertOk()
            ->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }
}
