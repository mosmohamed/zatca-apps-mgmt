<?php

declare(strict_types=1);

namespace App\Http\Resources\Concerns;

use App\Models\InfrastructureComponent;

/**
 * Shared tail of every infrastructure component payload (ordering, ownership
 * and timestamps).
 */
trait SerializesInfrastructureComponent
{
    use FormatsResourceDates;

    /**
     * @return array<string, mixed>
     */
    protected function componentMeta(): array
    {
        /** @var InfrastructureComponent $component */
        $component = $this->resource;

        return [
            'sort_order' => $component->sort_order,
            'created_by' => $component->created_by,
            'updated_by' => $component->updated_by,
            'created_at' => $this->formatDate($component->created_at),
            'updated_at' => $this->formatDate($component->updated_at),
        ];
    }
}
