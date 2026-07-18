<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\IdentityProvider;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\SeedsRolesAndPermissions;
use Tests\TestCase;

class IdentityProviderFeatureTest extends TestCase
{
    use RefreshDatabase;
    use SeedsRolesAndPermissions;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedRolesAndPermissions();
    }

    public function test_super_admin_can_manage_provider_without_secret_exposure(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('super_admin');
        Sanctum::actingAs($admin);

        $response = $this->postJson('/api/v1/identity-providers', [
            'name' => 'Corporate OIDC',
            'slug' => 'corporate-oidc',
            'protocol' => 'oidc',
            'enabled' => true,
            'configuration' => [
                'issuer' => 'https://id.example.com',
                'authorization_endpoint' => 'https://id.example.com/authorize',
                'token_endpoint' => 'https://id.example.com/token',
                'userinfo_endpoint' => 'https://id.example.com/userinfo',
                'jwks_uri' => 'https://id.example.com/jwks',
                'client_id' => 'portfolio',
                'client_secret' => 'never-return-this',
                'scopes' => ['openid', 'email'],
                'claim_mapping' => ['email' => 'email'],
            ],
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.slug', 'corporate-oidc')
            ->assertJsonPath('data.has_client_secret', true)
            ->assertJsonMissing(['client_secret' => 'never-return-this'])
            ->assertJsonMissing(['configuration' => ['client_secret' => 'never-return-this']]);

        $this->assertStringNotContainsString('never-return-this', $response->getContent());

        $providerId = (int) $response->json('data.id');
        $this->getJson('/api/v1/identity-providers')
            ->assertOk()
            ->assertJsonPath('data.items.0.id', $providerId);
        $this->putJson('/api/v1/identity-providers/'.$providerId, ['name' => 'Renamed OIDC'])
            ->assertOk()
            ->assertJsonPath('data.name', 'Renamed OIDC')
            ->assertJsonPath('data.has_client_secret', true);

        $this->putJson('/api/v1/identity-providers/'.$providerId, [
            'configuration' => [
                'client_id' => 'portfolio-updated',
                'client_secret' => '',
            ],
        ])
            ->assertOk()
            ->assertJsonPath('data.has_client_secret', true)
            ->assertJsonPath('data.configuration.client_id', 'portfolio-updated')
            ->assertJsonMissing(['client_secret' => 'never-return-this']);

        $this->assertDatabaseHas('identity_providers', ['id' => $providerId]);
        $stored = IdentityProvider::query()->findOrFail($providerId);
        $this->assertSame('never-return-this', $stored->configuration['client_secret'] ?? null);

        $this->deleteJson('/api/v1/identity-providers/'.$providerId)
            ->assertOk();
        $this->assertSoftDeleted('identity_providers', ['id' => $providerId]);
    }

    public function test_employee_cannot_manage_identity_providers(): void
    {
        $employee = User::factory()->create();
        $employee->assignRole('employee');
        Sanctum::actingAs($employee);

        $this->getJson('/api/v1/identity-providers')->assertForbidden();
    }
}
