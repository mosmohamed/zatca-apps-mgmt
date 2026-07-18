<?php

declare(strict_types=1);

namespace Tests\Unit;

use App\Data\ExternalIdentity;
use App\Models\IdentityProvider;
use App\Models\RoleMappingRule;
use App\Models\Setting;
use App\Services\ExternalIdentityProvisioningService;
use App\Support\AuthenticationRoleMappingSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Activitylog\Models\Activity;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ExternalIdentityProvisioningServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_provisioning_and_repeated_login_respect_sync_toggles_and_audit_roles(): void
    {
        $provider = IdentityProvider::query()->create([
            'name' => 'Corporate',
            'slug' => 'corporate',
            'protocol' => 'oidc',
            'configuration' => ['claim_mapping' => [
                'first_name' => 'given_name',
                'last_name' => 'family_name',
                'email' => 'email',
            ]],
        ]);
        $employee = Role::findOrCreate('employee', 'web');
        $auditor = Role::findOrCreate('auditor', 'web');
        RoleMappingRule::query()->create([
            'identity_provider_id' => $provider->id,
            'claim_name' => 'groups',
            'external_value' => 'employees',
            'role_id' => $employee->id,
            'priority' => 10,
        ]);
        $this->settings(['update_roles_on_login' => false, 'update_user_information_on_login' => false]);

        $service = app(ExternalIdentityProvisioningService::class);
        $user = $service->provision($provider, new ExternalIdentity('subject-1', [
            'given_name' => 'Original',
            'family_name' => 'Person',
            'email' => 'person@example.com',
            'groups' => ['employees'],
        ]));
        $user->syncRoles([$auditor]);

        $repeated = $service->provision($provider, new ExternalIdentity('subject-1', [
            'given_name' => 'Changed',
            'family_name' => 'Person',
            'email' => 'person@example.com',
            'groups' => ['employees'],
        ]));

        $this->assertSame('Original', $repeated->first_name);
        $this->assertTrue($repeated->hasExactRoles(['auditor']));

        $this->settings(['update_roles_on_login' => true, 'update_user_information_on_login' => true]);
        $synchronized = $service->provision($provider, new ExternalIdentity('subject-1', [
            'given_name' => 'Changed',
            'family_name' => 'Person',
            'email' => 'person@example.com',
            'groups' => ['employees'],
        ]));

        $this->assertSame('Changed', $synchronized->first_name);
        $this->assertTrue($synchronized->hasExactRoles(['employee']));

        $synchronized->syncRoles([$auditor]);
        $this->settings(['enabled' => false, 'update_roles_on_login' => true]);
        $mappingDisabled = $service->provision($provider, new ExternalIdentity('subject-1', [
            'given_name' => 'Changed',
            'family_name' => 'Person',
            'email' => 'person@example.com',
            'groups' => ['employees'],
        ]));

        $this->assertTrue($mappingDisabled->hasExactRoles(['auditor']));

        $activity = Activity::query()
            ->where('log_name', 'authentication')
            ->where('event', 'roles-synchronized')
            ->latest('id')
            ->firstOrFail();
        $this->assertSame('system', $activity->properties->get('performed_by'));
        $this->assertSame('corporate', $activity->properties->get('provider'));
        $this->assertSame('oidc', $activity->properties->get('provider_protocol'));
        $this->assertSame(['auditor'], $activity->properties->get('previous_roles'));
        $this->assertSame(['employee'], $activity->properties->get('new_roles'));
        $this->assertNotEmpty($activity->properties->get('mapping_rules'));
        $this->assertArrayHasKey('ip_address', $activity->properties->toArray());
        $this->assertArrayHasKey('user_agent', $activity->properties->toArray());
        $this->assertSame('success', $activity->properties->get('result'));
        $this->assertNull($activity->properties->get('failure_reason'));
    }

    public function test_empty_role_mapping_does_not_wipe_existing_roles_on_login(): void
    {
        $provider = IdentityProvider::query()->create([
            'name' => 'Corporate',
            'slug' => 'corporate-empty-roles',
            'protocol' => 'oidc',
            'configuration' => ['claim_mapping' => [
                'first_name' => 'given_name',
                'last_name' => 'family_name',
                'email' => 'email',
            ]],
        ]);
        $auditor = Role::findOrCreate('auditor', 'web');
        $this->settings([
            'enabled' => true,
            'update_roles_on_login' => true,
            'default_role_id' => null,
        ]);

        $service = app(ExternalIdentityProvisioningService::class);
        $user = $service->provision($provider, new ExternalIdentity('subject-empty', [
            'given_name' => 'Keep',
            'family_name' => 'Roles',
            'email' => 'keep-roles@example.com',
            'groups' => ['employees'],
        ]));
        $user->syncRoles([$auditor]);

        $unchanged = $service->provision($provider, new ExternalIdentity('subject-empty', [
            'given_name' => 'Keep',
            'family_name' => 'Roles',
            'email' => 'keep-roles@example.com',
            'groups' => ['unknown-group'],
        ]));

        $this->assertTrue($unchanged->hasExactRoles(['auditor']));
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function settings(array $overrides): void
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
