<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\NetworkOpsLevel\StoreNetworkOpsLevelRequest;
use App\Http\Requests\NetworkOpsLevel\UpdateNetworkOpsLevelRequest;
use App\Http\Resources\NetworkOpsLevelResource;
use App\Models\NetworkOpsLevel;
use App\Services\NetworkOpsLevelService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class NetworkOpsLevelController extends BaseApiController
{
    public function __construct(
        private readonly NetworkOpsLevelService $infraLevelService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', NetworkOpsLevel::class);

        $filters = $this->listFilters($request, 'sort_order');
        $filters['active_only'] = $request->boolean('active_only');

        $paginator = $this->infraLevelService->list($filters);

        return $this->paginatedResponse(
            $paginator,
            NetworkOpsLevelResource::class,
            __('messages.network_ops_levels.listed'),
        );
    }

    public function store(StoreNetworkOpsLevelRequest $request): JsonResponse
    {
        $infraLevel = $this->infraLevelService->create($request->validated());

        return $this->resourceResponse(
            new NetworkOpsLevelResource($infraLevel),
            __('messages.network_ops_levels.created'),
            Response::HTTP_CREATED,
        );
    }

    public function show(NetworkOpsLevel $infraLevel): JsonResponse
    {
        $this->authorize('view', $infraLevel);

        return $this->resourceResponse(
            new NetworkOpsLevelResource($this->infraLevelService->find($infraLevel->id)),
            __('messages.network_ops_levels.retrieved'),
        );
    }

    public function update(UpdateNetworkOpsLevelRequest $request, NetworkOpsLevel $infraLevel): JsonResponse
    {
        $infraLevel = $this->infraLevelService->update($infraLevel, $request->validated());

        return $this->resourceResponse(
            new NetworkOpsLevelResource($infraLevel),
            __('messages.network_ops_levels.updated'),
        );
    }

    public function destroy(NetworkOpsLevel $infraLevel): JsonResponse
    {
        $this->authorize('delete', $infraLevel);

        $this->infraLevelService->delete($infraLevel);

        return $this->successResponse(null, __('messages.network_ops_levels.deleted'));
    }
}
