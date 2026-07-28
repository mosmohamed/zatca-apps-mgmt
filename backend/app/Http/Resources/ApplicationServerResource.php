<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Http\Resources\Concerns\SerializesInfrastructureComponent;
use App\Models\ApplicationServer;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin ApplicationServer
 */
class ApplicationServerResource extends JsonResource
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
            'server_name' => $this->server_name,
            'node_name' => $this->node_name,
            'private_ip' => $this->private_ip,
            'public_ip' => $this->public_ip,
            'management_ip' => $this->management_ip,
            'operating_system' => $this->operating_system,
            'server_role' => $this->server_role,
            'cpu' => $this->cpu,
            'memory' => $this->memory,
            'storage' => $this->storage,
            'vm_name' => $this->vm_name,
            'hostname' => $this->hostname,
            'availability_zone' => $this->availability_zone,
            'status' => $this->status,
            'notes' => $this->notes,
        ], $this->componentMeta());
    }
}
