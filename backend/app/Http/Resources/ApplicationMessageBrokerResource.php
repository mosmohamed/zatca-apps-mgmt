<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Http\Resources\Concerns\SerializesInfrastructureComponent;
use App\Models\ApplicationMessageBroker;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin ApplicationMessageBroker
 */
class ApplicationMessageBrokerResource extends JsonResource
{
    use SerializesInfrastructureComponent;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return array_merge([
            'id' => $this->id,
            'application_environment_id' => $this->application_environment_id,
            'broker_name' => $this->broker_name,
            'broker_type' => $this->broker_type,
            'cluster_name' => $this->cluster_name,
            'broker_url' => $this->broker_url,
            'topic' => $this->topic,
            'queue' => $this->queue,
            'consumer_group' => $this->consumer_group,
            'port' => $this->port,
            'tls_enabled' => $this->tls_enabled,
            'owner' => $this->owner,
            'notes' => $this->notes,
        ], $this->componentMeta());
    }
}
