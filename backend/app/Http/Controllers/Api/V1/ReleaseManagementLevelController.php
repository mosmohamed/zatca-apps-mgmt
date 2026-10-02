<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\ReleaseManagementLevel\StoreReleaseManagementLevelRequest;
use App\Http\Requests\ReleaseManagementLevel\UpdateReleaseManagementLevelRequest;
use App\Http\Resources\ReleaseManagementLevelResource;
use App\Models\ReleaseManagementLevel;
use App\Services\ReleaseManagementLevelService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ReleaseManagementLevelController extends BaseApiController
{
    public function __construct(
        private readonly ReleaseManagementLevelService $infraLevelService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', ReleaseManagementLevel::class);

        $filters = $this->listFilters($request, 'sort_order');
        $filters['active_only'] = $request->boolean('active_only');

        $paginator = $this->infraLevelService->list($filters);

        return $this->paginatedResponse(
            $paginator,
            ReleaseManagementLevelResource::class,
            __('messages.release_management_levels.listed'),
        );
    }

    public function store(StoreReleaseManagementLevelRequest $request): JsonResponse
    {
        $infraLevel = $this->infraLevelService->create($request->validated());

        return $this->resourceResponse(
            new ReleaseManagementLevelResource($infraLevel),
            __('messages.release_management_levels.created'),
            Response::HTTP_CREATED,
        );
    }

    public function show(ReleaseManagementLevel $infraLevel): JsonResponse
    {
        $this->authorize('view', $infraLevel);

        return $this->resourceResponse(
            new ReleaseManagementLevelResource($this->infraLevelService->find($infraLevel->id)),
            __('messages.release_management_levels.retrieved'),
        );
    }

    public function update(UpdateReleaseManagementLevelRequest $request, ReleaseManagementLevel $infraLevel): JsonResponse
    {
        $infraLevel = $this->infraLevelService->update($infraLevel, $request->validated());

        return $this->resourceResponse(
            new ReleaseManagementLevelResource($infraLevel),
            __('messages.release_management_levels.updated'),
        );
    }

    public function destroy(ReleaseManagementLevel $infraLevel): JsonResponse
    {
        $this->authorize('delete', $infraLevel);

        $this->infraLevelService->delete($infraLevel);

        return $this->successResponse(null, __('messages.release_management_levels.deleted'));
    }
}
