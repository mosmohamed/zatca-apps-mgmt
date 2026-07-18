<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Data\ExternalIdentity;
use App\Models\ExternalIdentity as ExternalIdentityRecord;
use App\Models\IdentityProvider;
use App\Models\Setting;
use App\Models\User;
use App\Services\ExternalIdentityProvisioningService;
use App\Support\AuthenticationMode;
use App\Support\AuthenticationRoleMappingSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;
use Spatie\Activitylog\Models\Activity;
use Tests\Concerns\SeedsRolesAndPermissions;
use Tests\TestCase;

class AuthenticationProductionReadinessTest extends TestCase
{
    use RefreshDatabase;
    use SeedsRolesAndPermissions;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedRolesAndPermissions();
        $this->withoutMiddleware(ThrottleRequests::class);
    }

    public function test_authentication_mode_and_type_decision_matrix(): void
    {
        $provider = $this->oidcProvider('matrix-oidc', 'Matrix OIDC');
        $localUser = User::factory()->create([
            'password' => 'secret-password',
            'authentication_type' => 'local',
        ]);
        $ssoUser = User::factory()->create([
            'password' => 'secret-password',
            'authentication_type' => 'sso',
            'identity_provider_id' => $provider->id,
            'external_subject' => 'matrix-sso-subject',
        ]);
        $bothUser = User::factory()->create([
            'password' => 'secret-password',
            'authentication_type' => 'both',
            'identity_provider_id' => $provider->id,
            'external_subject' => 'matrix-both-subject',
        ]);

        $this->setAuthenticationMode('local');
        $this->assertPasswordLoginAllowed($localUser);
        $this->assertPasswordLoginRejected($ssoUser, __('messages.auth.local_login_not_allowed'));
        $this->assertPasswordLoginAllowed($bothUser);
        $this->assertSsoExchangeRejected($ssoUser, __('messages.sso.login_disabled'));

        $this->setAuthenticationMode('sso');
        $this->assertPasswordLoginRejected($localUser, __('messages.auth.local_login_disabled'));
        $this->assertSsoExchangeAllowed($ssoUser);
        $this->assertSsoExchangeRejected($localUser, __('messages.sso.user_login_not_allowed'));
        $this->assertSsoExchangeAllowed($bothUser);

        $this->setAuthenticationMode('hybrid');
        $this->assertPasswordLoginAllowed($localUser);
        $this->assertPasswordLoginRejected($ssoUser, __('messages.auth.local_login_not_allowed'));
        $this->assertPasswordLoginAllowed($bothUser);
        $this->assertSsoExchangeRejected($localUser, __('messages.sso.user_login_not_allowed'));
        $this->assertSsoExchangeAllowed($ssoUser);
        $this->assertSsoExchangeAllowed($bothUser);
    }

    public function test_sso_provisioning_never_auto_links_existing_local_user_by_email(): void
    {
        $this->linkingSettings([
            'allow_email_account_linking' => true,
            'require_verified_email_for_linking' => true,
            'auto_provisioning' => true,
        ]);
        $provider = $this->oidcProvider();
        $local = User::factory()->create([
            'email' => 'link@example.com',
            'authentication_type' => 'local',
        ]);

        $this->expectException(ValidationException::class);
        try {
            app(ExternalIdentityProvisioningService::class)->provision($provider, new ExternalIdentity('sub-unverified', [
                'given_name' => 'Link',
                'family_name' => 'Attempt',
                'email' => $local->email,
                'email_verified' => true,
            ]));
        } catch (ValidationException $exception) {
            $this->assertSame(
                __('messages.sso.email_belongs_to_existing_account'),
                $exception->errors()['email'][0] ?? null,
            );
            $this->assertSame('local', $local->refresh()->authentication_type);
            $this->assertDatabaseMissing('external_identities', [
                'user_id' => $local->id,
                'identity_provider_id' => $provider->id,
            ]);

            throw $exception;
        }
    }

    public function test_user_can_have_multiple_external_identities_via_subject_match(): void
    {
        $entra = $this->oidcProvider('entra', 'Microsoft Entra');
        $auth0 = $this->oidcProvider('auth0', 'Auth0');
        $user = User::factory()->create([
            'email' => 'multi@example.com',
            'authentication_type' => 'sso',
        ]);
        ExternalIdentityRecord::query()->create([
            'user_id' => $user->id,
            'identity_provider_id' => $entra->id,
            'external_subject' => 'entra-sub',
            'external_email' => $user->email,
        ]);

        $service = app(ExternalIdentityProvisioningService::class);
        $service->provision($entra, new ExternalIdentity('entra-sub', [
            'given_name' => 'Multi',
            'family_name' => 'Provider',
            'email' => $user->email,
        ]));

        ExternalIdentityRecord::query()->create([
            'user_id' => $user->id,
            'identity_provider_id' => $auth0->id,
            'external_subject' => 'auth0-sub',
            'external_email' => $user->email,
        ]);
        $service->provision($auth0, new ExternalIdentity('auth0-sub', [
            'given_name' => 'Multi',
            'family_name' => 'Provider',
            'email' => $user->email,
        ]));

        $this->assertSame(2, ExternalIdentityRecord::query()->where('user_id', $user->id)->count());
    }

    public function test_local_login_success_and_failure_are_audited_with_ip(): void
    {
        $this->setAuthenticationMode('hybrid');
        $user = User::factory()->create([
            'password' => 'secret-password',
            'authentication_type' => 'local',
        ]);

        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ], ['REMOTE_ADDR' => '203.0.113.10'])->assertUnprocessable();

        $failure = Activity::query()
            ->where('log_name', 'authentication')
            ->where('event', 'local-login-failed')
            ->latest('id')
            ->firstOrFail();
        $this->assertSame('failure', $failure->properties->get('result'));
        $this->assertSame('invalid-credentials', $failure->properties->get('failure_reason'));
        $this->assertSame($user->email, $failure->properties->get('email'));
        $this->assertNotNull($failure->properties->get('ip_address'));
        $this->assertArrayHasKey('user_agent', $failure->properties->toArray());

        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'secret-password',
        ])->assertOk();

        $success = Activity::query()
            ->where('log_name', 'authentication')
            ->where('event', 'local-login-succeeded')
            ->where('subject_id', $user->id)
            ->latest('id')
            ->firstOrFail();
        $this->assertSame('success', $success->properties->get('result'));
        $this->assertSame($user->id, $success->properties->get('user_id'));
        $this->assertNull($success->properties->get('failure_reason'));
        $this->assertNotNull($success->properties->get('ip_address'));
    }

    public function test_provisioning_audits_include_request_context(): void
    {
        $this->linkingSettings([
            'auto_provisioning' => true,
        ]);
        $provider = $this->oidcProvider('audit-oidc', 'Audit OIDC');

        $request = Request::create('/api/v1/auth/sso/oidc/callback', 'GET', [], [], [], [
            'REMOTE_ADDR' => '198.51.100.20',
            'HTTP_USER_AGENT' => 'HardeningSprintTestAgent/1.0',
        ]);

        $user = app(ExternalIdentityProvisioningService::class)->provision(
            $provider,
            new ExternalIdentity('audit-sub', [
                'given_name' => 'Audit',
                'family_name' => 'User',
                'email' => 'audit-user@example.com',
                'email_verified' => true,
            ]),
            $request,
        );

        $provisioned = Activity::query()
            ->where('log_name', 'authentication')
            ->where('event', 'user-provisioned')
            ->where('subject_id', $user->id)
            ->latest('id')
            ->firstOrFail();
        $this->assertSame('198.51.100.20', $provisioned->properties->get('ip_address'));
        $this->assertSame('HardeningSprintTestAgent/1.0', $provisioned->properties->get('user_agent'));
        $this->assertSame('audit-sub', $provisioned->properties->get('external_subject'));
        $this->assertSame('success', $provisioned->properties->get('result'));
    }

    private function assertPasswordLoginAllowed(User $user): void
    {
        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'secret-password',
        ])->assertOk();
    }

    private function assertPasswordLoginRejected(User $user, string $message): void
    {
        $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'secret-password',
        ])
            ->assertUnprocessable()
            ->assertJsonPath('errors.email.0', $message);
    }

    private function assertSsoExchangeAllowed(User $user): void
    {
        $code = substr(hash('sha256', 'allow-'.$user->id.microtime(true)), 0, 64);
        Cache::put('sso-exchange:'.hash('sha256', $code), $user->id, 60);

        $this->postJson('/api/v1/auth/sso/exchange', ['code' => $code])
            ->assertOk()
            ->assertJsonPath('data.user.id', $user->id);
    }

    private function assertSsoExchangeRejected(User $user, string $message): void
    {
        $code = substr(hash('sha256', 'deny-'.$user->id.microtime(true)), 0, 64);
        Cache::put('sso-exchange:'.hash('sha256', $code), $user->id, 60);

        $response = $this->postJson('/api/v1/auth/sso/exchange', ['code' => $code]);
        $response->assertUnprocessable();
        $errors = $response->json('errors');
        $this->assertTrue(
            in_array($message, array_merge($errors['provider'] ?? [], $errors['code'] ?? []), true),
            'Expected rejection message not found in response errors.',
        );
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

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function linkingSettings(array $overrides): void
    {
        Setting::query()->updateOrCreate(
            ['key' => AuthenticationRoleMappingSettings::KEY],
            [
                'value' => json_encode(
                    array_replace(AuthenticationRoleMappingSettings::defaults(), $overrides),
                    JSON_UNESCAPED_SLASHES,
                ),
                'type' => 'json',
                'group' => 'authentication',
                'label' => 'Authentication',
                'is_public' => false,
            ],
        );
    }

    private function oidcProvider(string $slug = 'corporate-oidc', string $name = 'Corporate OIDC'): IdentityProvider
    {
        return IdentityProvider::query()->create([
            'name' => $name,
            'slug' => $slug,
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
                'claim_mapping' => [
                    'first_name' => 'given_name',
                    'last_name' => 'family_name',
                    'email' => 'email',
                ],
            ],
        ]);
    }
}
