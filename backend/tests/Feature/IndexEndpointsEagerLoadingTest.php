<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Application;
use App\Models\ApplicationAssignment;
use App\Models\AppRole;
use App\Models\Department;
use App\Models\JobTitle;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\SeedsRolesAndPermissions;
use Tests\TestCase;

class IndexEndpointsEagerLoadingTest extends TestCase
{
    use RefreshDatabase;
    use SeedsRolesAndPermissions;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedRolesAndPermissions();

        $this->admin = User::factory()->create();
        $this->admin->assignRole('super_admin');

        $jobTitle = JobTitle::factory()->create();

        foreach (range(1, 5) as $index) {
            Vendor::factory()->create(['name' => "Vendor {$index}"]);
            Department::factory()->create([
                'name_en' => "Department {$index}",
                'name_ar' => "قسم {$index}",
            ]);
            Application::factory()->create(['code' => "IDX-{$index}"]);
            User::factory()->forVendor()->withJobTitle($jobTitle)->create();
        }

        $role = AppRole::factory()->create();

        foreach (Application::query()->limit(5)->get() as $application) {
            ApplicationAssignment::factory()->create([
                'application_id' => $application->id,
                'user_id' => User::factory()->create()->id,
                'app_role_id' => $role->id,
                'assigned_by' => $this->admin->id,
            ]);
        }
    }

    /**
     * @return array<string, array{0: string, 1: list<string>}>
     */
    public static function indexEndpoints(): array
    {
        return [
            'applications' => ['/api/v1/applications', ['department', 'application_type', 'status', 'criticality', 'support_type', 'technologies']],
            'users' => ['/api/v1/users', ['vendor', 'job_title']],
            'assignments' => ['/api/v1/assignments', ['application', 'user', 'app_role']],
            'vendors' => ['/api/v1/vendors', []],
            'departments' => ['/api/v1/departments', []],
        ];
    }

    /**
     * @param  list<string>  $expectedNestedKeys
     */
    #[Test]
    #[DataProvider('indexEndpoints')]
    public function index_endpoints_are_eager_loaded_and_query_bounded(
        string $uri,
        array $expectedNestedKeys,
    ): void {
        Sanctum::actingAs($this->admin);

        DB::flushQueryLog();
        DB::enableQueryLog();

        $response = $this->getJson($uri.'?per_page=15');

        $queryCount = count(DB::getQueryLog());
        DB::disableQueryLog();

        $response->assertOk()->assertJsonPath('success', true);

        $rows = collect($response->json('data.items'));
        $this->assertNotEmpty($rows, "Expected {$uri} index to return rows.");

        foreach ($expectedNestedKeys as $key) {
            $matched = $rows->first(
                static fn (mixed $row): bool => is_array($row)
                    && array_key_exists($key, $row)
                    && $row[$key] !== null
            );

            $this->assertNotNull(
                $matched,
                "Expected at least one {$uri} row with nested [{$key}] loaded.",
            );
        }

        $this->assertLessThan(
            35,
            $queryCount,
            sprintf('Index endpoint %s ran %d queries (possible N+1).', $uri, $queryCount),
        );
    }
}
