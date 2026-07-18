<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Criticality\StoreCriticalityRequest;
use App\Http\Requests\Criticality\UpdateCriticalityRequest;
use App\Http\Resources\CriticalityResource;
use App\Models\Criticality;
use App\Services\CriticalityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CriticalityController extends BaseApiController
{
    public function __construct(
        private readonly CriticalityService $criticalityService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Criticality::class);

        $paginator = $this->criticalityService->list(
            $this->listFilters($request, 'name_en')
        );

        return $this->paginatedResponse(
            $paginator,
            CriticalityResource::class,
            __('messages.criticalities.listed'),
        );
    }

    public function store(StoreCriticalityRequest $request): JsonResponse
    {
        $criticality = $this->criticalityService->create($request->validated());

        return $this->resourceResponse(
            new CriticalityResource($criticality),
            __('messages.criticalities.created'),
            Response::HTTP_CREATED,
        );
    }

    public function show(Criticality $criticality): JsonResponse
    {
        $this->authorize('view', $criticality);

        return $this->resourceResponse(
            new CriticalityResource($this->criticalityService->find($criticality->id)),
            __('messages.criticalities.retrieved'),
        );
    }

    public function update(UpdateCriticalityRequest $request, Criticality $criticality): JsonResponse
    {
        $criticality = $this->criticalityService->update($criticality, $request->validated());

        return $this->resourceResponse(
            new CriticalityResource($criticality),
            __('messages.criticalities.updated'),
        );
    }

    public function destroy(Criticality $criticality): JsonResponse
    {
        $this->authorize('delete', $criticality);

        $this->criticalityService->delete($criticality);

        return $this->successResponse(null, __('messages.criticalities.deleted'));
    }
}
