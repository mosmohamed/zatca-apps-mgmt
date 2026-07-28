<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Http\Resources\Concerns\SerializesInfrastructureComponent;
use App\Models\ApplicationStorageResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin ApplicationStorageResource
 */
class ApplicationStorageResourceResource extends JsonResource
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
            'storage_name' => $this->storage_name,
            'storage_type' => $this->storage_type,
            'storage_endpoint' => $this->storage_endpoint,
            'mount_path' => $this->mount_path,
            'capacity' => $this->capacity,
            'replication' => $this->replication,
            'backup_enabled' => $this->backup_enabled,
            'retention_period' => $this->retention_period,
            'owner' => $this->owner,
            'notes' => $this->notes,
        ], $this->componentMeta());
    }
}
