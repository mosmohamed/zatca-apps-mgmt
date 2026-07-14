<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Http\Resources\Concerns\FormatsResourceDates;
use App\Models\ApplicationAssignment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin ApplicationAssignment
 */
class ApplicationAssignmentResource extends JsonResource
{
    use FormatsResourceDates;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'application_id' => $this->application_id,
            'user_id' => $this->user_id,
            'app_role_id' => $this->app_role_id,
            'assigned_by' => $this->assigned_by,
            'assigned_at' => $this->formatDate($this->assigned_at),
            'ended_at' => $this->formatDate($this->ended_at),
            'is_primary' => $this->is_primary,
            'remarks' => $this->remarks,
            'is_open' => $this->ended_at === null,
            'application' => new ApplicationResource($this->whenLoaded('application')),
            'user' => new UserResource($this->whenLoaded('user')),
            'app_role' => new AppRoleResource($this->whenLoaded('appRole')),
            'assigned_by_user' => new UserResource($this->whenLoaded('assignedBy')),
            'created_at' => $this->formatDate($this->created_at),
            'updated_at' => $this->formatDate($this->updated_at),
        ];
    }
}
