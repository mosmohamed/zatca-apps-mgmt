<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Http\Resources\Concerns\BuildsInitials;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Compact department summary used by the hover preview cards.
 *
 * @mixin Department
 */
class DepartmentPreviewResource extends JsonResource
{
    use BuildsInitials;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name_en' => $this->name_en,
            'name_ar' => $this->name_ar,
            'initials' => $this->buildInitialsFromLabel($this->name_en),
            'applications_count' => (int) $this->applications_count,
        ];
    }
}
