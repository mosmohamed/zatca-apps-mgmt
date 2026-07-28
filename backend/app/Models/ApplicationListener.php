<?php

declare(strict_types=1);

namespace App\Models;

class ApplicationListener extends InfrastructureComponent
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'application_environment_id',
        'listener_name',
        'listener_ip',
        'port',
        'protocol',
        'tls_enabled',
        'certificate_reference',
        'backend_pool',
        'health_check_path',
        'health_check_port',
        'health_check_protocol',
        'persistence_config',
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
            'tls_enabled' => 'boolean',
            'health_check_port' => 'integer',
        ]);
    }
}
