<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Compact user payload for application owner multi-selects and chips.
 *
 * @mixin User
 */
class ApplicationOwnerResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'full_name' => $this->full_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'is_active' => (bool) $this->is_active,
            'job_title' => $this->when(
                $this->relationLoaded('jobTitle') && $this->jobTitle !== null,
                fn (): array => [
                    'id' => $this->jobTitle->id,
                    'name_en' => $this->jobTitle->name_en,
                    'name_ar' => $this->jobTitle->name_ar,
                ],
            ),
            'vendor' => $this->when(
                $this->relationLoaded('vendor') && $this->vendor !== null,
                fn (): array => [
                    'id' => $this->vendor->id,
                    'name' => $this->vendor->name,
                ],
            ),
        ];
    }
}
