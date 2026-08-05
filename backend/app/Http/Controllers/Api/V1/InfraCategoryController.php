<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\InfraCategory\StoreInfraCategoryRequest;
use App\Http\Requests\InfraCategory\UpdateInfraCategoryRequest;
use App\Http\Resources\InfraCategoryResource;
use App\Models\InfraCategory;
use App\Services\InfraCategoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class InfraCategoryController extends BaseApiController
{
    public function __construct(
        private readonly InfraCategoryService $infraCategoryService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', InfraCategory::class);

        $filters = $this->listFilters($request, 'sort_order');
        $filters['roots_only'] = $request->boolean('roots_only');
        $filters['parent_id'] = $request->filled('parent_id') ? $request->integer('parent_id') : null;
        $filters['active_only'] = $request->boolean('active_only');
        $filters['category_type'] = $request->string('category_type')->toString();
        $filters['active_status'] = $request->string('active_status')->toString();

        $paginator = $this->infraCategoryService->list($filters);

        return $this->paginatedResponse(
            $paginator,
            InfraCategoryResource::class,
            __('messages.infra_categories.listed'),
        );
    }

    public function statistics(): JsonResponse
    {
        $this->authorize('viewAny', InfraCategory::class);

        return $this->successResponse(
            $this->infraCategoryService->statistics(),
            __('messages.infra_categories.statistics_retrieved'),
        );
    }

    public function tree(Request $request): JsonResponse
    {
        $this->authorize('viewAny', InfraCategory::class);

        $tree = $this->infraCategoryService->tree($request->boolean('active_only'));

        return $this->successResponse(
            InfraCategoryResource::collection($tree)->resolve(),
            __('messages.infra_categories.tree_retrieved'),
        );
    }

    public function store(StoreInfraCategoryRequest $request): JsonResponse
    {
        $infraCategory = $this->infraCategoryService->create($request->validated());

        return $this->resourceResponse(
            new InfraCategoryResource($infraCategory->load(['parent', 'children'])),
            __('messages.infra_categories.created'),
            Response::HTTP_CREATED,
        );
    }

    public function show(InfraCategory $infraCategory): JsonResponse
    {
        $this->authorize('view', $infraCategory);

        return $this->resourceResponse(
            new InfraCategoryResource($this->infraCategoryService->find($infraCategory->id)),
            __('messages.infra_categories.retrieved'),
        );
    }

    public function update(UpdateInfraCategoryRequest $request, InfraCategory $infraCategory): JsonResponse
    {
        $infraCategory = $this->infraCategoryService->update($infraCategory, $request->validated());

        return $this->resourceResponse(
            new InfraCategoryResource($infraCategory),
            __('messages.infra_categories.updated'),
        );
    }

    public function destroy(InfraCategory $infraCategory): JsonResponse
    {
        $this->authorize('delete', $infraCategory);

        $this->infraCategoryService->delete($infraCategory);

        return $this->successResponse(null, __('messages.infra_categories.deleted'));
    }
}
