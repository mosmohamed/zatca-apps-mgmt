<?php

declare(strict_types=1);

namespace App\Models;

class ApplicationMessageBroker extends InfrastructureComponent
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'application_environment_id',
        'broker_name',
        'broker_type',
        'cluster_name',
        'broker_url',
        'topic',
        'queue',
        'consumer_group',
        'port',
        'tls_enabled',
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
            'port' => 'integer',
            'tls_enabled' => 'boolean',
        ]);
    }
}
