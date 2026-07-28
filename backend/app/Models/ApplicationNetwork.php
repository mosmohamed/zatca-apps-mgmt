<?php

declare(strict_types=1);

namespace App\Models;

class ApplicationNetwork extends InfrastructureComponent
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'application_environment_id',
        'network_name',
        'network_type',
        'network_ip',
        'cidr',
        'subnet',
        'vlan',
        'security_zone',
        'source_network',
        'destination_network',
        'protocol',
        'port',
        'firewall_requirement',
        'network_route',
        'gateway',
        'dns_server',
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
            'port' => 'integer',
        ]);
    }
}
