<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Http\Resources\Concerns\BuildsInitials;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Compact user summary used by the hover preview cards. Credentials and
 * security related columns are intentionally never exposed here.
 *
 * @mixin User
 */
class UserPreviewResource extends JsonResource
{
    use BuildsInitials;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'full_name' => $this->full_name,
            'initials' => $this->buildInitials($this->first_name, $this->last_name),
            'email' => $this->email,
            'phone' => $this->phone,
            'extension' => $this->extension,
            'teams' => $this->teams,
            'is_active' => $this->is_active,
            'job_title' => $this->jobTitle === null ? null : [
                'id' => $this->jobTitle->id,
                'name_en' => $this->jobTitle->name_en,
                'name_ar' => $this->jobTitle->name_ar,
            ],
            'vendor' => $this->vendor === null ? null : [
                'id' => $this->vendor->id,
                'name' => $this->vendor->name,
            ],
            'roles' => $this->roles->pluck('name')->values()->all(),
            'active_assignments_count' => (int) $this->active_assignments_count,
        ];
    }
}
