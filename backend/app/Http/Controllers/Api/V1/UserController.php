<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class UserController extends BaseApiController
{
    public function __construct(
        private readonly UserService $userService,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        $paginator = $this->userService->list(
            $this->listFilters($request, '-created_at')
        );

        return $this->paginatedResponse(
            $paginator,
            UserResource::class,
            __('messages.users.listed'),
        );
    }


    public function statistics(): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        return $this->successResponse(
            $this->userService->statistics(),
            __('messages.users.stats'),
        );
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        /** @var User $actor */
        $actor = $request->user();

        $user = $this->userService->create($request->validated(), $actor);

        return $this->resourceResponse(
            new UserResource($user),
            __('messages.users.created'),
            Response::HTTP_CREATED,
        );
    }

    public function show(User $user): JsonResponse
    {
        $this->authorize('view', $user);

        return $this->resourceResponse(
            new UserResource($this->userService->find($user->id)),
            __('messages.users.retrieved'),
        );
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        /** @var User $actor */
        $actor = $request->user();

        $user = $this->userService->update($user, $request->validated(), $actor);

        return $this->resourceResponse(
            new UserResource($user),
            __('messages.users.updated'),
        );
    }

    public function destroy(User $user): JsonResponse
    {
        $this->authorize('delete', $user);

        $this->userService->delete($user);

        return $this->successResponse(null, __('messages.users.deleted'));
    }
}
