<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\SmartFacilitiesCategory\StoreSmartFacilitiesCategoryRequest;
use App\Http\Requests\SmartFacilitiesCategory\UpdateSmartFacilitiesCategoryRequest;
use App\Http\Resources\SmartFacilitiesCategoryResource;
use App\Models\SmartFacilitiesCategory;
use App\Services\SmartFacilitiesCategoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SmartFacilitiesCategoryController extends BaseApiController
{
    public function __construct(
        private readonly SmartFacilitiesCategoryService $infraCategoryService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', SmartFacilitiesCategory::class);

        $filters = $this->listFilters($request, 'sort_order');
        $filters['roots_only'] = $request->boolean('roots_only');
        $filters['parent_id'] = $request->filled('parent_id') ? $request->integer('parent_id') : null;
        $filters['active_only'] = $request->boolean('active_only');
        $filters['category_type'] = $request->string('category_type')->toString();
        $filters['active_status'] = $request->string('active_status')->toString();

        $paginator = $this->infraCategoryService->list($filters);

        return $this->paginatedResponse(
            $paginator,
            SmartFacilitiesCategoryResource::class,
            __('messages.smart_facilities_categories.listed'),
        );
    }

    public function statistics(): JsonResponse
    {
        $this->authorize('viewAny', SmartFacilitiesCategory::class);

        return $this->successResponse(
            $this->infraCategoryService->statistics(),
            __('messages.smart_facilities_categories.statistics_retrieved'),
        );
    }

    public function tree(Request $request): JsonResponse
    {
        $this->authorize('viewAny', SmartFacilitiesCategory::class);

        $tree = $this->infraCategoryService->tree($request->boolean('active_only'));

        return $this->successResponse(
            SmartFacilitiesCategoryResource::collection($tree)->resolve(),
            __('messages.smart_facilities_categories.tree_retrieved'),
        );
    }

    public function store(StoreSmartFacilitiesCategoryRequest $request): JsonResponse
    {
        $infraCategory = $this->infraCategoryService->create($request->validated());

        return $this->resourceResponse(
            new SmartFacilitiesCategoryResource($infraCategory->load(['parent', 'children'])),
            __('messages.smart_facilities_categories.created'),
            Response::HTTP_CREATED,
        );
    }

    public function show(SmartFacilitiesCategory $infraCategory): JsonResponse
    {
        $this->authorize('view', $infraCategory);

        return $this->resourceResponse(
            new SmartFacilitiesCategoryResource($this->infraCategoryService->find($infraCategory->id)),
            __('messages.smart_facilities_categories.retrieved'),
        );
    }

    public function update(UpdateSmartFacilitiesCategoryRequest $request, SmartFacilitiesCategory $infraCategory): JsonResponse
    {
        $infraCategory = $this->infraCategoryService->update($infraCategory, $request->validated());

        return $this->resourceResponse(
            new SmartFacilitiesCategoryResource($infraCategory),
            __('messages.smart_facilities_categories.updated'),
        );
    }

    public function destroy(SmartFacilitiesCategory $infraCategory): JsonResponse
    {
        $this->authorize('delete', $infraCategory);

        $this->infraCategoryService->delete($infraCategory);

        return $this->successResponse(null, __('messages.smart_facilities_categories.deleted'));
    }
}
