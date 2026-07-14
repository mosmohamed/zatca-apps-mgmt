<?php

declare(strict_types=1);

namespace App\Http\Resources\Concerns;

use Carbon\CarbonInterface;

trait FormatsResourceDates
{
    protected function formatDate(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        if ($value instanceof CarbonInterface) {
            return $value->format('Y-m-d H:i:s');
        }

        return (string) $value;
    }
}
