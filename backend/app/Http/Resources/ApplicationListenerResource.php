<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Http\Resources\Concerns\SerializesInfrastructureComponent;
use App\Models\ApplicationListener;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin ApplicationListener
 */
class ApplicationListenerResource extends JsonResource
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
            'listener_name' => $this->listener_name,
            'listener_ip' => $this->listener_ip,
            'port' => $this->port,
            'protocol' => $this->protocol,
            'tls_enabled' => $this->tls_enabled,
            'certificate_reference' => $this->certificate_reference,
            'backend_pool' => $this->backend_pool,
            'health_check_path' => $this->health_check_path,
            'health_check_port' => $this->health_check_port,
            'health_check_protocol' => $this->health_check_protocol,
            'persistence_config' => $this->persistence_config,
            'notes' => $this->notes,
        ], $this->componentMeta());
    }
}
