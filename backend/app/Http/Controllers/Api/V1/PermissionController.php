<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\PermissionResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;
use Symfony\Component\HttpFoundation\Response;

class PermissionController extends BaseApiController
{
    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()?->can('permissions.view'), Response::HTTP_FORBIDDEN, __('messages.auth.forbidden'));

        $permissions = Permission::query()->orderBy('name')->get();

        return $this->successResponse(
            PermissionResource::collection($permissions)->resolve(),
            __('messages.permissions.listed'),
        );
    }
}
