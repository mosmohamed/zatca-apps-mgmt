<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\ServiceDeskCategory\StoreServiceDeskCategoryRequest;
use App\Http\Requests\ServiceDeskCategory\UpdateServiceDeskCategoryRequest;
use App\Http\Resources\ServiceDeskCategoryResource;
use App\Models\ServiceDeskCategory;
use App\Services\ServiceDeskCategoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ServiceDeskCategoryController extends BaseApiController
{
    public function __construct(
        private readonly ServiceDeskCategoryService $infraCategoryService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', ServiceDeskCategory::class);

        $filters = $this->listFilters($request, 'sort_order');
        $filters['roots_only'] = $request->boolean('roots_only');
        $filters['parent_id'] = $request->filled('parent_id') ? $request->integer('parent_id') : null;
        $filters['active_only'] = $request->boolean('active_only');
        $filters['category_type'] = $request->string('category_type')->toString();
        $filters['active_status'] = $request->string('active_status')->toString();

        $paginator = $this->infraCategoryService->list($filters);

        return $this->paginatedResponse(
            $paginator,
            ServiceDeskCategoryResource::class,
            __('messages.service_desk_categories.listed'),
        );
    }

    public function statistics(): JsonResponse
    {
        $this->authorize('viewAny', ServiceDeskCategory::class);

        return $this->successResponse(
            $this->infraCategoryService->statistics(),
            __('messages.service_desk_categories.statistics_retrieved'),
        );
    }

    public function tree(Request $request): JsonResponse
    {
        $this->authorize('viewAny', ServiceDeskCategory::class);

        $tree = $this->infraCategoryService->tree($request->boolean('active_only'));

        return $this->successResponse(
            ServiceDeskCategoryResource::collection($tree)->resolve(),
            __('messages.service_desk_categories.tree_retrieved'),
        );
    }

    public function store(StoreServiceDeskCategoryRequest $request): JsonResponse
    {
        $infraCategory = $this->infraCategoryService->create($request->validated());

        return $this->resourceResponse(
            new ServiceDeskCategoryResource($infraCategory->load(['parent', 'children'])),
            __('messages.service_desk_categories.created'),
            Response::HTTP_CREATED,
        );
    }

    public function show(ServiceDeskCategory $infraCategory): JsonResponse
    {
        $this->authorize('view', $infraCategory);

        return $this->resourceResponse(
            new ServiceDeskCategoryResource($this->infraCategoryService->find($infraCategory->id)),
            __('messages.service_desk_categories.retrieved'),
        );
    }

    public function update(UpdateServiceDeskCategoryRequest $request, ServiceDeskCategory $infraCategory): JsonResponse
    {
        $infraCategory = $this->infraCategoryService->update($infraCategory, $request->validated());

        return $this->resourceResponse(
            new ServiceDeskCategoryResource($infraCategory),
            __('messages.service_desk_categories.updated'),
        );
    }

    public function destroy(ServiceDeskCategory $infraCategory): JsonResponse
    {
        $this->authorize('delete', $infraCategory);

        $this->infraCategoryService->delete($infraCategory);

        return $this->successResponse(null, __('messages.service_desk_categories.deleted'));
    }
}
