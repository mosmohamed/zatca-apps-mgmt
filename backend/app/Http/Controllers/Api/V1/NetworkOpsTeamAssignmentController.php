<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\NetworkOpsTeamAssignment\StoreNetworkOpsTeamAssignmentRequest;
use App\Http\Requests\NetworkOpsTeamAssignment\UpdateNetworkOpsTeamAssignmentRequest;
use App\Http\Resources\NetworkOpsCategoryResource;
use App\Http\Resources\NetworkOpsTeamAssignmentResource;
use App\Models\NetworkOpsCategory;
use App\Models\NetworkOpsTeamAssignment;
use App\Models\User;
use App\Services\NetworkOpsEscalationMatrixExportService;
use App\Services\NetworkOpsTeamAssignmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;

class NetworkOpsTeamAssignmentController extends BaseApiController
{
    public function __construct(
        private readonly NetworkOpsTeamAssignmentService $infraTeamAssignmentService,
        private readonly NetworkOpsEscalationMatrixExportService $infraEscalationMatrixExportService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', NetworkOpsTeamAssignment::class);

        $filters = $this->listFilters($request, 'sort_order');
        $filters['network_ops_category_id'] = $request->filled('network_ops_category_id')
            ? $request->integer('network_ops_category_id')
            : null;
        $filters['network_ops_level_id'] = $request->filled('network_ops_level_id')
            ? $request->integer('network_ops_level_id')
            : null;
        $filters['user_id'] = $request->filled('user_id')
            ? $request->integer('user_id')
            : null;

        $paginator = $this->infraTeamAssignmentService->list($filters);

        return $this->paginatedResponse(
            $paginator,
            NetworkOpsTeamAssignmentResource::class,
            __('messages.network_ops_team_assignments.listed'),
        );
    }

    public function details(): JsonResponse
    {
        abort_unless(
            request()->user()?->can('network-ops-escalation-matrix.view') ?? false,
            403,
        );

        return $this->successResponse(
            $this->infraTeamAssignmentService->detailsCards(),
            __('messages.network_ops_teams_details.retrieved'),
        );
    }

    public function export(): BinaryFileResponse
    {
        abort_unless(
            request()->user()?->can('network-ops-escalation-matrix.view') ?? false,
            403,
        );

        /** @var User $user */
        $user = request()->user();

        return $this->infraEscalationMatrixExportService->downloadAll($user);
    }

    public function exportCategory(NetworkOpsCategory $infraCategory): BinaryFileResponse
    {
        abort_unless(
            request()->user()?->can('network-ops-escalation-matrix.view') ?? false,
            403,
        );

        /** @var User $user */
        $user = request()->user();

        return $this->infraEscalationMatrixExportService->downloadCategory($infraCategory, $user);
    }

    public function statistics(): JsonResponse
    {
        $this->authorize('viewAny', NetworkOpsTeamAssignment::class);

        return $this->successResponse(
            $this->infraTeamAssignmentService->statistics(),
            __('messages.network_ops_team_assignments.statistics_retrieved'),
        );
    }

    public function categoriesSummary(Request $request): JsonResponse
    {
        $this->authorize('viewAny', NetworkOpsTeamAssignment::class);

        $filters = $this->listFilters($request, '-assignments_count');
        $paginator = $this->infraTeamAssignmentService->categoriesSummary($filters);

        return $this->paginatedResponse(
            $paginator,
            NetworkOpsCategoryResource::class,
            __('messages.network_ops_team_assignments.categories_listed'),
        );
    }

    public function categoryMatrix(NetworkOpsCategory $infraCategory): JsonResponse
    {
        $this->authorize('viewAny', NetworkOpsTeamAssignment::class);

        $category = $this->infraTeamAssignmentService->categoryMatrix($infraCategory->id);

        return $this->resourceResponse(
            new NetworkOpsCategoryResource($category),
            __('messages.network_ops_team_assignments.category_retrieved'),
        );
    }

    public function store(StoreNetworkOpsTeamAssignmentRequest $request): JsonResponse
    {
        $assignments = $this->infraTeamAssignmentService->createMany($request->validated());

        return $this->successResponse(
            NetworkOpsTeamAssignmentResource::collection($assignments)->resolve(),
            __('messages.network_ops_team_assignments.created'),
            Response::HTTP_CREATED,
        );
    }

    public function show(NetworkOpsTeamAssignment $infraTeamAssignment): JsonResponse
    {
        $this->authorize('view', $infraTeamAssignment);

        return $this->resourceResponse(
            new NetworkOpsTeamAssignmentResource(
                $this->infraTeamAssignmentService->find($infraTeamAssignment->id)
            ),
            __('messages.network_ops_team_assignments.retrieved'),
        );
    }

    public function update(
        UpdateNetworkOpsTeamAssignmentRequest $request,
        NetworkOpsTeamAssignment $infraTeamAssignment,
    ): JsonResponse {
        $assignment = $this->infraTeamAssignmentService->update(
            $infraTeamAssignment,
            $request->validated(),
        );

        return $this->resourceResponse(
            new NetworkOpsTeamAssignmentResource($assignment),
            __('messages.network_ops_team_assignments.updated'),
        );
    }

    public function destroy(NetworkOpsTeamAssignment $infraTeamAssignment): JsonResponse
    {
        $this->authorize('delete', $infraTeamAssignment);

        $this->infraTeamAssignmentService->delete($infraTeamAssignment);

        return $this->successResponse(null, __('messages.network_ops_team_assignments.deleted'));
    }
}
