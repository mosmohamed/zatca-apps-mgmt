<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\IdentityProvider;
use App\Models\Setting;
use App\Models\User;
use App\Support\AuthenticationMode;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\Concerns\SeedsRolesAndPermissions;
use Tests\TestCase;

class AuthenticationModeFeatureTest extends TestCase
{
    use RefreshDatabase;
    use SeedsRolesAndPermissions;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedRolesAndPermissions();
    }

    public function test_local_only_mode_blocks_sso_redirect_and_hides_providers(): void
    {
        $this->setAuthenticationMode('local');
        $provider = $this->oidcProvider();

        $this->getJson('/api/v1/auth/sso/providers')
            ->assertOk()
            ->assertExactJson([
                'success' => true,
                'message' => __('messages.sso.providers_listed'),
                'data' => [],
                'errors' => null,
            ]);

        $this->get('/api/v1/auth/sso/'.$provider->slug.'/redirect')
            ->assertUnprocessable()
            ->assertJsonPath('errors.provider.0', __('messages.sso.login_disabled'));
    }

    public function test_sso_only_mode_blocks_password_login(): void
    {
        $this->setAuthenticationMode('sso');
        $user = User::factory()->create(['password' => 'secret-password']);

        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'secret-password',
        ])
            ->assertUnprocessable()
            ->assertJsonPath('errors.email.0', __('messages.auth.local_login_disabled'));
    }

    public function test_hybrid_mode_allows_password_and_sso_login(): void
    {
        $this->setAuthenticationMode('hybrid');
        $provider = $this->oidcProvider();
        $localUser = User::factory()->create([
            'password' => 'secret-password',
            'authentication_type' => 'local',
        ]);
        $ssoUser = User::factory()->create([
            'authentication_type' => 'sso',
            'identity_provider_id' => $provider->id,
            'external_subject' => 'hybrid-sso-subject',
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => $localUser->email,
            'password' => 'secret-password',
        ])->assertOk();

        $code = str_repeat('h', 64);
        Cache::put('sso-exchange:'.hash('sha256', $code), $ssoUser->id, 60);
        $this->postJson('/api/v1/auth/sso/exchange', ['code' => $code])
            ->assertOk()
            ->assertJsonPath('data.user.id', $ssoUser->id);
    }

    public function test_local_user_cannot_exchange_sso_code(): void
    {
        $this->setAuthenticationMode('hybrid');
        $user = User::factory()->create(['authentication_type' => 'local']);
        $code = str_repeat('l', 64);
        Cache::put('sso-exchange:'.hash('sha256', $code), $user->id, 60);

        $this->postJson('/api/v1/auth/sso/exchange', ['code' => $code])
            ->assertUnprocessable()
            ->assertJsonPath('errors.provider.0', __('messages.sso.user_login_not_allowed'));
    }

    public function test_sso_user_cannot_use_password_login(): void
    {
        $this->setAuthenticationMode('hybrid');
        $user = User::factory()->create([
            'password' => 'secret-password',
            'authentication_type' => 'sso',
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'secret-password',
        ])
            ->assertUnprocessable()
            ->assertJsonPath('errors.email.0', __('messages.auth.local_login_not_allowed'));
    }

    public function test_provider_connection_endpoint_requires_update_permission(): void
    {
        Http::fake([
            'https://id.example.com/jwks' => Http::response([
                'keys' => [['kty' => 'RSA', 'kid' => 'key-1']],
            ]),
        ]);
        $provider = $this->oidcProvider();
        $employee = User::factory()->create();
        $employee->assignRole('employee');
        Sanctum::actingAs($employee);

        $this->postJson('/api/v1/identity-providers/'.$provider->id.'/test')
            ->assertForbidden();

        $admin = User::factory()->create();
        $admin->assignRole('super_admin');
        Sanctum::actingAs($admin);

        $this->postJson('/api/v1/identity-providers/'.$provider->id.'/test')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.success', true)
            ->assertJsonPath('data.protocol', 'oidc')
            ->assertJsonPath('data.checks.4.name', 'jwks_reachability')
            ->assertJsonPath('data.checks.4.status', 'passed');
    }

    private function setAuthenticationMode(string $mode): void
    {
        Setting::query()->updateOrCreate(
            ['key' => AuthenticationMode::KEY],
            [
                'value' => $mode,
                'type' => 'string',
                'group' => 'authentication',
                'label' => 'Authentication Mode',
                'is_public' => true,
            ],
        );
    }

    private function oidcProvider(): IdentityProvider
    {
        return IdentityProvider::query()->create([
            'name' => 'Corporate OIDC',
            'slug' => 'corporate-oidc',
            'protocol' => 'oidc',
            'enabled' => true,
            'configuration' => [
                'issuer' => 'https://id.example.com',
                'authorization_endpoint' => 'https://id.example.com/authorize',
                'token_endpoint' => 'https://id.example.com/token',
                'jwks_uri' => 'https://id.example.com/jwks',
                'client_id' => 'portfolio',
                'client_secret' => 'secret',
                'scopes' => ['openid', 'profile', 'email'],
                'claim_mapping' => ['email' => 'email'],
            ],
        ]);
    }
}
