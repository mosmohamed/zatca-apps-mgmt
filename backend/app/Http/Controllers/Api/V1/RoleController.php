<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Role\StoreRoleRequest;
use App\Http\Requests\Role\SyncRolePermissionsRequest;
use App\Http\Requests\Role\UpdateRoleRequest;
use App\Http\Resources\RoleResource;
use App\Services\RoleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;
use Spatie\Permission\Models\Role;
use Symfony\Component\HttpFoundation\Response;

class RoleController extends BaseApiController
{
    public function __construct(
        private readonly RoleService $roleService,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()?->can('roles.view'), Response::HTTP_FORBIDDEN, __('messages.auth.forbidden'));

        return $this->successResponse(
            RoleResource::collection($this->roleService->list())->resolve(),
            __('messages.roles.listed'),
        );
    }

    public function store(StoreRoleRequest $request): JsonResponse
    {
        $role = $this->roleService->create($request->validated());

        return $this->resourceResponse(
            new RoleResource($role),
            __('messages.roles.created'),
            Response::HTTP_CREATED,
        );
    }

    public function show(Request $request, Role $role): JsonResponse
    {
        abort_unless($request->user()?->can('roles.view'), Response::HTTP_FORBIDDEN, __('messages.auth.forbidden'));

        return $this->resourceResponse(
            new RoleResource($this->roleService->find($role->id)),
            __('messages.roles.retrieved'),
        );
    }

    public function update(UpdateRoleRequest $request, Role $role): JsonResponse
    {
        try {
            $role = $this->roleService->updateName($role, (string) $request->validated('name'));
        } catch (RuntimeException) {
            return $this->errorResponse(__('messages.roles.protected'), null, Response::HTTP_FORBIDDEN);
        }

        return $this->resourceResponse(
            new RoleResource($role),
            __('messages.roles.updated'),
        );
    }

    public function updatePermissions(SyncRolePermissionsRequest $request, Role $role): JsonResponse
    {
        $role = $this->roleService->syncPermissions($role, (array) $request->validated('permissions'));

        return $this->resourceResponse(
            new RoleResource($role),
            __('messages.roles.permissions_updated'),
        );
    }

    public function destroy(Request $request, Role $role): JsonResponse
    {
        abort_unless($request->user()?->can('roles.delete'), Response::HTTP_FORBIDDEN, __('messages.auth.forbidden'));

        try {
            $this->roleService->delete($role);
        } catch (RuntimeException) {
            return $this->errorResponse(__('messages.roles.protected'), null, Response::HTTP_FORBIDDEN);
        }

        return $this->successResponse(null, __('messages.roles.deleted'));
    }
}
