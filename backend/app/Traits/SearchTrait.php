<?php

declare(strict_types=1);

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

trait SearchTrait
{
    /**
     * Apply OR LIKE filters across the given columns.
     *
     * @param  Builder<Model>  $query
     * @param  list<string>  $columns
     */
    protected function applyColumnSearch(Builder $query, ?string $search, array $columns): void
    {
        if ($search === null || trim($search) === '' || $columns === []) {
            return;
        }

        $term = '%'.trim($search).'%';

        $query->where(static function (Builder $builder) use ($term, $columns): void {
            foreach ($columns as $index => $column) {
                if ($index === 0) {
                    $builder->where($column, 'like', $term);

                    continue;
                }

                $builder->orWhere($column, 'like', $term);
            }
        });
    }
}
