<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\LoadBalancerType;
use App\Enums\VipVisibility;

class ApplicationLoadBalancer extends InfrastructureComponent
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'application_environment_id',
        'lb_type',
        'lb_name',
        'f5_partition',
        'vip_name',
        'vip_ip',
        'vip_visibility',
        'listener_port',
        'protocol',
        'pool_name',
        'pool_members',
        'health_monitor',
        'ssl_profile',
        'persistence_profile',
        'lb_method',
        'active_standby_status',
        'notes',
        'sort_order',
        'created_by',
        'updated_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return array_merge(parent::casts(), [
            'lb_type' => LoadBalancerType::class,
            'vip_visibility' => VipVisibility::class,
            'listener_port' => 'integer',
        ]);
    }
}
