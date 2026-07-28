<?php

declare(strict_types=1);

namespace App\Http\Requests\ApplicationInfrastructure;

use App\Enums\DatabaseRole;
use App\Enums\DnsScope;
use App\Enums\IntegrationDirection;
use App\Enums\LoadBalancerType;
use App\Enums\VipVisibility;
use App\Http\Requests\Concerns\HasInfrastructureValidationMessages;
use App\Http\Requests\Concerns\NormalizesBooleanInput;
use App\Models\Application;
use App\Models\ApplicationEnvironment;
use App\Models\Environment;
use App\Rules\Cidr;
use App\Rules\Hostname;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validates the full environment profile payload: the hosting, internet and
 * operational sections plus every nested infrastructure collection.
 */
class UpsertApplicationEnvironmentRequest extends FormRequest
{
    use HasInfrastructureValidationMessages;
    use NormalizesBooleanInput;

    private const MAX_URL = 2048;

    private const MAX_NOTES = 5000;

    /**
     * Payload key => child table, used to scope nested `id` values to the
     * profile currently being updated.
     *
     * @var array<string, string>
     */
    private const COLLECTION_TABLES = [
        'servers' => 'application_servers',
        'databases' => 'application_databases',
        'networks' => 'application_networks',
        'dns_records' => 'application_dns_records',
        'listeners' => 'application_listeners',
        'load_balancers' => 'application_load_balancers',
        'integrations' => 'application_integrations',
        'message_brokers' => 'application_message_brokers',
        'storage_resources' => 'application_storage_resources',
    ];

    /**
     * @var list<string>
     */
    private const BOOLEAN_PATHS = [
        'sync',
        'internet.published_to_internet',
        'internet.waf_enabled',
        'internet.cdn_enabled',
        'operational.monitoring_enabled',
        'operational.logging_enabled',
        'operational.backup_enabled',
        'operational.disaster_recovery_enabled',
        'dns_records.*.tls_enabled',
        'listeners.*.tls_enabled',
        'message_brokers.*.tls_enabled',
        'storage_resources.*.backup_enabled',
    ];

    private bool $profileResolved = false;

    private ?ApplicationEnvironment $profile = null;

    /**
     * Describing an environment for the first time is a create, changing an
     * existing profile is an update.
     */
    public function authorize(): bool
    {
        $profile = $this->existingProfile();

        $ability = $profile !== null && ! $profile->trashed() ? 'update' : 'create';

        return $this->user()?->can($ability, ApplicationEnvironment::class) ?? false;
    }

    protected function prepareForValidation(): void
    {
        $this->normalizeBooleanInput(self::BOOLEAN_PATHS);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return array_merge(
            [
                'sync' => ['sometimes', 'boolean'],
                'hosting' => ['sometimes', 'array'],
                'internet' => ['sometimes', 'array'],
                'operational' => ['sometimes', 'array'],
            ],
            $this->sectionRules('hosting', $this->hostingRules()),
            $this->sectionRules('internet', $this->internetRules()),
            $this->sectionRules('operational', $this->operationalRules()),
            $this->collectionRules('servers', $this->serverRules()),
            $this->collectionRules('databases', $this->databaseRules()),
            $this->collectionRules('networks', $this->networkRules()),
            $this->collectionRules('dns_records', $this->dnsRecordRules()),
            $this->collectionRules('listeners', $this->listenerRules()),
            $this->collectionRules('load_balancers', $this->loadBalancerRules()),
            $this->collectionRules('integrations', $this->integrationRules()),
            $this->collectionRules('message_brokers', $this->messageBrokerRules()),
            $this->collectionRules('storage_resources', $this->storageResourceRules()),
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function hostingRules(): array
    {
        return [
            'hosting_model' => $this->stringRule(),
            'deployment_type' => $this->stringRule(),
            'cloud_provider' => $this->stringRule(),
            'cloud_account' => $this->stringRule(),
            'region' => $this->stringRule(),
            'availability_zone' => $this->stringRule(),
            'data_center' => $this->stringRule(),
            'cluster_name' => $this->stringRule(),
            'cluster_ip' => $this->ipRule(),
            'namespace' => $this->stringRule(),
            'resource_group' => $this->stringRule(),
            'tenant' => $this->stringRule(),
            'network_zone' => $this->stringRule(),
            'notes' => $this->notesRule(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function internetRules(): array
    {
        $requiredWhenPublished = 'required_if:internet.published_to_internet,true';

        return [
            'published_to_internet' => ['sometimes', 'boolean'],
            'public_ip' => $this->ipRule(),
            'public_domain' => array_merge([$requiredWhenPublished], $this->hostnameRule()),
            'public_url' => array_merge([$requiredWhenPublished], $this->urlRule()),
            'internet_facing_lb' => $this->stringRule(),
            'waf_enabled' => ['sometimes', 'boolean'],
            'waf_provider' => $this->stringRule(),
            'cdn_enabled' => ['sometimes', 'boolean'],
            'cdn_provider' => $this->stringRule(),
            'tls_certificate' => $this->stringRule(),
            'external_port' => $this->portRule(),
            'exposure_type' => array_merge([$requiredWhenPublished], $this->stringRule()),
            'publication_owner' => $this->stringRule(),
            'internet_notes' => $this->notesRule(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function operationalRules(): array
    {
        return [
            'monitoring_enabled' => ['sometimes', 'boolean'],
            'monitoring_tool' => $this->stringRule(),
            'logging_enabled' => ['sometimes', 'boolean'],
            'logging_platform' => $this->stringRule(),
            'apm_tool' => $this->stringRule(),
            'dashboard_url' => $this->urlRule(),
            'health_check_url' => $this->urlRule(),
            'support_team' => $this->stringRule(),
            'operations_owner' => $this->stringRule(),
            'on_call_group' => $this->stringRule(),
            'runbook_url' => $this->urlRule(),
            'documentation_url' => $this->urlRule(),
            'repository_url' => $this->urlRule(),
            'cicd_pipeline_url' => $this->urlRule(),
            'backup_enabled' => ['sometimes', 'boolean'],
            'disaster_recovery_enabled' => ['sometimes', 'boolean'],
            'disaster_recovery_environment' => $this->stringRule(),
            'rpo' => $this->stringRule(50),
            'rto' => $this->stringRule(50),
            'operational_notes' => $this->notesRule(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function serverRules(): array
    {
        return [
            'server_name' => $this->stringRule(),
            'node_name' => $this->stringRule(),
            'private_ip' => $this->ipRule(),
            'public_ip' => $this->ipRule(),
            'management_ip' => $this->ipRule(),
            'operating_system' => $this->stringRule(),
            'server_role' => $this->stringRule(),
            'cpu' => $this->stringRule(100),
            'memory' => $this->stringRule(100),
            'storage' => $this->stringRule(100),
            'vm_name' => $this->stringRule(),
            'hostname' => $this->hostnameRule(),
            'availability_zone' => $this->stringRule(),
            'status' => $this->stringRule(100),
            'notes' => $this->notesRule(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function databaseRules(): array
    {
        return [
            'database_name' => $this->stringRule(),
            'database_type' => $this->stringRule(),
            'database_engine' => $this->stringRule(),
            'database_version' => $this->stringRule(100),
            'database_role' => $this->enumRule(DatabaseRole::values()),
            'cluster_name' => $this->stringRule(),
            'cluster_ip' => $this->ipRule(),
            'hostname' => $this->hostnameRule(),
            'private_ip' => $this->ipRule(),
            'port' => $this->portRule(),
            'instance_name' => $this->stringRule(),
            'service_name' => $this->stringRule(),
            'database_schema' => $this->stringRule(),
            'ha_model' => $this->stringRule(),
            'read_write_role' => $this->stringRule(),
            'connection_type' => $this->stringRule(),
            'backup_policy' => $this->stringRule(),
            'database_owner' => $this->stringRule(),
            'secret_reference' => $this->stringRule(),
            'notes' => $this->notesRule(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function networkRules(): array
    {
        return [
            'network_name' => $this->stringRule(),
            'network_type' => $this->stringRule(),
            'network_ip' => $this->ipRule(),
            'cidr' => ['nullable', 'string', 'max:60', new Cidr],
            'subnet' => $this->stringRule(),
            'vlan' => $this->stringRule(50),
            'security_zone' => $this->stringRule(),
            'source_network' => $this->stringRule(),
            'destination_network' => $this->stringRule(),
            'protocol' => $this->stringRule(30),
            'port' => $this->portRule(),
            'firewall_requirement' => $this->stringRule(),
            'network_route' => $this->stringRule(),
            'gateway' => $this->ipRule(),
            'dns_server' => $this->ipRule(),
            'notes' => $this->notesRule(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function dnsRecordRules(): array
    {
        return [
            'dns_name' => $this->stringRule(),
            'fqdn' => $this->hostnameRule(),
            'record_type' => $this->stringRule(20),
            'dns_scope' => $this->enumRule(DnsScope::values()),
            'target' => $this->stringRule(),
            'port' => $this->portRule(),
            'protocol' => $this->stringRule(30),
            'tls_enabled' => ['sometimes', 'boolean'],
            'certificate_name' => $this->stringRule(),
            'certificate_expires_at' => ['nullable', 'date'],
            'notes' => $this->notesRule(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function listenerRules(): array
    {
        return [
            'listener_name' => $this->stringRule(),
            'listener_ip' => $this->ipRule(),
            'port' => $this->portRule(),
            'protocol' => $this->stringRule(30),
            'tls_enabled' => ['sometimes', 'boolean'],
            'certificate_reference' => $this->stringRule(),
            'backend_pool' => $this->stringRule(),
            'health_check_path' => $this->stringRule(),
            'health_check_port' => $this->portRule(),
            'health_check_protocol' => $this->stringRule(30),
            'persistence_config' => $this->notesRule(),
            'notes' => $this->notesRule(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function loadBalancerRules(): array
    {
        return [
            'lb_type' => $this->enumRule(LoadBalancerType::values()),
            'lb_name' => $this->stringRule(),
            'f5_partition' => $this->stringRule(),
            'vip_name' => $this->stringRule(),
            'vip_ip' => $this->ipRule(),
            'vip_visibility' => $this->enumRule(VipVisibility::values()),
            'listener_port' => $this->portRule(),
            'protocol' => $this->stringRule(30),
            'pool_name' => $this->stringRule(),
            'pool_members' => $this->notesRule(),
            'health_monitor' => $this->stringRule(),
            'ssl_profile' => $this->stringRule(),
            'persistence_profile' => $this->stringRule(),
            'lb_method' => $this->stringRule(),
            'active_standby_status' => $this->stringRule(),
            'notes' => $this->notesRule(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function integrationRules(): array
    {
        return [
            'integration_name' => $this->stringRule(),
            'source_system' => $this->stringRule(),
            'destination_system' => $this->stringRule(),
            'direction' => $this->enumRule(IntegrationDirection::values()),
            'api_url' => $this->urlRule(),
            'api_gateway' => $this->stringRule(),
            'protocol' => $this->stringRule(30),
            'port' => $this->portRule(),
            'authentication_type' => $this->stringRule(),
            'data_classification' => $this->stringRule(),
            'timeout' => ['nullable', 'integer', 'min:0', 'max:86400'],
            'retry_policy' => $this->stringRule(),
            'owner' => $this->stringRule(),
            'secret_reference' => $this->stringRule(),
            'notes' => $this->notesRule(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function messageBrokerRules(): array
    {
        return [
            'broker_name' => $this->stringRule(),
            'broker_type' => $this->stringRule(),
            'cluster_name' => $this->stringRule(),
            'broker_url' => $this->stringRule(self::MAX_URL),
            'topic' => $this->stringRule(),
            'queue' => $this->stringRule(),
            'consumer_group' => $this->stringRule(),
            'port' => $this->portRule(),
            'tls_enabled' => ['sometimes', 'boolean'],
            'owner' => $this->stringRule(),
            'notes' => $this->notesRule(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function storageResourceRules(): array
    {
        return [
            'storage_name' => $this->stringRule(),
            'storage_type' => $this->stringRule(),
            'storage_endpoint' => $this->stringRule(self::MAX_URL),
            'mount_path' => $this->stringRule(500),
            'capacity' => $this->stringRule(100),
            'replication' => $this->stringRule(),
            'backup_enabled' => ['sometimes', 'boolean'],
            'retention_period' => $this->stringRule(100),
            'owner' => $this->stringRule(),
            'notes' => $this->notesRule(),
        ];
    }

    /**
     * @param  array<string, mixed>  $rules
     * @return array<string, mixed>
     */
    private function sectionRules(string $section, array $rules): array
    {
        $prefixed = [];

        foreach ($rules as $field => $rule) {
            $prefixed[$section.'.'.$field] = $rule;
        }

        return $prefixed;
    }

    /**
     * @param  array<string, mixed>  $rules
     * @return array<string, mixed>
     */
    private function collectionRules(string $key, array $rules): array
    {
        $prefixed = [
            $key => ['sometimes', 'array'],
            $key.'.*' => ['array'],
            $key.'.*.id' => $this->childIdRule(self::COLLECTION_TABLES[$key]),
            $key.'.*.sort_order' => ['nullable', 'integer', 'min:0', 'max:65535'],
        ];

        foreach ($rules as $field => $rule) {
            $prefixed[$key.'.*.'.$field] = $rule;
        }

        return $prefixed;
    }

    /**
     * Nested rows may only reference rows that already belong to this exact
     * application/environment profile.
     *
     * @return array<int, mixed>
     */
    private function childIdRule(string $table): array
    {
        return [
            'nullable',
            'integer',
            Rule::exists($table, 'id')
                ->where('application_environment_id', $this->profileId())
                ->whereNull('deleted_at'),
        ];
    }

    private function profileId(): int
    {
        return (int) ($this->existingProfile()?->getKey() ?? 0);
    }

    private function existingProfile(): ?ApplicationEnvironment
    {
        if ($this->profileResolved) {
            return $this->profile;
        }

        $this->profileResolved = true;

        $application = $this->route('application');
        $environment = $this->route('environment');

        if (! $application instanceof Application || ! $environment instanceof Environment) {
            return null;
        }

        $this->profile = ApplicationEnvironment::query()
            ->withTrashed()
            ->where('application_id', $application->getKey())
            ->where('environment_id', $environment->getKey())
            ->first();

        return $this->profile;
    }

    /**
     * @return array<int, mixed>
     */
    private function stringRule(int $max = 255): array
    {
        return ['nullable', 'string', 'max:'.$max];
    }

    /**
     * @return array<int, mixed>
     */
    private function notesRule(): array
    {
        return ['nullable', 'string', 'max:'.self::MAX_NOTES];
    }

    /**
     * @return array<int, mixed>
     */
    private function ipRule(): array
    {
        return ['nullable', 'string', 'ip'];
    }

    /**
     * @return array<int, mixed>
     */
    private function hostnameRule(): array
    {
        return ['nullable', 'string', 'max:253', new Hostname];
    }

    /**
     * @return array<int, mixed>
     */
    private function urlRule(): array
    {
        return ['nullable', 'string', 'url', 'max:'.self::MAX_URL];
    }

    /**
     * @return array<int, mixed>
     */
    private function portRule(): array
    {
        return ['nullable', 'integer', 'min:1', 'max:65535'];
    }

    /**
     * @param  list<string>  $values
     * @return array<int, mixed>
     */
    private function enumRule(array $values): array
    {
        return ['nullable', 'string', Rule::in($values)];
    }
}
