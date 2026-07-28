<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\ApplicationPreviewResource;
use App\Http\Resources\DepartmentPreviewResource;
use App\Http\Resources\UserPreviewResource;
use App\Http\Resources\VendorPreviewResource;
use App\Models\Application;
use App\Models\Department;
use App\Models\User;
use App\Models\Vendor;
use App\Services\EntityPreviewService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EntityPreviewController extends BaseApiController
{
    public function __construct(
        private readonly EntityPreviewService $previewService,
    ) {
    }

    public function userByName(Request $request): JsonResponse
    {
        abort_unless(
            $request->user()?->can('users.view') ?? false,
            Response::HTTP_FORBIDDEN,
            __('messages.auth.forbidden'),
        );

        $name = trim((string) $request->query('name', ''));
        $user = $this->previewService->findUserByDisplayName($name);

        if ($user === null) {
            return $this->successResponse(
                null,
                __('messages.previews.user_not_found'),
            );
        }

        $this->authorize('view', $user);

        return $this->resourceResponse(
            new UserPreviewResource($this->previewService->user($user)),
            __('messages.previews.user_retrieved'),
        );
    }

    public function user(User $user): JsonResponse
    {
        $this->authorize('view', $user);

        return $this->resourceResponse(
            new UserPreviewResource($this->previewService->user($user)),
            __('messages.previews.user_retrieved'),
        );
    }

    public function vendor(Vendor $vendor): JsonResponse
    {
        $this->authorize('view', $vendor);

        return $this->resourceResponse(
            new VendorPreviewResource($this->previewService->vendor($vendor)),
            __('messages.previews.vendor_retrieved'),
        );
    }

    public function application(Application $application): JsonResponse
    {
        $this->authorize('view', $application);

        return $this->resourceResponse(
            new ApplicationPreviewResource($this->previewService->application($application)),
            __('messages.previews.application_retrieved'),
        );
    }

    public function department(Department $department): JsonResponse
    {
        $this->authorize('view', $department);

        return $this->resourceResponse(
            new DepartmentPreviewResource($this->previewService->department($department)),
            __('messages.previews.department_retrieved'),
        );
    }
}
