<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\ReleaseManagementCategory\StoreReleaseManagementCategoryRequest;
use App\Http\Requests\ReleaseManagementCategory\UpdateReleaseManagementCategoryRequest;
use App\Http\Resources\ReleaseManagementCategoryResource;
use App\Models\ReleaseManagementCategory;
use App\Services\ReleaseManagementCategoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ReleaseManagementCategoryController extends BaseApiController
{
    public function __construct(
        private readonly ReleaseManagementCategoryService $infraCategoryService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', ReleaseManagementCategory::class);

        $filters = $this->listFilters($request, 'sort_order');
        $filters['roots_only'] = $request->boolean('roots_only');
        $filters['parent_id'] = $request->filled('parent_id') ? $request->integer('parent_id') : null;
        $filters['active_only'] = $request->boolean('active_only');
        $filters['category_type'] = $request->string('category_type')->toString();
        $filters['active_status'] = $request->string('active_status')->toString();

        $paginator = $this->infraCategoryService->list($filters);

        return $this->paginatedResponse(
            $paginator,
            ReleaseManagementCategoryResource::class,
            __('messages.release_management_categories.listed'),
        );
    }

    public function statistics(): JsonResponse
    {
        $this->authorize('viewAny', ReleaseManagementCategory::class);

        return $this->successResponse(
            $this->infraCategoryService->statistics(),
            __('messages.release_management_categories.statistics_retrieved'),
        );
    }

    public function tree(Request $request): JsonResponse
    {
        $this->authorize('viewAny', ReleaseManagementCategory::class);

        $tree = $this->infraCategoryService->tree($request->boolean('active_only'));

        return $this->successResponse(
            ReleaseManagementCategoryResource::collection($tree)->resolve(),
            __('messages.release_management_categories.tree_retrieved'),
        );
    }

    public function store(StoreReleaseManagementCategoryRequest $request): JsonResponse
    {
        $infraCategory = $this->infraCategoryService->create($request->validated());

        return $this->resourceResponse(
            new ReleaseManagementCategoryResource($infraCategory->load(['parent', 'children'])),
            __('messages.release_management_categories.created'),
            Response::HTTP_CREATED,
        );
    }

    public function show(ReleaseManagementCategory $infraCategory): JsonResponse
    {
        $this->authorize('view', $infraCategory);

        return $this->resourceResponse(
            new ReleaseManagementCategoryResource($this->infraCategoryService->find($infraCategory->id)),
            __('messages.release_management_categories.retrieved'),
        );
    }

    public function update(UpdateReleaseManagementCategoryRequest $request, ReleaseManagementCategory $infraCategory): JsonResponse
    {
        $infraCategory = $this->infraCategoryService->update($infraCategory, $request->validated());

        return $this->resourceResponse(
            new ReleaseManagementCategoryResource($infraCategory),
            __('messages.release_management_categories.updated'),
        );
    }

    public function destroy(ReleaseManagementCategory $infraCategory): JsonResponse
    {
        $this->authorize('delete', $infraCategory);

        $this->infraCategoryService->delete($infraCategory);

        return $this->successResponse(null, __('messages.release_management_categories.deleted'));
    }
}
