<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Http\Resources\Concerns\FormatsResourceDates;
use App\Models\Application;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Compact application row for the assignment matrix index.
 *
 * @mixin Application
 */
class ApplicationAssignmentSummaryResource extends JsonResource
{
    use FormatsResourceDates;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name_ar' => $this->name_ar,
            'name_en' => $this->name_en,
            'code' => $this->code,
            'status_id' => $this->status_id,
            'department_id' => $this->department_id,
            'active_users_count' => (int) ($this->active_users_count ?? 0),
            'department' => new DepartmentResource($this->whenLoaded('department')),
            'status' => new ApplicationStatusResource($this->whenLoaded('status')),
            'created_at' => $this->formatDate($this->created_at),
            'updated_at' => $this->formatDate($this->updated_at),
        ];
    }
}
