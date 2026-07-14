<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\ActivityLogResource;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ActivityLogController extends BaseApiController
{
    public function __construct(
        private readonly ActivityLogService $activityLogService,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()?->can('activity-log.view'), Response::HTTP_FORBIDDEN, __('messages.auth.forbidden'));

        $pagination = $this->paginationParams($request);

        $paginator = $this->activityLogService->list([
            'subject_type' => $request->query('subject_type'),
            'causer_id' => $request->query('causer_id'),
            'date_from' => $request->query('date_from'),
            'date_to' => $request->query('date_to'),
            'search' => $request->query('search'),
            'page' => $pagination['page'],
            'per_page' => $pagination['per_page'],
        ]);

        return $this->paginatedResponse(
            $paginator,
            ActivityLogResource::class,
            __('messages.activity_log.listed'),
        );
    }

    public function show(Request $request, int $id): JsonResponse
    {
        abort_unless($request->user()?->can('activity-log.view'), Response::HTTP_FORBIDDEN, __('messages.auth.forbidden'));

        return $this->resourceResponse(
            new ActivityLogResource($this->activityLogService->find($id)),
            __('messages.activity_log.retrieved'),
        );
    }

    public function stats(Request $request): JsonResponse
    {
        abort_unless($request->user()?->can('activity-log.view'), Response::HTTP_FORBIDDEN, __('messages.auth.forbidden'));

        return $this->successResponse(
            $this->activityLogService->stats(),
            __('messages.activity_log.stats_retrieved'),
        );
    }
}
