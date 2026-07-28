<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Http\Resources\Concerns\SerializesInfrastructureComponent;
use App\Models\ApplicationNetwork;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin ApplicationNetwork
 */
class ApplicationNetworkResource extends JsonResource
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
            'network_name' => $this->network_name,
            'network_type' => $this->network_type,
            'network_ip' => $this->network_ip,
            'cidr' => $this->cidr,
            'subnet' => $this->subnet,
            'vlan' => $this->vlan,
            'security_zone' => $this->security_zone,
            'source_network' => $this->source_network,
            'destination_network' => $this->destination_network,
            'protocol' => $this->protocol,
            'port' => $this->port,
            'firewall_requirement' => $this->firewall_requirement,
            'network_route' => $this->network_route,
            'gateway' => $this->gateway,
            'dns_server' => $this->dns_server,
            'notes' => $this->notes,
        ], $this->componentMeta());
    }
}
