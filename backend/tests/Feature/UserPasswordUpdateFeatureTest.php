<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\SeedsRolesAndPermissions;
use Tests\TestCase;

class UserPasswordUpdateFeatureTest extends TestCase
{
    use RefreshDatabase;
    use SeedsRolesAndPermissions;

    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedRolesAndPermissions();

        $this->admin = User::factory()->create([
            'email' => 'user-password-admin@zatca.sa',
        ]);
        $this->admin->assignRole('super_admin');
    }

    #[Test]
    public function admin_can_update_user_password_without_mass_assigning_confirmation(): void
    {
        Sanctum::actingAs($this->admin);

        $target = User::factory()->create([
            'email' => 'target-user@zatca.sa',
            'password' => 'OldPassword123!',
        ]);

        $this->putJson('/api/v1/users/'.$target->id, [
            'password' => 'NewPassword123!',
            'password_confirmation' => 'NewPassword123!',
        ])
            ->assertOk()
            ->assertJsonPath('success', true);

        $target->refresh();

        $this->assertTrue(Hash::check('NewPassword123!', $target->password));
        $this->assertArrayNotHasKey('password_confirmation', $target->getAttributes());
    }
}
