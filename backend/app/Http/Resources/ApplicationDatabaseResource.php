<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Http\Resources\Concerns\SerializesInfrastructureComponent;
use App\Models\ApplicationDatabase;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * `secret_reference` is an opaque pointer into the secret store (vault path,
 * key name, ...). Secret values themselves are never stored nor returned.
 *
 * @mixin ApplicationDatabase
 */
class ApplicationDatabaseResource extends JsonResource
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
            'database_name' => $this->database_name,
            'database_type' => $this->database_type,
            'database_engine' => $this->database_engine,
            'database_version' => $this->database_version,
            'database_role' => $this->database_role?->value,
            'cluster_name' => $this->cluster_name,
            'cluster_ip' => $this->cluster_ip,
            'hostname' => $this->hostname,
            'private_ip' => $this->private_ip,
            'port' => $this->port,
            'instance_name' => $this->instance_name,
            'service_name' => $this->service_name,
            'database_schema' => $this->database_schema,
            'ha_model' => $this->ha_model,
            'read_write_role' => $this->read_write_role,
            'connection_type' => $this->connection_type,
            'backup_policy' => $this->backup_policy,
            'database_owner' => $this->database_owner,
            'secret_reference' => $this->secret_reference,
            'notes' => $this->notes,
        ], $this->componentMeta());
    }
}
