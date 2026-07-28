<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\DnsScope;

class ApplicationDnsRecord extends InfrastructureComponent
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'application_environment_id',
        'dns_name',
        'fqdn',
        'record_type',
        'dns_scope',
        'target',
        'port',
        'protocol',
        'tls_enabled',
        'certificate_name',
        'certificate_expires_at',
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
            'dns_scope' => DnsScope::class,
            'port' => 'integer',
            'tls_enabled' => 'boolean',
            'certificate_expires_at' => 'date',
        ]);
    }
}
