<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\NetworkOpsCategory\StoreNetworkOpsCategoryRequest;
use App\Http\Requests\NetworkOpsCategory\UpdateNetworkOpsCategoryRequest;
use App\Http\Resources\NetworkOpsCategoryResource;
use App\Models\NetworkOpsCategory;
use App\Services\NetworkOpsCategoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class NetworkOpsCategoryController extends BaseApiController
{
    public function __construct(
        private readonly NetworkOpsCategoryService $infraCategoryService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', NetworkOpsCategory::class);

        $filters = $this->listFilters($request, 'sort_order');
        $filters['roots_only'] = $request->boolean('roots_only');
        $filters['parent_id'] = $request->filled('parent_id') ? $request->integer('parent_id') : null;
        $filters['active_only'] = $request->boolean('active_only');
        $filters['category_type'] = $request->string('category_type')->toString();
        $filters['active_status'] = $request->string('active_status')->toString();

        $paginator = $this->infraCategoryService->list($filters);

        return $this->paginatedResponse(
            $paginator,
            NetworkOpsCategoryResource::class,
            __('messages.network_ops_categories.listed'),
        );
    }

    public function statistics(): JsonResponse
    {
        $this->authorize('viewAny', NetworkOpsCategory::class);

        return $this->successResponse(
            $this->infraCategoryService->statistics(),
            __('messages.network_ops_categories.statistics_retrieved'),
        );
    }

    public function tree(Request $request): JsonResponse
    {
        $this->authorize('viewAny', NetworkOpsCategory::class);

        $tree = $this->infraCategoryService->tree($request->boolean('active_only'));

        return $this->successResponse(
            NetworkOpsCategoryResource::collection($tree)->resolve(),
            __('messages.network_ops_categories.tree_retrieved'),
        );
    }

    public function store(StoreNetworkOpsCategoryRequest $request): JsonResponse
    {
        $infraCategory = $this->infraCategoryService->create($request->validated());

        return $this->resourceResponse(
            new NetworkOpsCategoryResource($infraCategory->load(['parent', 'children'])),
            __('messages.network_ops_categories.created'),
            Response::HTTP_CREATED,
        );
    }

    public function show(NetworkOpsCategory $infraCategory): JsonResponse
    {
        $this->authorize('view', $infraCategory);

        return $this->resourceResponse(
            new NetworkOpsCategoryResource($this->infraCategoryService->find($infraCategory->id)),
            __('messages.network_ops_categories.retrieved'),
        );
    }

    public function update(UpdateNetworkOpsCategoryRequest $request, NetworkOpsCategory $infraCategory): JsonResponse
    {
        $infraCategory = $this->infraCategoryService->update($infraCategory, $request->validated());

        return $this->resourceResponse(
            new NetworkOpsCategoryResource($infraCategory),
            __('messages.network_ops_categories.updated'),
        );
    }

    public function destroy(NetworkOpsCategory $infraCategory): JsonResponse
    {
        $this->authorize('delete', $infraCategory);

        $this->infraCategoryService->delete($infraCategory);

        return $this->successResponse(null, __('messages.network_ops_categories.deleted'));
    }
}
