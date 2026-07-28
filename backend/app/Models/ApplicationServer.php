<?php

declare(strict_types=1);

namespace App\Models;

class ApplicationServer extends InfrastructureComponent
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'application_environment_id',
        'server_name',
        'node_name',
        'private_ip',
        'public_ip',
        'management_ip',
        'operating_system',
        'server_role',
        'cpu',
        'memory',
        'storage',
        'vm_name',
        'hostname',
        'availability_zone',
        'status',
        'notes',
        'sort_order',
        'created_by',
        'updated_by',
    ];
}
