<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Services\GlobalSearchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GlobalSearchController extends BaseApiController
{
    public function __construct(
        private readonly GlobalSearchService $globalSearchService,
    ) {
    }

    public function search(Request $request): JsonResponse
    {
        $query = $request->query('query');

        $results = $this->globalSearchService->search(
            is_string($query) ? $query : '',
            $request->user(),
        );

        return $this->successResponse($results, __('messages.search.results'));
    }
}
