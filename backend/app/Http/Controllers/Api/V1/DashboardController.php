<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Services\DashboardService;
use Illuminate\Http\JsonResponse;

class DashboardController extends BaseApiController
{
    public function __construct(
        private readonly DashboardService $dashboardService,
    ) {}

    public function index(): JsonResponse
    {
        return $this->successResponse(
            $this->dashboardService->index(),
            __('messages.dashboard.retrieved'),
        );
    }
}
