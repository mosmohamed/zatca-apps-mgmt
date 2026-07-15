<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Http\Resources\Concerns\FormatsResourceDates;
use App\Models\License;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin License
 */
class LicenseResource extends JsonResource
{
    use FormatsResourceDates;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'publisher' => $this->publisher,
            'name' => $this->name,
            'product' => $this->product,
            'version' => $this->version,
            'description' => $this->description,
            'environment' => $this->environment,
            'licensed' => $this->licensed,
            'used' => $this->used,
            'available' => $this->available,
            'proof_of_entitlement' => $this->proof_of_entitlement,
            'start_date' => $this->start_date?->format('Y-m-d'),
            'end_date' => $this->end_date?->format('Y-m-d'),
            'status' => $this->status(),
            'days_remaining' => $this->daysRemaining(),
            'created_at' => $this->formatDate($this->created_at),
            'updated_at' => $this->formatDate($this->updated_at),
            'deleted_at' => $this->formatDate($this->deleted_at),
        ];
    }
}
