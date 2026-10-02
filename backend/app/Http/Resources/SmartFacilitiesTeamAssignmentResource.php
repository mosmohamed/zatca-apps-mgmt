<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Http\Resources\Concerns\FormatsResourceDates;
use App\Models\SmartFacilitiesTeamAssignment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin SmartFacilitiesTeamAssignment
 */
class SmartFacilitiesTeamAssignmentResource extends JsonResource
{
    use FormatsResourceDates;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'smart_facilities_category_id' => $this->smart_facilities_category_id,
            'user_id' => $this->user_id,
            'smart_facilities_level_id' => $this->smart_facilities_level_id,
            'sort_order' => $this->sort_order,
            'category' => new SmartFacilitiesCategoryResource($this->whenLoaded('category')),
            'level' => new SmartFacilitiesLevelResource($this->whenLoaded('level')),
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
