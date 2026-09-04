<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\SeedsRolesAndPermissions;
use Tests\TestCase;

class UserStoreFeatureTest extends TestCase
{
    use RefreshDatabase;
    use SeedsRolesAndPermissions;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedRolesAndPermissions();

        $this->admin = User::factory()->create([
            'email' => 'user-store-admin@zatca.sa',
        ]);
        $this->admin->assignRole('super_admin');
    }

    #[Test]
    public function admin_can_create_a_user_without_sending_the_teams_handle(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->postJson('/api/v1/users', [
            'first_name' => 'Waleed',
            'last_name' => 'Oufi',
            'email' => 'woufi-c@zatca.gov.sa',
            'password' => 'password',
            'password_confirmation' => 'password',
            'phone' => '+966501234567',
            'is_active' => true,
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.email', 'woufi-c@zatca.gov.sa')
            ->assertJsonPath('data.first_name', 'Waleed')
            ->assertJsonPath('data.last_name', 'Oufi')
            ->assertJsonPath('data.phone', '+966501234567')
            ->assertJsonPath('data.teams', null);

        $this->assertDatabaseHas('users', [
            'email' => 'woufi-c@zatca.gov.sa',
            'first_name' => 'Waleed',
            'phone' => '+966501234567',
        ]);
    }
}
