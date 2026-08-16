<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\ServiceDeskLevel\StoreServiceDeskLevelRequest;
use App\Http\Requests\ServiceDeskLevel\UpdateServiceDeskLevelRequest;
use App\Http\Resources\ServiceDeskLevelResource;
use App\Models\ServiceDeskLevel;
use App\Services\ServiceDeskLevelService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ServiceDeskLevelController extends BaseApiController
{
    public function __construct(
        private readonly ServiceDeskLevelService $infraLevelService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', ServiceDeskLevel::class);

        $filters = $this->listFilters($request, 'sort_order');
        $filters['active_only'] = $request->boolean('active_only');

        $paginator = $this->infraLevelService->list($filters);

        return $this->paginatedResponse(
            $paginator,
            ServiceDeskLevelResource::class,
            __('messages.service_desk_levels.listed'),
        );
    }

    public function store(StoreServiceDeskLevelRequest $request): JsonResponse
    {
        $infraLevel = $this->infraLevelService->create($request->validated());

        return $this->resourceResponse(
            new ServiceDeskLevelResource($infraLevel),
            __('messages.service_desk_levels.created'),
            Response::HTTP_CREATED,
        );
    }

    public function show(ServiceDeskLevel $infraLevel): JsonResponse
    {
        $this->authorize('view', $infraLevel);

        return $this->resourceResponse(
            new ServiceDeskLevelResource($this->infraLevelService->find($infraLevel->id)),
            __('messages.service_desk_levels.retrieved'),
        );
    }

    public function update(UpdateServiceDeskLevelRequest $request, ServiceDeskLevel $infraLevel): JsonResponse
    {
        $infraLevel = $this->infraLevelService->update($infraLevel, $request->validated());

        return $this->resourceResponse(
            new ServiceDeskLevelResource($infraLevel),
            __('messages.service_desk_levels.updated'),
        );
    }

    public function destroy(ServiceDeskLevel $infraLevel): JsonResponse
    {
        $this->authorize('delete', $infraLevel);

        $this->infraLevelService->delete($infraLevel);

        return $this->successResponse(null, __('messages.service_desk_levels.deleted'));
    }
}
