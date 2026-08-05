<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\InfraLevel\StoreInfraLevelRequest;
use App\Http\Requests\InfraLevel\UpdateInfraLevelRequest;
use App\Http\Resources\InfraLevelResource;
use App\Models\InfraLevel;
use App\Services\InfraLevelService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class InfraLevelController extends BaseApiController
{
    public function __construct(
        private readonly InfraLevelService $infraLevelService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', InfraLevel::class);

        $filters = $this->listFilters($request, 'sort_order');
        $filters['active_only'] = $request->boolean('active_only');

        $paginator = $this->infraLevelService->list($filters);

        return $this->paginatedResponse(
            $paginator,
            InfraLevelResource::class,
            __('messages.infra_levels.listed'),
        );
    }

    public function store(StoreInfraLevelRequest $request): JsonResponse
    {
        $infraLevel = $this->infraLevelService->create($request->validated());

        return $this->resourceResponse(
            new InfraLevelResource($infraLevel),
            __('messages.infra_levels.created'),
            Response::HTTP_CREATED,
        );
    }

    public function show(InfraLevel $infraLevel): JsonResponse
    {
        $this->authorize('view', $infraLevel);

        return $this->resourceResponse(
            new InfraLevelResource($this->infraLevelService->find($infraLevel->id)),
            __('messages.infra_levels.retrieved'),
        );
    }

    public function update(UpdateInfraLevelRequest $request, InfraLevel $infraLevel): JsonResponse
    {
        $infraLevel = $this->infraLevelService->update($infraLevel, $request->validated());

        return $this->resourceResponse(
            new InfraLevelResource($infraLevel),
            __('messages.infra_levels.updated'),
        );
    }

    public function destroy(InfraLevel $infraLevel): JsonResponse
    {
        $this->authorize('delete', $infraLevel);

        $this->infraLevelService->delete($infraLevel);

        return $this->successResponse(null, __('messages.infra_levels.deleted'));
    }
}
