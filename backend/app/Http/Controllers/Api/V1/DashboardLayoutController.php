<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Dashboard\UpdateDashboardLayoutRequest;
use App\Models\User;
use App\Models\UserDashboardLayout;
use App\Services\DashboardLayoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardLayoutController extends BaseApiController
{
    public function __construct(
        private readonly DashboardLayoutService $dashboardLayoutService,
    ) {
    }

    public function show(Request $request): JsonResponse
    {
        $this->authorize('viewAny', UserDashboardLayout::class);

        return $this->successResponse(
            $this->dashboardLayoutService->getForUser($this->currentUser($request)),
            __('messages.dashboard_layout.retrieved'),
        );
    }

    public function update(UpdateDashboardLayoutRequest $request): JsonResponse
    {
        return $this->successResponse(
            $this->dashboardLayoutService->updateForUser(
                $this->currentUser($request),
                $request->widgetOrder(),
            ),
            __('messages.dashboard_layout.updated'),
        );
    }

    public function destroy(Request $request): JsonResponse
    {
        $this->authorize('delete', UserDashboardLayout::class);

        return $this->successResponse(
            $this->dashboardLayoutService->resetForUser($this->currentUser($request)),
            __('messages.dashboard_layout.reset'),
        );
    }

    private function currentUser(Request $request): User
    {
        /** @var User $user */
        $user = $request->user();

        return $user;
    }
}
