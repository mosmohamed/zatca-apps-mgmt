<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\Application;
use App\Models\Environment;
use App\Models\User;
use Database\Seeders\EnvironmentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\SeedsRolesAndPermissions;
use Tests\TestCase;

class ApplicationInfrastructureFeatureTest extends TestCase
{
    use RefreshDatabase;
    use SeedsRolesAndPermissions;

    private User $admin;

    private Application $application;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seedRolesAndPermissions();
        $this->seed(EnvironmentSeeder::class);

        $this->admin = User::factory()->create([
            'email' => 'infrastructure-admin@zatca.sa',
        ]);
        $this->admin->assignRole('super_admin');

        $this->application = Application::factory()->create();
    }

    #[Test]
    public function guests_cannot_read_application_infrastructure(): void
    {
        $this->getJson($this->infrastructureUrl())->assertUnauthorized();
    }

    #[Test]
    public function every_master_environment_is_returned_even_without_a_profile(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->getJson($this->infrastructureUrl());

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.application.id', $this->application->id)
            ->assertJsonCount(4, 'data.environments')
            ->assertJsonPath('data.environments.0.environment.code', 'DEV')
            ->assertJsonPath('data.environments.3.environment.code', 'PROD')
            ->assertJsonPath('data.environments.0.profile', null);
    }

    #[Test]
    public function an_environment_profile_is_created_with_its_nested_components(): void
    {
        Sanctum::actingAs($this->admin);

        $response = $this->putJson($this->environmentUrl('PROD'), [
            'hosting' => [
                'hosting_model' => 'Private Cloud',
                'deployment_type' => 'Kubernetes',
                'cloud_provider' => 'On-Premise',
                'cluster_ip' => '10.20.30.40',
                'namespace' => 'zatca-prod',
            ],
            'internet' => [
                'published_to_internet' => true,
                'public_ip' => '203.0.113.10',
                'public_domain' => 'portal.zatca.gov.sa',
                'public_url' => 'https://portal.zatca.gov.sa',
                'exposure_type' => 'Reverse Proxy',
                'waf_enabled' => '1',
                'external_port' => 443,
            ],
            'operational' => [
                'monitoring_enabled' => true,
                'monitoring_tool' => 'Zabbix',
                'health_check_url' => 'https://portal.zatca.gov.sa/health',
                'support_team' => 'Platform Operations',
                'rpo' => '15 minutes',
                'rto' => '1 hour',
            ],
            'servers' => [
                [
                    'server_name' => 'prod-app-01',
                    'private_ip' => '10.20.30.41',
                    'operating_system' => 'RHEL 9',
                    'cpu' => '8 vCPU',
                    'memory' => '32 GB',
                    'hostname' => 'prod-app-01.zatca.local',
                ],
            ],
            'databases' => [
                [
                    'database_name' => 'PORTALDB',
                    'database_type' => 'Oracle',
                    'database_role' => 'primary',
                    'port' => 1521,
                    'secret_reference' => 'vault://prod/portal/db',
                ],
            ],
            'networks' => [
                [
                    'network_name' => 'App Tier',
                    'cidr' => '10.20.30.0/24',
                    'protocol' => 'TCP',
                    'port' => 443,
                    'gateway' => '10.20.30.1',
                ],
            ],
            'load_balancers' => [
                [
                    'lb_type' => 'f5',
                    'lb_name' => 'F5-DC1',
                    'vip_ip' => '10.20.31.10',
                    'vip_visibility' => 'public',
                    'listener_port' => 443,
                ],
            ],
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.hosting.namespace', 'zatca-prod')
            ->assertJsonPath('data.internet.published_to_internet', true)
            ->assertJsonPath('data.internet.waf_enabled', true)
            ->assertJsonPath('data.operational.monitoring_tool', 'Zabbix')
            ->assertJsonPath('data.servers.0.server_name', 'prod-app-01')
            ->assertJsonPath('data.servers.0.sort_order', 0)
            ->assertJsonPath('data.databases.0.database_role', 'primary')
            ->assertJsonPath('data.networks.0.cidr', '10.20.30.0/24')
            ->assertJsonPath('data.load_balancers.0.vip_visibility', 'public');

        $this->assertDatabaseHas('application_environments', [
            'application_id' => $this->application->id,
            'environment_id' => $this->environmentId('PROD'),
            'published_to_internet' => true,
            'created_by' => $this->admin->id,
            'updated_by' => $this->admin->id,
        ]);

        $this->assertDatabaseHas('application_servers', [
            'server_name' => 'prod-app-01',
            'private_ip' => '10.20.30.41',
        ]);

        $this->assertDatabaseHas('application_databases', [
            'database_name' => 'PORTALDB',
            'secret_reference' => 'vault://prod/portal/db',
        ]);
    }

    #[Test]
    public function nested_collections_are_synced_by_id_on_a_later_update(): void
    {
        Sanctum::actingAs($this->admin);

        $created = $this->putJson($this->environmentUrl('DEV'), [
            'servers' => [
                ['server_name' => 'dev-app-01', 'private_ip' => '10.0.0.11'],
                ['server_name' => 'dev-app-02', 'private_ip' => '10.0.0.12'],
            ],
        ])->assertOk();

        $keptId = (int) $created->json('data.servers.0.id');
        $removedId = (int) $created->json('data.servers.1.id');

        $updated = $this->putJson($this->environmentUrl('DEV'), [
            'servers' => [
                ['id' => $keptId, 'server_name' => 'dev-app-01-renamed', 'private_ip' => '10.0.0.11'],
                ['server_name' => 'dev-app-03', 'private_ip' => '10.0.0.13'],
            ],
        ]);

        $updated
            ->assertOk()
            ->assertJsonCount(2, 'data.servers')
            ->assertJsonPath('data.servers.0.id', $keptId)
            ->assertJsonPath('data.servers.0.server_name', 'dev-app-01-renamed')
            ->assertJsonPath('data.servers.1.server_name', 'dev-app-03');

        $this->assertSoftDeleted('application_servers', ['id' => $removedId]);
        $this->assertDatabaseCount('application_environments', 1);
    }

    #[Test]
    public function disabling_sync_keeps_components_that_are_left_out(): void
    {
        Sanctum::actingAs($this->admin);

        $this->putJson($this->environmentUrl('DEV'), [
            'servers' => [
                ['server_name' => 'dev-app-01'],
                ['server_name' => 'dev-app-02'],
            ],
        ])->assertOk();

        $this->putJson($this->environmentUrl('DEV'), [
            'sync' => false,
            'servers' => [],
        ])
            ->assertOk()
            ->assertJsonCount(2, 'data.servers');
    }

    #[Test]
    public function component_ids_belonging_to_another_profile_are_rejected(): void
    {
        Sanctum::actingAs($this->admin);

        $devServerId = (int) $this->putJson($this->environmentUrl('DEV'), [
            'servers' => [['server_name' => 'dev-app-01']],
        ])->assertOk()->json('data.servers.0.id');

        $this->putJson($this->environmentUrl('TEST'), [
            'servers' => [['id' => $devServerId, 'server_name' => 'hijacked']],
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('servers.0.id');

        $this->assertDatabaseHas('application_servers', [
            'id' => $devServerId,
            'server_name' => 'dev-app-01',
        ]);
    }

    #[Test]
    public function invalid_ip_cidr_and_port_values_are_rejected(): void
    {
        Sanctum::actingAs($this->admin);

        $this->putJson($this->environmentUrl('DEV'), [
            'hosting' => ['cluster_ip' => 'not-an-ip'],
            'servers' => [['private_ip' => '10.0.0.300']],
            'databases' => [['port' => 70000]],
            'networks' => [['cidr' => '10.0.0.0/40']],
            'listeners' => [['port' => 0]],
        ])
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonValidationErrors([
                'hosting.cluster_ip',
                'servers.0.private_ip',
                'databases.0.port',
                'networks.0.cidr',
                'listeners.0.port',
            ]);

        $this->assertDatabaseCount('application_environments', 0);
    }

    #[Test]
    public function publishing_to_the_internet_requires_the_public_endpoint_fields(): void
    {
        Sanctum::actingAs($this->admin);

        $this->putJson($this->environmentUrl('PROD'), [
            'internet' => ['published_to_internet' => true],
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'internet.public_domain',
                'internet.public_url',
                'internet.exposure_type',
            ]);
    }

    #[Test]
    public function copying_an_environment_requires_confirmation_when_the_target_exists(): void
    {
        Sanctum::actingAs($this->admin);

        $this->putJson($this->environmentUrl('STG'), [
            'hosting' => ['cloud_provider' => 'Azure', 'region' => 'uaenorth'],
            'servers' => [['server_name' => 'stg-app-01', 'private_ip' => '10.10.0.11']],
        ])->assertOk();

        $this->putJson($this->environmentUrl('PROD'), [
            'hosting' => ['cloud_provider' => 'On-Premise'],
            'servers' => [['server_name' => 'prod-legacy-01']],
        ])->assertOk();

        $this->postJson($this->copyUrl(), [
            'source_environment_id' => $this->environmentId('STG'),
            'target_environment_id' => $this->environmentId('PROD'),
        ])
            ->assertUnprocessable()
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', __('messages.application_infrastructure.copy_requires_overwrite'));

        $copied = $this->postJson($this->copyUrl(), [
            'source_environment_id' => $this->environmentId('STG'),
            'target_environment_id' => $this->environmentId('PROD'),
            'overwrite' => true,
        ]);

        $copied
            ->assertOk()
            ->assertJsonPath('data.environment_id', $this->environmentId('PROD'))
            ->assertJsonPath('data.hosting.cloud_provider', 'Azure')
            ->assertJsonPath('data.hosting.region', 'uaenorth')
            ->assertJsonCount(1, 'data.servers')
            ->assertJsonPath('data.servers.0.server_name', 'stg-app-01');

        $this->assertSoftDeleted('application_servers', ['server_name' => 'prod-legacy-01']);

        $this->assertDatabaseHas('activity_log', [
            'log_name' => 'application_infrastructure',
            'description' => 'application_infrastructure.environment_copied',
            'causer_id' => $this->admin->id,
        ]);
    }

    #[Test]
    public function copying_into_the_same_environment_is_rejected(): void
    {
        Sanctum::actingAs($this->admin);

        $this->postJson($this->copyUrl(), [
            'source_environment_id' => $this->environmentId('DEV'),
            'target_environment_id' => $this->environmentId('DEV'),
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('target_environment_id');
    }

    #[Test]
    public function copying_from_an_environment_without_a_profile_is_rejected(): void
    {
        Sanctum::actingAs($this->admin);

        $this->postJson($this->copyUrl(), [
            'source_environment_id' => $this->environmentId('DEV'),
            'target_environment_id' => $this->environmentId('PROD'),
        ])
            ->assertUnprocessable()
            ->assertJsonPath('message', __('messages.application_infrastructure.copy_source_missing'));
    }

    #[Test]
    public function public_and_operational_details_are_masked_without_the_field_permissions(): void
    {
        Sanctum::actingAs($this->admin);

        $this->putJson($this->environmentUrl('PROD'), [
            'internet' => [
                'published_to_internet' => true,
                'public_ip' => '203.0.113.10',
                'public_domain' => 'portal.zatca.gov.sa',
                'public_url' => 'https://portal.zatca.gov.sa',
                'exposure_type' => 'Reverse Proxy',
            ],
            'operational' => [
                'monitoring_enabled' => true,
                'monitoring_tool' => 'Zabbix',
                'support_team' => 'Platform Operations',
            ],
        ])->assertOk();

        $viewer = User::factory()->create(['email' => 'infrastructure-viewer@zatca.sa']);
        $viewer->assignRole('employee');

        Sanctum::actingAs($viewer);

        $profile = $this->profileFor($this->getJson($this->infrastructureUrl())->assertOk()->json(), 'PROD');

        $this->assertIsArray($profile);
        $this->assertArrayNotHasKey('public_ip', $profile['internet']);
        $this->assertArrayNotHasKey('public_domain', $profile['internet']);
        $this->assertArrayNotHasKey('public_url', $profile['internet']);
        $this->assertSame('Reverse Proxy', $profile['internet']['exposure_type']);

        $this->assertArrayNotHasKey('monitoring_tool', $profile['operational']);
        $this->assertArrayNotHasKey('monitoring_enabled', $profile['operational']);
        $this->assertSame('Platform Operations', $profile['operational']['support_team']);
    }

    #[Test]
    public function the_full_payload_is_returned_for_a_user_holding_the_field_permissions(): void
    {
        Sanctum::actingAs($this->admin);

        $this->putJson($this->environmentUrl('PROD'), [
            'internet' => [
                'published_to_internet' => true,
                'public_ip' => '203.0.113.10',
                'public_domain' => 'portal.zatca.gov.sa',
                'public_url' => 'https://portal.zatca.gov.sa',
                'exposure_type' => 'Reverse Proxy',
            ],
            'operational' => ['monitoring_tool' => 'Zabbix'],
        ])->assertOk();

        $profile = $this->profileFor($this->getJson($this->infrastructureUrl())->assertOk()->json(), 'PROD');

        $this->assertIsArray($profile);
        $this->assertSame('203.0.113.10', $profile['internet']['public_ip']);
        $this->assertSame('Zabbix', $profile['operational']['monitoring_tool']);
    }

    #[Test]
    public function an_environment_profile_can_be_deleted_with_its_components(): void
    {
        Sanctum::actingAs($this->admin);

        $created = $this->putJson($this->environmentUrl('DEV'), [
            'hosting' => ['cloud_provider' => 'Azure'],
            'servers' => [['server_name' => 'dev-app-01']],
        ])->assertOk();

        $profileId = (int) $created->json('data.id');
        $serverId = (int) $created->json('data.servers.0.id');

        $this->deleteJson($this->environmentUrl('DEV'))
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertSoftDeleted('application_environments', ['id' => $profileId]);
        $this->assertSoftDeleted('application_servers', ['id' => $serverId]);

        $this->getJson($this->infrastructureUrl())
            ->assertOk()
            ->assertJsonPath('data.environments.0.profile', null);
    }

    #[Test]
    public function deleting_an_environment_without_a_profile_is_rejected(): void
    {
        Sanctum::actingAs($this->admin);

        $this->deleteJson($this->environmentUrl('DEV'))
            ->assertUnprocessable()
            ->assertJsonPath('message', __('messages.application_infrastructure.profile_missing'));
    }

    #[Test]
    public function a_deleted_profile_is_restored_by_a_later_upsert(): void
    {
        Sanctum::actingAs($this->admin);

        $profileId = (int) $this->putJson($this->environmentUrl('DEV'), [
            'hosting' => ['cloud_provider' => 'Azure'],
        ])->assertOk()->json('data.id');

        $this->deleteJson($this->environmentUrl('DEV'))->assertOk();

        $this->putJson($this->environmentUrl('DEV'), [
            'hosting' => ['cloud_provider' => 'On-Premise'],
        ])
            ->assertOk()
            ->assertJsonPath('data.id', $profileId)
            ->assertJsonPath('data.hosting.cloud_provider', 'On-Premise');

        $this->assertDatabaseCount('application_environments', 1);
        $this->assertNotSoftDeleted('application_environments', ['id' => $profileId]);
    }

    #[Test]
    public function creating_a_profile_requires_the_create_permission(): void
    {
        $editor = User::factory()->create(['email' => 'infrastructure-editor@zatca.sa']);
        $editor->givePermissionTo('application-infrastructure.view');
        $editor->givePermissionTo('application-infrastructure.update');

        Sanctum::actingAs($editor);

        $this->putJson($this->environmentUrl('DEV'), [
            'hosting' => ['cloud_provider' => 'Azure'],
        ])->assertForbidden();

        Sanctum::actingAs($this->admin);
        $this->putJson($this->environmentUrl('DEV'), [
            'hosting' => ['cloud_provider' => 'Azure'],
        ])->assertOk();

        Sanctum::actingAs($editor);
        $this->putJson($this->environmentUrl('DEV'), [
            'hosting' => ['cloud_provider' => 'On-Premise'],
        ])
            ->assertOk()
            ->assertJsonPath('data.hosting.cloud_provider', 'On-Premise');
    }

    #[Test]
    public function users_without_the_infrastructure_permissions_are_forbidden(): void
    {
        $outsider = User::factory()->create(['email' => 'infrastructure-outsider@zatca.sa']);

        Sanctum::actingAs($outsider);

        $this->getJson($this->infrastructureUrl())->assertForbidden();

        $this->putJson($this->environmentUrl('DEV'), [
            'hosting' => ['cloud_provider' => 'Azure'],
        ])->assertForbidden();

        $this->postJson($this->copyUrl(), [
            'source_environment_id' => $this->environmentId('DEV'),
            'target_environment_id' => $this->environmentId('PROD'),
        ])->assertForbidden();

        $this->deleteJson($this->environmentUrl('DEV'))->assertForbidden();
    }

    #[Test]
    public function a_read_only_user_cannot_change_environments(): void
    {
        $viewer = User::factory()->create(['email' => 'infrastructure-readonly@zatca.sa']);
        $viewer->assignRole('employee');

        Sanctum::actingAs($viewer);

        $this->getJson($this->infrastructureUrl())->assertOk();

        $this->putJson($this->environmentUrl('DEV'), [
            'hosting' => ['cloud_provider' => 'Azure'],
        ])->assertForbidden();

        $this->postJson($this->copyUrl(), [
            'source_environment_id' => $this->environmentId('DEV'),
            'target_environment_id' => $this->environmentId('PROD'),
        ])->assertForbidden();

        $this->deleteJson($this->environmentUrl('DEV'))->assertForbidden();
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>|null
     */
    private function profileFor(array $payload, string $code): ?array
    {
        /** @var list<array<string, mixed>> $environments */
        $environments = data_get($payload, 'data.environments', []);

        foreach ($environments as $slot) {
            if (data_get($slot, 'environment.code') === $code) {
                /** @var array<string, mixed>|null $profile */
                $profile = $slot['profile'] ?? null;

                return $profile;
            }
        }

        return null;
    }

    private function environmentId(string $code): int
    {
        return (int) Environment::query()->where('code', $code)->value('id');
    }

    private function infrastructureUrl(): string
    {
        return "/api/v1/applications/{$this->application->id}/infrastructure";
    }

    private function environmentUrl(string $code): string
    {
        return "/api/v1/applications/{$this->application->id}/environments/{$this->environmentId($code)}";
    }

    private function copyUrl(): string
    {
        return "/api/v1/applications/{$this->application->id}/infrastructure/copy-environment";
    }
}
