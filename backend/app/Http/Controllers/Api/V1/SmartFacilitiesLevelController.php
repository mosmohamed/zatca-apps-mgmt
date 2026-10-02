<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\SmartFacilitiesLevel\StoreSmartFacilitiesLevelRequest;
use App\Http\Requests\SmartFacilitiesLevel\UpdateSmartFacilitiesLevelRequest;
use App\Http\Resources\SmartFacilitiesLevelResource;
use App\Models\SmartFacilitiesLevel;
use App\Services\SmartFacilitiesLevelService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SmartFacilitiesLevelController extends BaseApiController
{
    public function __construct(
        private readonly SmartFacilitiesLevelService $infraLevelService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', SmartFacilitiesLevel::class);

        $filters = $this->listFilters($request, 'sort_order');
        $filters['active_only'] = $request->boolean('active_only');

        $paginator = $this->infraLevelService->list($filters);

        return $this->paginatedResponse(
            $paginator,
            SmartFacilitiesLevelResource::class,
            __('messages.smart_facilities_levels.listed'),
        );
    }

    public function store(StoreSmartFacilitiesLevelRequest $request): JsonResponse
    {
        $infraLevel = $this->infraLevelService->create($request->validated());

        return $this->resourceResponse(
            new SmartFacilitiesLevelResource($infraLevel),
            __('messages.smart_facilities_levels.created'),
            Response::HTTP_CREATED,
        );
    }

    public function show(SmartFacilitiesLevel $infraLevel): JsonResponse
    {
        $this->authorize('view', $infraLevel);

        return $this->resourceResponse(
            new SmartFacilitiesLevelResource($this->infraLevelService->find($infraLevel->id)),
            __('messages.smart_facilities_levels.retrieved'),
        );
    }

    public function update(UpdateSmartFacilitiesLevelRequest $request, SmartFacilitiesLevel $infraLevel): JsonResponse
    {
        $infraLevel = $this->infraLevelService->update($infraLevel, $request->validated());

        return $this->resourceResponse(
            new SmartFacilitiesLevelResource($infraLevel),
            __('messages.smart_facilities_levels.updated'),
        );
    }

    public function destroy(SmartFacilitiesLevel $infraLevel): JsonResponse
    {
        $this->authorize('delete', $infraLevel);

        $this->infraLevelService->delete($infraLevel);

        return $this->successResponse(null, __('messages.smart_facilities_levels.deleted'));
    }
}
