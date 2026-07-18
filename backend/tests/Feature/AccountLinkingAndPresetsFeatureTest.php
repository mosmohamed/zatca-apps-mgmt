<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Data\ExternalIdentity;
use App\Models\ExternalIdentity as ExternalIdentityRecord;
use App\Models\IdentityProvider;
use App\Models\Setting;
use App\Models\User;
use App\Services\AccountLinkingService;
use App\Services\ExternalIdentityProvisioningService;
use App\Support\AuthenticationRoleMappingSettings;
use App\Support\IdentityProviderPresets;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\Sanctum;
use Spatie\Activitylog\Models\Activity;
use Tests\Concerns\SeedsRolesAndPermissions;
use Tests\TestCase;

class AccountLinkingAndPresetsFeatureTest extends TestCase
{
    use RefreshDatabase;
    use SeedsRolesAndPermissions;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seedRolesAndPermissions();
        $this->withoutMiddleware(ThrottleRequests::class);
    }

    public function test_sso_login_does_not_auto_link_by_email(): void
    {
        $this->linkingSettings([
            'allow_email_account_linking' => true,
            'require_verified_email_for_linking' => true,
            'auto_provisioning' => true,
        ]);
        $provider = $this->oidcProvider();
        $local = User::factory()->create([
            'email' => 'no-auto-link@example.com',
            'authentication_type' => 'local',
        ]);

        $this->expectException(ValidationException::class);
        try {
            app(ExternalIdentityProvisioningService::class)->provision(
                $provider,
                new ExternalIdentity('new-sub', [
                    'given_name' => 'New',
                    'family_name' => 'User',
                    'email' => $local->email,
                    'email_verified' => true,
                ]),
            );
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

    public function test_explicit_link_confirm_creates_identity_and_sets_both(): void
    {
        $this->linkingSettings([
            'allow_email_account_linking' => true,
            'require_verified_email_for_linking' => true,
        ]);
        $provider = $this->oidcProvider();
        $user = User::factory()->create(['authentication_type' => 'local']);
        Sanctum::actingAs($user);

        $code = str_repeat('c', 64);
        Cache::put('sso-link-confirm:'.hash('sha256', $code), [
            'user_id' => $user->id,
            'provider_id' => $provider->id,
            'external_subject' => 'explicit-sub',
            'external_email' => $user->email,
            'email_verified' => true,
        ], 600);

        $request = Request::create('/api/v1/auth/identity-links/confirm', 'POST', [], [], [], [
            'REMOTE_ADDR' => '203.0.113.55',
            'HTTP_USER_AGENT' => 'LinkTest/1.0',
        ]);

        $record = app(AccountLinkingService::class)->confirm($user, $code, $request);

        $this->assertSame('explicit-sub', $record->external_subject);
        $this->assertSame('both', $user->refresh()->authentication_type);
        $activity = Activity::query()
            ->where('log_name', 'authentication')
            ->where('event', 'account-linked')
            ->where('subject_id', $user->id)
            ->latest('id')
            ->firstOrFail();
        $this->assertSame('explicit-sub', $activity->properties->get('external_subject'));
        $this->assertSame('203.0.113.55', $activity->properties->get('ip_address'));
        $this->assertSame('LinkTest/1.0', $activity->properties->get('user_agent'));
        $this->assertSame($provider->slug, $activity->properties->get('provider'));
    }

    public function test_initiate_link_blocked_when_setting_disabled(): void
    {
        $this->linkingSettings(['allow_email_account_linking' => false]);
        $provider = $this->oidcProvider();
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/auth/identity-links/'.$provider->slug.'/initiate')
            ->assertUnprocessable()
            ->assertJsonPath('errors.provider.0', __('messages.sso.email_account_linking_disabled'));
    }

    public function test_microsoft_entra_and_auth0_presets_build_discovery_urls(): void
    {
        $entra = IdentityProviderPresets::build('microsoft_entra', [
            'tenant_id' => 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
            'client_id' => 'client',
            'client_secret' => 'secret',
        ]);
        $this->assertSame('oidc', $entra['protocol']);
        $this->assertSame(
            'https://login.microsoftonline.com/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee/v2.0/.well-known/openid-configuration',
            $entra['configuration']['discovery_url'],
        );
        $this->assertSame('preferred_username', $entra['configuration']['claim_mapping']['email']);

        $auth0 = IdentityProviderPresets::build('auth0', [
            'domain' => 'portfolio.us.auth0.com',
            'client_id' => 'client',
            'client_secret' => 'secret',
        ]);
        $this->assertSame(
            'https://portfolio.us.auth0.com/.well-known/openid-configuration',
            $auth0['configuration']['discovery_url'],
        );
        $this->assertSame('nickname', $auth0['configuration']['claim_mapping']['username']);
    }

    public function test_logout_returns_federated_logout_payload_shape(): void
    {
        $user = User::factory()->create(['authentication_type' => 'local']);
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/auth/logout')
            ->assertOk()
            ->assertJsonPath('data.federated_logout_url', null)
            ->assertJsonStructure(['data' => ['federated_logout_url', 'protocol', 'provider']]);
    }

    public function test_subject_cannot_belong_to_two_users(): void
    {
        $provider = $this->oidcProvider();
        $first = User::factory()->create();
        $second = User::factory()->create();
        ExternalIdentityRecord::query()->create([
            'user_id' => $first->id,
            'identity_provider_id' => $provider->id,
            'external_subject' => 'shared-sub',
            'external_email' => $first->email,
        ]);

        $this->expectException(QueryException::class);
        ExternalIdentityRecord::query()->create([
            'user_id' => $second->id,
            'identity_provider_id' => $provider->id,
            'external_subject' => 'shared-sub',
            'external_email' => $second->email,
        ]);
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

    private function oidcProvider(string $slug = 'link-oidc'): IdentityProvider
    {
        return IdentityProvider::query()->create([
            'name' => 'Link OIDC',
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
