<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Http\Resources\Concerns\SerializesInfrastructureComponent;
use App\Models\ApplicationDnsRecord;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin ApplicationDnsRecord
 */
class ApplicationDnsRecordResource extends JsonResource
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
            'dns_name' => $this->dns_name,
            'fqdn' => $this->fqdn,
            'record_type' => $this->record_type,
            'dns_scope' => $this->dns_scope?->value,
            'target' => $this->target,
            'port' => $this->port,
            'protocol' => $this->protocol,
            'tls_enabled' => $this->tls_enabled,
            'certificate_name' => $this->certificate_name,
            'certificate_expires_at' => $this->certificate_expires_at?->format('Y-m-d'),
            'notes' => $this->notes,
        ], $this->componentMeta());
    }
}
