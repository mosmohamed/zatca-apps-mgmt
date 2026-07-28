<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\ApplicationAssignment\StoreApplicationAssignmentRequest;
use App\Http\Requests\ApplicationAssignment\StoreBulkApplicationAssignmentRequest;
use App\Http\Requests\ApplicationAssignment\UpdateApplicationAssignmentRequest;
use App\Http\Resources\ApplicationAssignmentResource;
use App\Http\Resources\ApplicationAssignmentSummaryResource;
use App\Http\Resources\ApplicationResource;
use App\Models\Application;
use App\Models\ApplicationAssignment;
use App\Models\User;
use App\Services\AssignmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AssignmentController extends BaseApiController
{
    public function __construct(
        private readonly AssignmentService $assignmentService,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', ApplicationAssignment::class);

        $filters = $this->listFilters($request, '-assigned_at');
        $filters['application_id'] = $request->filled('application_id') ? $request->integer('application_id') : null;
        $filters['user_id'] = $request->filled('user_id') ? $request->integer('user_id') : null;
        $filters['open_only'] = $request->boolean('open_only');

        $paginator = $this->assignmentService->list($filters);

        return $this->paginatedResponse(
            $paginator,
            ApplicationAssignmentResource::class,
            __('messages.assignments.listed'),
        );
    }

    public function applicationsSummary(Request $request): JsonResponse
    {
        $this->authorize('viewAny', ApplicationAssignment::class);

        $paginator = $this->assignmentService->applicationsSummary(
            $this->listFilters($request, 'name_en')
        );

        return $this->paginatedResponse(
            $paginator,
            ApplicationAssignmentSummaryResource::class,
            __('messages.assignments.summary_listed'),
        );
    }

    public function applicationMatrix(Application $application): JsonResponse
    {
        $this->authorize('viewAny', ApplicationAssignment::class);

        $matrix = $this->assignmentService->applicationMatrix($application->id);

        return $this->resourceResponse(
            new ApplicationResource($matrix),
            __('messages.assignments.matrix_retrieved'),
        );
    }

    public function bulkStore(StoreBulkApplicationAssignmentRequest $request): JsonResponse
    {
        /** @var User $actor */
        $actor = $request->user();

        $assignments = $this->assignmentService->assignMultiple(
            (int) $request->validated('application_id'),
            $request->validated('users'),
            $actor,
        );

        return $this->successResponse(
            ApplicationAssignmentResource::collection($assignments)->resolve(),
            __('messages.assignments.bulk_created'),
            Response::HTTP_CREATED,
        );
    }


    public function statistics(): JsonResponse
    {
        $this->authorize('viewAny', ApplicationAssignment::class);

        return $this->successResponse(
            $this->assignmentService->statistics(),
            __('messages.assignments.stats'),
        );
    }

    public function store(StoreApplicationAssignmentRequest $request): JsonResponse
    {
        /** @var User $actor */
        $actor = $request->user();

        $assignment = $this->assignmentService->assign($request->validated(), $actor);

        return $this->resourceResponse(
            new ApplicationAssignmentResource($assignment),
            __('messages.assignments.created'),
            Response::HTTP_CREATED,
        );
    }

    public function show(ApplicationAssignment $assignment): JsonResponse
    {
        $this->authorize('view', $assignment);

        return $this->resourceResponse(
            new ApplicationAssignmentResource($this->assignmentService->find($assignment->id)),
            __('messages.assignments.retrieved'),
        );
    }

    public function update(UpdateApplicationAssignmentRequest $request, ApplicationAssignment $assignment): JsonResponse
    {
        $assignment = $this->assignmentService->update($assignment, $request->validated());

        return $this->resourceResponse(
            new ApplicationAssignmentResource($assignment),
            __('messages.assignments.updated'),
        );
    }

    public function destroy(ApplicationAssignment $assignment): JsonResponse
    {
        $this->authorize('delete', $assignment);

        $this->assignmentService->delete($assignment);

        return $this->successResponse(null, __('messages.assignments.deleted'));
    }
}
