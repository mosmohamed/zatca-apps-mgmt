<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\InfraTeamAssignment\StoreInfraTeamAssignmentRequest;
use App\Http\Requests\InfraTeamAssignment\UpdateInfraTeamAssignmentRequest;
use App\Http\Resources\InfraCategoryResource;
use App\Http\Resources\InfraTeamAssignmentResource;
use App\Models\InfraCategory;
use App\Models\InfraTeamAssignment;
use App\Models\User;
use App\Services\InfraEscalationMatrixExportService;
use App\Services\InfraTeamAssignmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;

class InfraTeamAssignmentController extends BaseApiController
{
    public function __construct(
        private readonly InfraTeamAssignmentService $infraTeamAssignmentService,
        private readonly InfraEscalationMatrixExportService $infraEscalationMatrixExportService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', InfraTeamAssignment::class);

        $filters = $this->listFilters($request, 'sort_order');
        $filters['infra_category_id'] = $request->filled('infra_category_id')
            ? $request->integer('infra_category_id')
            : null;
        $filters['infra_level_id'] = $request->filled('infra_level_id')
            ? $request->integer('infra_level_id')
            : null;
        $filters['user_id'] = $request->filled('user_id')
            ? $request->integer('user_id')
            : null;

        $paginator = $this->infraTeamAssignmentService->list($filters);

        return $this->paginatedResponse(
            $paginator,
            InfraTeamAssignmentResource::class,
            __('messages.infra_team_assignments.listed'),
        );
    }

    public function details(): JsonResponse
    {
        abort_unless(
            request()->user()?->can('infra-escalation-matrix.view') ?? false,
            403,
        );

        return $this->successResponse(
            $this->infraTeamAssignmentService->detailsCards(),
            __('messages.infra_teams_details.retrieved'),
        );
    }

    public function export(): BinaryFileResponse
    {
        abort_unless(
            request()->user()?->can('infra-escalation-matrix.view') ?? false,
            403,
        );

        /** @var User $user */
        $user = request()->user();

        return $this->infraEscalationMatrixExportService->downloadAll($user);
    }

    public function exportCategory(InfraCategory $infraCategory): BinaryFileResponse
    {
        abort_unless(
            request()->user()?->can('infra-escalation-matrix.view') ?? false,
            403,
        );

        /** @var User $user */
        $user = request()->user();

        return $this->infraEscalationMatrixExportService->downloadCategory($infraCategory, $user);
    }

    public function statistics(): JsonResponse
    {
        $this->authorize('viewAny', InfraTeamAssignment::class);

        return $this->successResponse(
            $this->infraTeamAssignmentService->statistics(),
            __('messages.infra_team_assignments.statistics_retrieved'),
        );
    }

    public function categoriesSummary(Request $request): JsonResponse
    {
        $this->authorize('viewAny', InfraTeamAssignment::class);

        $filters = $this->listFilters($request, '-assignments_count');
        $paginator = $this->infraTeamAssignmentService->categoriesSummary($filters);

        return $this->paginatedResponse(
            $paginator,
            InfraCategoryResource::class,
            __('messages.infra_team_assignments.categories_listed'),
        );
    }

    public function categoryMatrix(InfraCategory $infraCategory): JsonResponse
    {
        $this->authorize('viewAny', InfraTeamAssignment::class);

        $category = $this->infraTeamAssignmentService->categoryMatrix($infraCategory->id);

        return $this->resourceResponse(
            new InfraCategoryResource($category),
            __('messages.infra_team_assignments.category_retrieved'),
        );
    }

    public function store(StoreInfraTeamAssignmentRequest $request): JsonResponse
    {
        $assignments = $this->infraTeamAssignmentService->createMany($request->validated());

        return $this->successResponse(
            InfraTeamAssignmentResource::collection($assignments)->resolve(),
            __('messages.infra_team_assignments.created'),
            Response::HTTP_CREATED,
        );
    }

    public function show(InfraTeamAssignment $infraTeamAssignment): JsonResponse
    {
        $this->authorize('view', $infraTeamAssignment);

        return $this->resourceResponse(
            new InfraTeamAssignmentResource(
                $this->infraTeamAssignmentService->find($infraTeamAssignment->id)
            ),
            __('messages.infra_team_assignments.retrieved'),
        );
    }

    public function update(
        UpdateInfraTeamAssignmentRequest $request,
        InfraTeamAssignment $infraTeamAssignment,
    ): JsonResponse {
        $assignment = $this->infraTeamAssignmentService->update(
            $infraTeamAssignment,
            $request->validated(),
        );

        return $this->resourceResponse(
            new InfraTeamAssignmentResource($assignment),
            __('messages.infra_team_assignments.updated'),
        );
    }

    public function destroy(InfraTeamAssignment $infraTeamAssignment): JsonResponse
    {
        $this->authorize('delete', $infraTeamAssignment);

        $this->infraTeamAssignmentService->delete($infraTeamAssignment);

        return $this->successResponse(null, __('messages.infra_team_assignments.deleted'));
    }
}
