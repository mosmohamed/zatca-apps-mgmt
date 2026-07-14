<?php

declare(strict_types=1);

namespace App\Traits;

use Illuminate\Http\Request;

trait PaginationTrait
{
    /**
     * @return array{page: int, per_page: int}
     */
    protected function paginationParams(
        Request $request,
        int $defaultPerPage = 15,
        int $maxPerPage = 100,
    ): array {
        return [
            'page' => max(1, $request->integer('page', 1)),
            'per_page' => max(1, min($request->integer('per_page', $defaultPerPage), $maxPerPage)),
        ];
    }

    /**
     * Standard list filter bag extracted from an index request.
     *
     * @return array{search: string|null, sort: string, page: int, per_page: int}
     */
    protected function listFilters(Request $request, string $defaultSort = '-created_at'): array
    {
        $pagination = $this->paginationParams($request);

        $search = $request->query('search');
        $sort = $request->query('sort', $defaultSort);

        return [
            'search' => is_string($search) ? $search : null,
            'sort' => is_string($sort) && $sort !== '' ? $sort : $defaultSort,
            'page' => $pagination['page'],
            'per_page' => $pagination['per_page'],
        ];
    }
}
