<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Data\ExternalIdentity;
use App\Models\IdentityProvider;
use App\Models\RoleMappingRule;
use App\Models\Setting;
use App\Services\RoleMappingService;
use App\Support\AuthenticationRoleMappingSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class RoleMappingServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_matches_scalar_array_and_nested_claims_and_returns_all_roles(): void
    {
        [$provider, $roles] = $this->fixtures();
        RoleMappingRule::query()->create([
            'identity_provider_id' => $provider->id,
            'claim_name' => 'groups',
            'external_value' => 'Portfolio Admins',
            'role_id' => $roles[0]->id,
            'priority' => 10,
        ]);
        RoleMappingRule::query()->create([
            'identity_provider_id' => $provider->id,
            'claim_name' => 'realm.access.role',
            'external_value' => 'Auditor',
            'role_id' => $roles[1]->id,
            'priority' => 5,
        ]);

        $result = app(RoleMappingService::class)->resolve(
            $provider,
            new ExternalIdentity('subject', [
                'groups' => ['Users', ' portfolio admins '],
                'realm' => ['access' => ['role' => 'AUDITOR']],
            ]),
        );

        $this->assertEqualsCanonicalizing(
            [$roles[0]->id, $roles[1]->id],
            $result->roles->pluck('id')->all(),
        );
        $this->assertCount(2, $result->ruleIds);
    }

    public function test_highest_priority_and_default_role_behaviors(): void
    {
        [$provider, $roles] = $this->fixtures();
        $this->storeSettings([
            'multi_match_strategy' => 'highest_priority',
            'default_role_id' => $roles[2]->id,
        ]);

        foreach ([[$roles[0], 100], [$roles[1], 10]] as [$role, $priority]) {
            RoleMappingRule::query()->create([
                'identity_provider_id' => $provider->id,
                'claim_name' => 'groups',
                'external_value' => 'staff',
                'role_id' => $role->id,
                'priority' => $priority,
            ]);
        }

        $service = app(RoleMappingService::class);
        $highest = $service->resolve(
            $provider,
            new ExternalIdentity('subject', ['groups' => 'staff']),
        );
        $default = $service->resolve(
            $provider,
            new ExternalIdentity('subject', ['groups' => 'unknown']),
        );

        $this->assertSame([$roles[0]->id], $highest->roles->pluck('id')->all());
        $this->assertSame([$roles[2]->id], $default->roles->pluck('id')->all());
    }

    /**
     * @return array{IdentityProvider, list<Role>}
     */
    private function fixtures(): array
    {
        $provider = IdentityProvider::query()->create([
            'name' => 'Corporate IdP',
            'slug' => 'corporate',
            'protocol' => 'oidc',
            'configuration' => ['client_secret' => 'secret'],
        ]);
        $roles = [
            Role::findOrCreate('administrator', 'web'),
            Role::findOrCreate('auditor', 'web'),
            Role::findOrCreate('employee', 'web'),
        ];
        $this->storeSettings([]);

        return [$provider, $roles];
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function storeSettings(array $overrides): void
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
}
