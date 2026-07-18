<?php

declare(strict_types=1);

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

trait SortTrait
{
    /**
     * Apply whitelist-safe sorting. Prefix column with `-` for DESC.
     *
     * @param  Builder<Model>  $query
     * @param  list<string>  $allowed
     */
    protected function applyColumnSort(
        Builder $query,
        ?string $sort,
        array $allowed,
        string $default = '-created_at',
    ): void {
        $sortValue = ($sort === null || trim($sort) === '') ? $default : trim($sort);
        $direction = str_starts_with($sortValue, '-') ? 'desc' : 'asc';
        $column = ltrim($sortValue, '-');

        if (! in_array($column, $allowed, true)) {
            $fallback = ltrim($default, '-');
            $column = in_array($fallback, $allowed, true) ? $fallback : ($allowed[0] ?? 'id');
            $direction = str_starts_with($default, '-') ? 'desc' : 'asc';
        }

        $query->orderBy($column, $direction);
    }
}
