<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\ApplicationStatus\StoreApplicationStatusRequest;
use App\Http\Requests\ApplicationStatus\UpdateApplicationStatusRequest;
use App\Http\Resources\ApplicationStatusResource;
use App\Models\ApplicationStatus;
use App\Services\ApplicationStatusService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApplicationStatusController extends BaseApiController
{
    public function __construct(
        private readonly ApplicationStatusService $applicationStatusService,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', ApplicationStatus::class);

        $paginator = $this->applicationStatusService->list(
            $this->listFilters($request, 'name_en')
        );

        return $this->paginatedResponse(
            $paginator,
            ApplicationStatusResource::class,
            __('messages.application_statuses.listed'),
        );
    }

    public function store(StoreApplicationStatusRequest $request): JsonResponse
    {
        $applicationStatus = $this->applicationStatusService->create($request->validated());

        return $this->resourceResponse(
            new ApplicationStatusResource($applicationStatus),
            __('messages.application_statuses.created'),
            Response::HTTP_CREATED,
        );
    }

    public function show(ApplicationStatus $applicationStatus): JsonResponse
    {
        $this->authorize('view', $applicationStatus);

        return $this->resourceResponse(
            new ApplicationStatusResource($this->applicationStatusService->find($applicationStatus->id)),
            __('messages.application_statuses.retrieved'),
        );
    }

    public function update(UpdateApplicationStatusRequest $request, ApplicationStatus $applicationStatus): JsonResponse
    {
        $applicationStatus = $this->applicationStatusService->update($applicationStatus, $request->validated());

        return $this->resourceResponse(
            new ApplicationStatusResource($applicationStatus),
            __('messages.application_statuses.updated'),
        );
    }

    public function destroy(ApplicationStatus $applicationStatus): JsonResponse
    {
        $this->authorize('delete', $applicationStatus);

        $this->applicationStatusService->delete($applicationStatus);

        return $this->successResponse(null, __('messages.application_statuses.deleted'));
    }
}
