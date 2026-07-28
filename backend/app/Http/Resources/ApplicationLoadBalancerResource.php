<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Http\Resources\Concerns\SerializesInfrastructureComponent;
use App\Models\ApplicationLoadBalancer;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin ApplicationLoadBalancer
 */
class ApplicationLoadBalancerResource extends JsonResource
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
            'lb_type' => $this->lb_type?->value,
            'lb_name' => $this->lb_name,
            'f5_partition' => $this->f5_partition,
            'vip_name' => $this->vip_name,
            'vip_ip' => $this->vip_ip,
            'vip_visibility' => $this->vip_visibility?->value,
            'listener_port' => $this->listener_port,
            'protocol' => $this->protocol,
            'pool_name' => $this->pool_name,
            'pool_members' => $this->pool_members,
            'health_monitor' => $this->health_monitor,
            'ssl_profile' => $this->ssl_profile,
            'persistence_profile' => $this->persistence_profile,
            'lb_method' => $this->lb_method,
            'active_standby_status' => $this->active_standby_status,
            'notes' => $this->notes,
        ], $this->componentMeta());
    }
}
