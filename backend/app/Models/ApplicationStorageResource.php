<?php

declare(strict_types=1);

namespace App\Models;

class ApplicationStorageResource extends InfrastructureComponent
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'application_environment_id',
        'storage_name',
        'storage_type',
        'storage_endpoint',
        'mount_path',
        'capacity',
        'replication',
        'backup_enabled',
        'retention_period',
        'owner',
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
            'backup_enabled' => 'boolean',
        ]);
    }
}
