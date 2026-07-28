<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\DatabaseRole;

class ApplicationDatabase extends InfrastructureComponent
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'application_environment_id',
        'database_name',
        'database_type',
        'database_engine',
        'database_version',
        'database_role',
        'cluster_name',
        'cluster_ip',
        'hostname',
        'private_ip',
        'port',
        'instance_name',
        'service_name',
        'database_schema',
        'ha_model',
        'read_write_role',
        'connection_type',
        'backup_policy',
        'database_owner',
        'secret_reference',
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
            'database_role' => DatabaseRole::class,
            'port' => 'integer',
        ]);
    }
}
