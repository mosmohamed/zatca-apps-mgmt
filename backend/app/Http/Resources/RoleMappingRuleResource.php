<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Http\Resources\Concerns\FormatsResourceDates;
use App\Models\RoleMappingRule;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin RoleMappingRule
 */
class RoleMappingRuleResource extends JsonResource
{
    use FormatsResourceDates;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'identity_provider_id' => $this->identity_provider_id,
            'claim_name' => $this->claim_name,
            'external_value' => $this->external_value,
            'role_id' => $this->role_id,
            'priority' => $this->priority,
            'enabled' => $this->enabled,
            'identity_provider' => new IdentityProviderResource($this->whenLoaded('identityProvider')),
            'role' => new RoleResource($this->whenLoaded('role')),
            'created_at' => $this->formatDate($this->created_at),
            'updated_at' => $this->formatDate($this->updated_at),
        ];
    }
}
