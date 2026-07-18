<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\AppRole\StoreAppRoleRequest;
use App\Http\Requests\AppRole\UpdateAppRoleRequest;
use App\Http\Resources\AppRoleResource;
use App\Models\AppRole;
use App\Services\AppRoleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AppRoleController extends BaseApiController
{
    public function __construct(
        private readonly AppRoleService $appRoleService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', AppRole::class);

        $paginator = $this->appRoleService->list(
            $this->listFilters($request, 'sort_order')
        );

        return $this->paginatedResponse(
            $paginator,
            AppRoleResource::class,
            __('messages.app_roles.listed'),
        );
    }

    public function store(StoreAppRoleRequest $request): JsonResponse
    {
        $appRole = $this->appRoleService->create($request->validated());

        return $this->resourceResponse(
            new AppRoleResource($appRole),
            __('messages.app_roles.created'),
            Response::HTTP_CREATED,
        );
    }

    public function show(AppRole $appRole): JsonResponse
    {
        $this->authorize('view', $appRole);

        return $this->resourceResponse(
            new AppRoleResource($this->appRoleService->find($appRole->id)),
            __('messages.app_roles.retrieved'),
        );
    }

    public function update(UpdateAppRoleRequest $request, AppRole $appRole): JsonResponse
    {
        $appRole = $this->appRoleService->update($appRole, $request->validated());

        return $this->resourceResponse(
            new AppRoleResource($appRole),
            __('messages.app_roles.updated'),
        );
    }

    public function destroy(AppRole $appRole): JsonResponse
    {
        $this->authorize('delete', $appRole);

        $this->appRoleService->delete($appRole);

        return $this->successResponse(null, __('messages.app_roles.deleted'));
    }
}
