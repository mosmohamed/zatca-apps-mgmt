<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Department\StoreDepartmentRequest;
use App\Http\Requests\Department\UpdateDepartmentRequest;
use App\Http\Resources\DepartmentResource;
use App\Models\Department;
use App\Services\DepartmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class DepartmentController extends BaseApiController
{
    public function __construct(
        private readonly DepartmentService $departmentService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Department::class);

        $paginator = $this->departmentService->list(
            $this->listFilters($request, 'name_en')
        );

        return $this->paginatedResponse(
            $paginator,
            DepartmentResource::class,
            __('messages.departments.listed'),
        );
    }

    public function store(StoreDepartmentRequest $request): JsonResponse
    {
        $department = $this->departmentService->create($request->validated());

        return $this->resourceResponse(
            new DepartmentResource($department),
            __('messages.departments.created'),
            Response::HTTP_CREATED,
        );
    }

    public function show(Department $department): JsonResponse
    {
        $this->authorize('view', $department);

        return $this->resourceResponse(
            new DepartmentResource($this->departmentService->find($department->id)),
            __('messages.departments.retrieved'),
        );
    }

    public function update(UpdateDepartmentRequest $request, Department $department): JsonResponse
    {
        $department = $this->departmentService->update($department, $request->validated());

        return $this->resourceResponse(
            new DepartmentResource($department),
            __('messages.departments.updated'),
        );
    }

    public function destroy(Department $department): JsonResponse
    {
        $this->authorize('delete', $department);

        $this->departmentService->delete($department);

        return $this->successResponse(null, __('messages.departments.deleted'));
    }
}
