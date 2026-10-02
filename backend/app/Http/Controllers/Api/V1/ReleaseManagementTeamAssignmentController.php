<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\ReleaseManagementTeamAssignment\StoreReleaseManagementTeamAssignmentRequest;
use App\Http\Requests\ReleaseManagementTeamAssignment\UpdateReleaseManagementTeamAssignmentRequest;
use App\Http\Resources\ReleaseManagementCategoryResource;
use App\Http\Resources\ReleaseManagementTeamAssignmentResource;
use App\Models\ReleaseManagementCategory;
use App\Models\ReleaseManagementTeamAssignment;
use App\Models\User;
use App\Services\ReleaseManagementEscalationMatrixExportService;
use App\Services\ReleaseManagementTeamAssignmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;

class ReleaseManagementTeamAssignmentController extends BaseApiController
{
    public function __construct(
        private readonly ReleaseManagementTeamAssignmentService $infraTeamAssignmentService,
        private readonly ReleaseManagementEscalationMatrixExportService $infraEscalationMatrixExportService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', ReleaseManagementTeamAssignment::class);

        $filters = $this->listFilters($request, 'sort_order');
        $filters['release_management_category_id'] = $request->filled('release_management_category_id')
            ? $request->integer('release_management_category_id')
            : null;
        $filters['release_management_level_id'] = $request->filled('release_management_level_id')
            ? $request->integer('release_management_level_id')
            : null;
        $filters['user_id'] = $request->filled('user_id')
            ? $request->integer('user_id')
            : null;

        $paginator = $this->infraTeamAssignmentService->list($filters);

        return $this->paginatedResponse(
            $paginator,
            ReleaseManagementTeamAssignmentResource::class,
            __('messages.release_management_team_assignments.listed'),
        );
    }

    public function details(): JsonResponse
    {
        abort_unless(
            request()->user()?->can('release-management-escalation-matrix.view') ?? false,
            403,
        );

        return $this->successResponse(
            $this->infraTeamAssignmentService->detailsCards(),
            __('messages.release_management_teams_details.retrieved'),
        );
    }

    public function export(): BinaryFileResponse
    {
        abort_unless(
            request()->user()?->can('release-management-escalation-matrix.view') ?? false,
            403,
        );

        /** @var User $user */
        $user = request()->user();

        return $this->infraEscalationMatrixExportService->downloadAll($user);
    }

    public function exportCategory(ReleaseManagementCategory $infraCategory): BinaryFileResponse
    {
        abort_unless(
            request()->user()?->can('release-management-escalation-matrix.view') ?? false,
            403,
        );

        /** @var User $user */
        $user = request()->user();

        return $this->infraEscalationMatrixExportService->downloadCategory($infraCategory, $user);
    }

    public function statistics(): JsonResponse
    {
        $this->authorize('viewAny', ReleaseManagementTeamAssignment::class);

        return $this->successResponse(
            $this->infraTeamAssignmentService->statistics(),
            __('messages.release_management_team_assignments.statistics_retrieved'),
        );
    }

    public function categoriesSummary(Request $request): JsonResponse
    {
        $this->authorize('viewAny', ReleaseManagementTeamAssignment::class);

        $filters = $this->listFilters($request, '-assignments_count');
        $paginator = $this->infraTeamAssignmentService->categoriesSummary($filters);

        return $this->paginatedResponse(
            $paginator,
            ReleaseManagementCategoryResource::class,
            __('messages.release_management_team_assignments.categories_listed'),
        );
    }

    public function categoryMatrix(ReleaseManagementCategory $infraCategory): JsonResponse
    {
        $this->authorize('viewAny', ReleaseManagementTeamAssignment::class);

        $category = $this->infraTeamAssignmentService->categoryMatrix($infraCategory->id);

        return $this->resourceResponse(
            new ReleaseManagementCategoryResource($category),
            __('messages.release_management_team_assignments.category_retrieved'),
        );
    }

    public function store(StoreReleaseManagementTeamAssignmentRequest $request): JsonResponse
    {
        $assignments = $this->infraTeamAssignmentService->createMany($request->validated());

        return $this->successResponse(
            ReleaseManagementTeamAssignmentResource::collection($assignments)->resolve(),
            __('messages.release_management_team_assignments.created'),
            Response::HTTP_CREATED,
        );
    }

    public function show(ReleaseManagementTeamAssignment $infraTeamAssignment): JsonResponse
    {
        $this->authorize('view', $infraTeamAssignment);

        return $this->resourceResponse(
            new ReleaseManagementTeamAssignmentResource(
                $this->infraTeamAssignmentService->find($infraTeamAssignment->id)
            ),
            __('messages.release_management_team_assignments.retrieved'),
        );
    }

    public function update(
        UpdateReleaseManagementTeamAssignmentRequest $request,
        ReleaseManagementTeamAssignment $infraTeamAssignment,
    ): JsonResponse {
        $assignment = $this->infraTeamAssignmentService->update(
            $infraTeamAssignment,
            $request->validated(),
        );

        return $this->resourceResponse(
            new ReleaseManagementTeamAssignmentResource($assignment),
            __('messages.release_management_team_assignments.updated'),
        );
    }

    public function destroy(ReleaseManagementTeamAssignment $infraTeamAssignment): JsonResponse
    {
        $this->authorize('delete', $infraTeamAssignment);

        $this->infraTeamAssignmentService->delete($infraTeamAssignment);

        return $this->successResponse(null, __('messages.release_management_team_assignments.deleted'));
    }
}
