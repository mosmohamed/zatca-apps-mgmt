<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\ServiceDeskCategory;
use App\Models\ServiceDeskLevel;
use App\Models\ServiceDeskTeamAssignment;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class ServiceDeskFeatureTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;

    private ServiceDeskLevel $levelZero;

    private ServiceDeskLevel $levelOne;

    private ServiceDeskCategory $parent;

    private ServiceDeskCategory $stream;

    private ServiceDeskCategory $siblingStream;

    protected function setUp(): void
    {
        parent::setUp();

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        foreach ([
            'service-desk-levels.view',
            'service-desk-levels.create',
            'service-desk-levels.update',
            'service-desk-levels.delete',
            'service-desk-categories.view',
            'service-desk-categories.create',
            'service-desk-categories.update',
            'service-desk-categories.delete',
            'service-desk-team-assignments.view',
            'service-desk-team-assignments.create',
            'service-desk-team-assignments.update',
            'service-desk-team-assignments.delete',
            'users.view',
        ] as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $this->admin = User::factory()->create(['is_active' => true]);
        $this->admin->givePermissionTo([
            'service-desk-levels.view',
            'service-desk-levels.create',
            'service-desk-categories.view',
            'service-desk-categories.create',
            'service-desk-team-assignments.view',
            'service-desk-team-assignments.create',
            'users.view',
        ]);

        $this->seedServiceDeskFixtures();
    }

    private function seedServiceDeskFixtures(): void
    {
        $this->levelZero = ServiceDeskLevel::query()->create([
            'code' => 'SD-L0',
            'name_en' => 'L0',
            'name_ar' => 'المستوى 0',
            'sort_order' => 0,
            'is_active' => true,
        ]);

        $this->levelOne = ServiceDeskLevel::query()->create([
            'code' => 'SD-L1',
            'name_en' => 'L1',
            'name_ar' => 'المستوى 1',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        ServiceDeskLevel::query()->create([
            'code' => 'SD-L2',
            'name_en' => 'L2',
            'name_ar' => 'المستوى 2',
            'sort_order' => 2,
            'is_active' => true,
        ]);

        ServiceDeskLevel::query()->create([
            'code' => 'SD-L3',
            'name_en' => 'L3',
            'name_ar' => 'المستوى 3',
            'sort_order' => 3,
            'is_active' => true,
        ]);

        $this->parent = ServiceDeskCategory::query()->create([
            'parent_id' => null,
            'name_en' => 'Service Desk',
            'name_ar' => 'مكتب الخدمة',
            'code' => 'SD-ROOT',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $this->stream = ServiceDeskCategory::query()->create([
            'parent_id' => $this->parent->id,
            'name_en' => 'Incident Queue',
            'name_ar' => 'طابور الحوادث',
            'code' => 'SD-INCIDENT',
            'sort_order' => 1,
            'is_active' => true,
        ]);

        $this->siblingStream = ServiceDeskCategory::query()->create([
            'parent_id' => $this->parent->id,
            'name_en' => 'Request Queue',
            'name_ar' => 'طابور الطلبات',
            'code' => 'SD-REQUEST',
            'sort_order' => 2,
            'is_active' => true,
        ]);

        ServiceDeskCategory::query()->create([
            'parent_id' => null,
            'name_en' => 'Standalone Stream',
            'name_ar' => 'مسار مستقل',
            'code' => 'SD-STANDALONE',
            'sort_order' => 2,
            'is_active' => true,
        ]);
    }

    #[Test]
    public function levels_and_category_tree_are_available(): void
    {
        Sanctum::actingAs($this->admin);

        $this->getJson('/api/v1/service-desk-levels?per_page=50')
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertGreaterThanOrEqual(4, ServiceDeskLevel::query()->count());

        $tree = $this->getJson('/api/v1/service-desk-categories/tree')
            ->assertOk()
            ->json('data');

        $this->assertNotEmpty($tree);
        $root = collect($tree)->firstWhere('code', 'SD-ROOT');
        $this->assertNotNull($root);
        $this->assertGreaterThanOrEqual(2, count($root['children'] ?? []));

        $this->getJson('/api/v1/service-desk-categories/statistics')
            ->assertOk()
            ->assertJsonPath('data.total', ServiceDeskCategory::query()->count())
            ->assertJsonPath(
                'data.parents',
                ServiceDeskCategory::query()->whereNull('parent_id')->count(),
            );

        $subcategories = $this->getJson(
            '/api/v1/service-desk-categories?category_type=subcategory&active_status=active'
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

        $members = User::factory()->count(2)->create(['is_active' => true]);

        $this->postJson('/api/v1/service-desk-team-assignments', [
            'service_desk_category_id' => $this->stream->id,
            'users' => $members->map(fn (User $member): array => [
                'user_id' => $member->id,
                'service_desk_level_id' => $this->levelZero->id,
                'sort_order' => 1,
            ])->all(),
        ])
            ->assertCreated()
            ->assertJsonCount(2, 'data');

        foreach ($members as $member) {
            $this->assertDatabaseHas('service_desk_team_assignments', [
                'service_desk_category_id' => $this->stream->id,
                'user_id' => $member->id,
                'service_desk_level_id' => $this->levelZero->id,
            ]);
        }

        $details = $this->getJson('/api/v1/service-desk-team-assignments/details')
            ->assertOk()
            ->json('data');

        $card = collect($details)->firstWhere('code', 'SD-INCIDENT');
        $this->assertNotNull($card);
        $this->assertSame(2, $card['members_count']);
        $this->assertSame('Service Desk - Incident Queue', $card['title_en']);

        $levelZero = collect($card['levels'])->firstWhere('code', 'SD-L0');
        $assignedIds = collect($levelZero['members'])->pluck('user_id');
        foreach ($members as $member) {
            $this->assertTrue($assignedIds->contains($member->id));
        }

        $this->getJson('/api/v1/service-desk-team-assignments/statistics')
            ->assertOk()
            ->assertJsonPath('data.total', ServiceDeskTeamAssignment::query()->count())
            ->assertJsonPath(
                'data.unique_users',
                ServiceDeskTeamAssignment::query()->distinct()->count('user_id'),
            )
            ->assertJsonStructure(['data' => ['assigned_categories', 'unassigned_categories']]);
    }

    #[Test]
    public function cannot_assign_users_to_parent_category_with_children(): void
    {
        Sanctum::actingAs($this->admin);

        $member = User::factory()->create(['is_active' => true]);

        $this->postJson('/api/v1/service-desk-team-assignments', [
            'service_desk_category_id' => $this->parent->id,
            'users' => [
                [
                    'user_id' => $member->id,
                    'service_desk_level_id' => $this->levelZero->id,
                ],
            ],
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['service_desk_category_id']);
    }

    #[Test]
    public function subcategory_cannot_be_nested_under_another_subcategory(): void
    {
        Sanctum::actingAs($this->admin);

        $this->postJson('/api/v1/service-desk-categories', [
            'parent_id' => $this->stream->id,
            'name_en' => 'Nested',
            'name_ar' => 'متداخل',
            'code' => 'SD-NESTED-BAD',
            'sort_order' => 1,
            'is_active' => true,
        ])->assertStatus(422);
    }

    #[Test]
    public function categories_index_returns_hierarchical_parents_with_children(): void
    {
        Sanctum::actingAs($this->admin);

        $items = $this->getJson('/api/v1/service-desk-categories?per_page=50')
            ->assertOk()
            ->json('data.items');

        $this->assertTrue(
            collect($items)->every(
                static fn (array $category): bool => $category['parent_id'] === null
            )
        );

        $root = collect($items)->firstWhere('code', 'SD-ROOT');
        $this->assertNotNull($root);
        $this->assertGreaterThanOrEqual(2, count($root['children'] ?? []));
        $childCodes = collect($root['children'])->pluck('code')->all();
        $this->assertSame(['SD-INCIDENT', 'SD-REQUEST'], $childCodes);
    }

    #[Test]
    public function escalation_matrix_excel_export_downloads_successfully(): void
    {
        Sanctum::actingAs($this->admin);

        ServiceDeskTeamAssignment::query()->create([
            'service_desk_category_id' => $this->stream->id,
            'user_id' => User::factory()->create(['is_active' => true])->id,
            'service_desk_level_id' => $this->levelOne->id,
            'sort_order' => 0,
        ]);

        $this->get('/api/v1/service-desk-team-assignments/export')
            ->assertOk()
            ->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        $this->get('/api/v1/service-desk-team-assignments/export/'.$this->stream->id)
            ->assertOk()
            ->assertHeader('content-type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    }

    #[Test]
    public function service_desk_data_does_not_touch_infra_tables(): void
    {
        Sanctum::actingAs($this->admin);

        $member = User::factory()->create(['is_active' => true]);

        $this->postJson('/api/v1/service-desk-team-assignments', [
            'service_desk_category_id' => $this->siblingStream->id,
            'users' => [
                [
                    'user_id' => $member->id,
                    'service_desk_level_id' => $this->levelZero->id,
                ],
            ],
        ])->assertCreated();

        $this->assertDatabaseCount('infra_team_assignments', 0);
        $this->assertDatabaseCount('infra_categories', 0);
        $this->assertDatabaseCount('infra_levels', 0);
        $this->assertDatabaseHas('service_desk_team_assignments', [
            'service_desk_category_id' => $this->siblingStream->id,
            'user_id' => $member->id,
        ]);
    }
}
