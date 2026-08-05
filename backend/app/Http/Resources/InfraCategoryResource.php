<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Http\Resources\Concerns\FormatsResourceDates;
use App\Models\InfraCategory;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin InfraCategory
 */
class InfraCategoryResource extends JsonResource
{
    use FormatsResourceDates;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'parent_id' => $this->parent_id,
            'name_en' => $this->name_en,
            'name_ar' => $this->name_ar,
            'code' => $this->code,
            'description' => $this->description,
            'sort_order' => $this->sort_order,
            'is_active' => $this->is_active,
            'parent' => $this->whenLoaded('parent', function (): ?array {
                if ($this->parent === null) {
                    return null;
                }

                return [
                    'id' => $this->parent->id,
                    'name_en' => $this->parent->name_en,
                    'name_ar' => $this->parent->name_ar,
                    'code' => $this->parent->code,
                ];
            }),
            'children_count' => $this->when(
                isset($this->children_count) || $this->relationLoaded('children'),
                fn (): int => (int) ($this->children_count ?? $this->children->count()),
            ),
            'assignments_count' => $this->when(
                isset($this->assignments_count) || isset($this->team_assignments_count),
                fn (): int => (int) ($this->assignments_count ?? $this->team_assignments_count ?? 0),
            ),
            'title_en' => $this->when(
                $this->relationLoaded('parent'),
                function (): string {
                    if ($this->parent === null) {
                        return (string) $this->name_en;
                    }

                    return $this->parent->name_en.' - '.$this->name_en;
                },
            ),
            'title_ar' => $this->when(
                $this->relationLoaded('parent'),
                function (): string {
                    if ($this->parent === null) {
                        return (string) $this->name_ar;
                    }

                    return $this->parent->name_ar.' - '.$this->name_ar;
                },
            ),
            'assignments' => InfraTeamAssignmentResource::collection($this->whenLoaded('teamAssignments')),
            'children' => self::collection($this->whenLoaded('children')),
            'created_at' => $this->formatDate($this->created_at),
            'updated_at' => $this->formatDate($this->updated_at),
        ];
    }
}
