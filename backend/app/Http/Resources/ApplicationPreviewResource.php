<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Application;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Compact application summary used by the hover preview cards.
 *
 * @mixin Application
 */
class ApplicationPreviewResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name_en' => $this->name_en,
            'name_ar' => $this->name_ar,
            'code' => $this->code,
            'ha_model' => $this->ha_model?->value,
            'business_owners' => ApplicationOwnerResource::collection(
                $this->relationLoaded('businessOwners')
                    ? $this->businessOwners
                    : collect(),
            ),
            'technical_owners' => ApplicationOwnerResource::collection(
                $this->relationLoaded('technicalOwners')
                    ? $this->technicalOwners
                    : collect(),
            ),
            'documentation_url' => $this->documentation_url,
            'repository_url' => $this->repository_url,
            'department' => $this->localisedLookup($this->department),
            'application_type' => $this->localisedLookup($this->applicationType),
            'status' => $this->localisedLookup($this->status),
            'criticality' => $this->localisedLookup($this->criticality),
            'support_type' => $this->localisedLookup($this->supportType),
            'active_assignments_count' => (int) $this->active_assignments_count,
            'technologies_count' => (int) $this->technologies_count,
        ];
    }

    /**
     * @return array{id: int, name_en: string, name_ar: string}|null
     */
    private function localisedLookup(?Model $model): ?array
    {
        if ($model === null) {
            return null;
        }

        return [
            'id' => (int) $model->getAttribute('id'),
            'name_en' => (string) $model->getAttribute('name_en'),
            'name_ar' => (string) $model->getAttribute('name_ar'),
        ];
    }
}
