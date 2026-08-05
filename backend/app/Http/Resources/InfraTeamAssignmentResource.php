<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Http\Resources\Concerns\FormatsResourceDates;
use App\Models\InfraTeamAssignment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin InfraTeamAssignment
 */
class InfraTeamAssignmentResource extends JsonResource
{
    use FormatsResourceDates;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'infra_category_id' => $this->infra_category_id,
            'user_id' => $this->user_id,
            'infra_level_id' => $this->infra_level_id,
            'sort_order' => $this->sort_order,
            'category' => new InfraCategoryResource($this->whenLoaded('category')),
            'level' => new InfraLevelResource($this->whenLoaded('level')),
            'user' => $this->whenLoaded('user', function (): array {
                return [
                    'id' => $this->user->id,
                    'first_name' => $this->user->first_name,
                    'last_name' => $this->user->last_name,
                    'full_name' => $this->user->full_name,
                    'email' => $this->user->email,
                    'phone' => $this->user->phone,
                ];
            }),
            'created_at' => $this->formatDate($this->created_at),
            'updated_at' => $this->formatDate($this->updated_at),
        ];
    }
}
