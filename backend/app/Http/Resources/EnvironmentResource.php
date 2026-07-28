<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\Environment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Environment
 */
class EnvironmentResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name_en' => $this->name_en,
            'name_ar' => $this->name_ar,
            'sort_order' => $this->sort_order,
            'is_active' => $this->is_active,
        ];
    }
}
