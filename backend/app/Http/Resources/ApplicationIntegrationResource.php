<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Http\Resources\Concerns\SerializesInfrastructureComponent;
use App\Models\ApplicationIntegration;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * `secret_reference` is an opaque pointer into the secret store. API keys,
 * tokens and passwords are never stored nor returned.
 *
 * @mixin ApplicationIntegration
 */
class ApplicationIntegrationResource extends JsonResource
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
            'integration_name' => $this->integration_name,
            'source_system' => $this->source_system,
            'destination_system' => $this->destination_system,
            'direction' => $this->direction?->value,
            'api_url' => $this->api_url,
            'api_gateway' => $this->api_gateway,
            'protocol' => $this->protocol,
            'port' => $this->port,
            'authentication_type' => $this->authentication_type,
            'data_classification' => $this->data_classification,
            'timeout' => $this->timeout,
            'retry_policy' => $this->retry_policy,
            'owner' => $this->owner,
            'secret_reference' => $this->secret_reference,
            'notes' => $this->notes,
        ], $this->componentMeta());
    }
}
