<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\ApplicationInfrastructure\CopyApplicationEnvironmentRequest;
use App\Http\Requests\ApplicationInfrastructure\UpsertApplicationEnvironmentRequest;
use App\Http\Resources\ApplicationEnvironmentResource;
use App\Http\Resources\ApplicationInfrastructureResource;
use App\Models\Application;
use App\Models\ApplicationEnvironment;
use App\Models\Environment;
use App\Models\User;
use App\Services\ApplicationInfrastructureService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApplicationInfrastructureController extends BaseApiController
{
    public function __construct(
        private readonly ApplicationInfrastructureService $applicationInfrastructureService,
    ) {
    }

    public function show(Application $application): JsonResponse
    {
        $this->authorize('viewAny', ApplicationEnvironment::class);

        return $this->resourceResponse(
            new ApplicationInfrastructureResource(
                $this->applicationInfrastructureService->getInfrastructure($application)
            ),
            __('messages.application_infrastructure.retrieved'),
        );
    }

    public function update(
        UpsertApplicationEnvironmentRequest $request,
        Application $application,
        Environment $environment,
    ): JsonResponse {
        $profile = $this->applicationInfrastructureService->upsertProfile(
            $application,
            $environment,
            $request->validated(),
            $this->currentUser($request),
        );

        return $this->resourceResponse(
            new ApplicationEnvironmentResource($profile),
            __('messages.application_infrastructure.environment_updated'),
        );
    }

    public function destroy(Application $application, Environment $environment): JsonResponse
    {
        $this->authorize('delete', ApplicationEnvironment::class);

        $this->applicationInfrastructureService->deleteProfile($application, $environment);

        return $this->successResponse(
            null,
            __('messages.application_infrastructure.environment_deleted'),
        );
    }

    public function copyEnvironment(
        CopyApplicationEnvironmentRequest $request,
        Application $application,
    ): JsonResponse {
        $profile = $this->applicationInfrastructureService->copyEnvironment(
            $application,
            (int) $request->validated('source_environment_id'),
            (int) $request->validated('target_environment_id'),
            (bool) $request->validated('overwrite', false),
            $this->currentUser($request),
        );

        return $this->resourceResponse(
            new ApplicationEnvironmentResource($profile),
            __('messages.application_infrastructure.environment_copied'),
        );
    }

    private function currentUser(Request $request): User
    {
        /** @var User $user */
        $user = $request->user();

        return $user;
    }
}
