<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends BaseApiController
{
    public function __construct(
        private readonly DashboardService $dashboardService,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        return $this->successResponse(
            $this->dashboardService->index($request->user()),
            __('messages.dashboard.retrieved'),
        );
    }
}
