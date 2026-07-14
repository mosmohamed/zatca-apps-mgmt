<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Application\StoreApplicationRequest;
use App\Http\Requests\Application\UpdateApplicationRequest;
use App\Http\Resources\ApplicationResource;
use App\Models\Application;
use App\Models\User;
use App\Services\ApplicationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ApplicationController extends BaseApiController
{
    public function __construct(
        private readonly ApplicationService $applicationService,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Application::class);

        $paginator = $this->applicationService->list(
            $this->listFilters($request, '-created_at')
        );

        return $this->paginatedResponse(
            $paginator,
            ApplicationResource::class,
            __('messages.applications.listed'),
        );
    }

    public function store(StoreApplicationRequest $request): JsonResponse
    {
        /** @var User $actor */
        $actor = $request->user();

        $application = $this->applicationService->create($request->validated(), $actor);

        return $this->resourceResponse(
            new ApplicationResource($application),
            __('messages.applications.created'),
            Response::HTTP_CREATED,
        );
    }

    public function show(Application $application): JsonResponse
    {
        $this->authorize('view', $application);

        return $this->resourceResponse(
            new ApplicationResource($this->applicationService->find($application->id)),
            __('messages.applications.retrieved'),
        );
    }

    public function update(UpdateApplicationRequest $request, Application $application): JsonResponse
    {
        /** @var User $actor */
        $actor = $request->user();

        $application = $this->applicationService->update($application, $request->validated(), $actor);

        return $this->resourceResponse(
            new ApplicationResource($application),
            __('messages.applications.updated'),
        );
    }

    public function destroy(Application $application): JsonResponse
    {
        $this->authorize('delete', $application);

        $this->applicationService->delete($application);

        return $this->successResponse(null, __('messages.applications.deleted'));
    }
}
