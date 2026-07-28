<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Http\Resources\Concerns\BuildsInitials;
use App\Models\Vendor;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Compact vendor summary used by the hover preview cards.
 *
 * @mixin Vendor
 */
class VendorPreviewResource extends JsonResource
{
    use BuildsInitials;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'initials' => $this->buildInitialsFromLabel($this->name),
            'email' => $this->email,
            'phone' => $this->phone,
            'contact_person_email' => $this->contact_person_email,
            'contact_person_phone' => $this->contact_person_phone,
            'remarks' => $this->remarks,
            'status' => $this->status,
            'users_count' => (int) $this->users_count,
            'active_users_count' => (int) $this->active_users_count,
        ];
    }
}
