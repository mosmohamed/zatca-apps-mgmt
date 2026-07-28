<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Http\Resources\Concerns\FormatsResourceDates;
use App\Models\ApplicationEnvironment;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Arr;

/**
 * Full environment profile of an application: hosting, internet exposure,
 * operations and every nested infrastructure collection.
 *
 * Field level visibility:
 * - without `application-infrastructure.view-public` the public endpoint
 *   details (`public_ip`, `public_domain`, `public_url`) are omitted,
 * - without `application-infrastructure.view-operational` the monitoring and
 *   observability details are omitted.
 *
 * @mixin ApplicationEnvironment
 */
class ApplicationEnvironmentResource extends JsonResource
{
    use FormatsResourceDates;

    /**
     * @var list<string>
     */
    private const PUBLIC_ENDPOINT_FIELDS = [
        'public_ip',
        'public_domain',
        'public_url',
    ];

    /**
     * @var list<string>
     */
    private const OPERATIONAL_MONITORING_FIELDS = [
        'monitoring_enabled',
        'monitoring_tool',
        'logging_enabled',
        'logging_platform',
        'apm_tool',
        'dashboard_url',
        'health_check_url',
        'runbook_url',
        'cicd_pipeline_url',
        'operational_notes',
    ];

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'application_id' => $this->application_id,
            'environment_id' => $this->environment_id,
            'hosting' => $this->hostingSection(),
            'internet' => $this->internetSection($request),
            'operational' => $this->operationalSection($request),
            'servers' => ApplicationServerResource::collection($this->whenLoaded('servers')),
            'databases' => ApplicationDatabaseResource::collection($this->whenLoaded('databases')),
            'networks' => ApplicationNetworkResource::collection($this->whenLoaded('networks')),
            'dns_records' => ApplicationDnsRecordResource::collection($this->whenLoaded('dnsRecords')),
            'listeners' => ApplicationListenerResource::collection($this->whenLoaded('listeners')),
            'load_balancers' => ApplicationLoadBalancerResource::collection($this->whenLoaded('loadBalancers')),
            'integrations' => ApplicationIntegrationResource::collection($this->whenLoaded('integrations')),
            'message_brokers' => ApplicationMessageBrokerResource::collection($this->whenLoaded('messageBrokers')),
            'storage_resources' => ApplicationStorageResourceResource::collection($this->whenLoaded('storageResources')),
            'created_by' => $this->created_by,
            'updated_by' => $this->updated_by,
            'created_at' => $this->formatDate($this->created_at),
            'updated_at' => $this->formatDate($this->updated_at),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function hostingSection(): array
    {
        return [
            'hosting_model' => $this->hosting_model,
            'deployment_type' => $this->deployment_type,
            'cloud_provider' => $this->cloud_provider,
            'cloud_account' => $this->cloud_account,
            'region' => $this->region,
            'availability_zone' => $this->availability_zone,
            'data_center' => $this->data_center,
            'cluster_name' => $this->cluster_name,
            'cluster_ip' => $this->cluster_ip,
            'namespace' => $this->namespace,
            'resource_group' => $this->resource_group,
            'tenant' => $this->tenant,
            'network_zone' => $this->network_zone,
            'notes' => $this->notes,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function internetSection(Request $request): array
    {
        $section = [
            'published_to_internet' => $this->published_to_internet,
            'public_ip' => $this->public_ip,
            'public_domain' => $this->public_domain,
            'public_url' => $this->public_url,
            'internet_facing_lb' => $this->internet_facing_lb,
            'waf_enabled' => $this->waf_enabled,
            'waf_provider' => $this->waf_provider,
            'cdn_enabled' => $this->cdn_enabled,
            'cdn_provider' => $this->cdn_provider,
            'tls_certificate' => $this->tls_certificate,
            'external_port' => $this->external_port,
            'exposure_type' => $this->exposure_type,
            'publication_owner' => $this->publication_owner,
            'internet_notes' => $this->internet_notes,
        ];

        if ($this->allows($request, 'viewPublic')) {
            return $section;
        }

        return Arr::except($section, self::PUBLIC_ENDPOINT_FIELDS);
    }

    /**
     * @return array<string, mixed>
     */
    private function operationalSection(Request $request): array
    {
        $section = [
            'monitoring_enabled' => $this->monitoring_enabled,
            'monitoring_tool' => $this->monitoring_tool,
            'logging_enabled' => $this->logging_enabled,
            'logging_platform' => $this->logging_platform,
            'apm_tool' => $this->apm_tool,
            'dashboard_url' => $this->dashboard_url,
            'health_check_url' => $this->health_check_url,
            'support_team' => $this->support_team,
            'operations_owner' => $this->operations_owner,
            'on_call_group' => $this->on_call_group,
            'runbook_url' => $this->runbook_url,
            'documentation_url' => $this->documentation_url,
            'repository_url' => $this->repository_url,
            'cicd_pipeline_url' => $this->cicd_pipeline_url,
            'backup_enabled' => $this->backup_enabled,
            'disaster_recovery_enabled' => $this->disaster_recovery_enabled,
            'disaster_recovery_environment' => $this->disaster_recovery_environment,
            'rpo' => $this->rpo,
            'rto' => $this->rto,
            'operational_notes' => $this->operational_notes,
        ];

        if ($this->allows($request, 'viewOperational')) {
            return $section;
        }

        return Arr::except($section, self::OPERATIONAL_MONITORING_FIELDS);
    }

    private function allows(Request $request, string $ability): bool
    {
        $user = $request->user();

        return $user instanceof User && $user->can($ability, ApplicationEnvironment::class);
    }
}
