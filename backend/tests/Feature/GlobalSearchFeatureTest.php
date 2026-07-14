<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Application;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\SeedsRolesAndPermissions;
use Tests\TestCase;

class GlobalSearchFeatureTest extends TestCase
{
    use RefreshDatabase;
    use SeedsRolesAndPermissions;

    private User $employee;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedRolesAndPermissions();

        $this->employee = User::factory()->create([
            'email' => 'search-employee@itportfolio.local',
        ]);
        $this->employee->assignRole('employee');
    }

    #[Test]
    public function search_returns_matching_entities_across_categories(): void
    {
        $vendor = Vendor::factory()->create(['name' => 'Zeta Networks Solutions']);
        $application = Application::factory()->create(['name_en' => 'Zeta Portfolio Manager']);

        Sanctum::actingAs($this->employee);

        $response = $this->getJson('/api/v1/search?query=Zeta');

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'applications',
                    'users',
                    'vendors',
                    'departments',
                ],
            ]);

        $applications = collect($response->json('data.applications'));
        $vendors = collect($response->json('data.vendors'));

        $this->assertTrue($applications->contains(fn (array $row): bool => $row['id'] === $application->id));
        $this->assertTrue($vendors->contains(fn (array $row): bool => $row['id'] === $vendor->id));
        $this->assertSame('/vendors?id='.$vendor->id, $vendors->firstWhere('id', $vendor->id)['url']);
    }

    #[Test]
    public function search_with_short_query_returns_empty_results(): void
    {
        Sanctum::actingAs($this->employee);

        $response = $this->getJson('/api/v1/search?query=z');

        $response
            ->assertOk()
            ->assertJsonPath('data.applications', [])
            ->assertJsonPath('data.users', [])
            ->assertJsonPath('data.vendors', [])
            ->assertJsonPath('data.departments', []);
    }

    #[Test]
    public function unauthenticated_request_is_rejected(): void
    {
        $this->getJson('/api/v1/search?query=Zeta')->assertUnauthorized();
    }
}
