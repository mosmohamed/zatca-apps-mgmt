<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Technology\StoreTechnologyRequest;
use App\Http\Requests\Technology\UpdateTechnologyRequest;
use App\Http\Resources\TechnologyResource;
use App\Models\Technology;
use App\Services\TechnologyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TechnologyController extends BaseApiController
{
    public function __construct(
        private readonly TechnologyService $technologyService,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Technology::class);

        $paginator = $this->technologyService->list(
            $this->listFilters($request, 'name')
        );

        return $this->paginatedResponse(
            $paginator,
            TechnologyResource::class,
            __('messages.technologies.listed'),
        );
    }


    public function statistics(): JsonResponse
    {
        $this->authorize('viewAny', Technology::class);

        return $this->successResponse(
            $this->technologyService->statistics(),
            __('messages.technologies.stats'),
        );
    }

    public function store(StoreTechnologyRequest $request): JsonResponse
    {
        $technology = $this->technologyService->create($request->validated());

        return $this->resourceResponse(
            new TechnologyResource($technology),
            __('messages.technologies.created'),
            Response::HTTP_CREATED,
        );
    }

    public function show(Technology $technology): JsonResponse
    {
        $this->authorize('view', $technology);

        return $this->resourceResponse(
            new TechnologyResource($this->technologyService->find($technology->id)),
            __('messages.technologies.retrieved'),
        );
    }

    public function update(UpdateTechnologyRequest $request, Technology $technology): JsonResponse
    {
        $technology = $this->technologyService->update($technology, $request->validated());

        return $this->resourceResponse(
            new TechnologyResource($technology),
            __('messages.technologies.updated'),
        );
    }

    public function destroy(Technology $technology): JsonResponse
    {
        $this->authorize('delete', $technology);

        $this->technologyService->delete($technology);

        return $this->successResponse(null, __('messages.technologies.deleted'));
    }
}
