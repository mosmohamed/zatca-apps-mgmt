<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\IntegrationDirection;

class ApplicationIntegration extends InfrastructureComponent
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'application_environment_id',
        'integration_name',
        'source_system',
        'destination_system',
        'direction',
        'api_url',
        'api_gateway',
        'protocol',
        'port',
        'authentication_type',
        'data_classification',
        'timeout',
        'retry_policy',
        'owner',
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
            'direction' => IntegrationDirection::class,
            'port' => 'integer',
            'timeout' => 'integer',
        ]);
    }
}
