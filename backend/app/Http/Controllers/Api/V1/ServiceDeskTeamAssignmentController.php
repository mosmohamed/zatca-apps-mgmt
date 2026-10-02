<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\ServiceDeskTeamAssignment\StoreServiceDeskTeamAssignmentRequest;
use App\Http\Requests\ServiceDeskTeamAssignment\UpdateServiceDeskTeamAssignmentRequest;
use App\Http\Resources\ServiceDeskCategoryResource;
use App\Http\Resources\ServiceDeskTeamAssignmentResource;
use App\Models\ServiceDeskCategory;
use App\Models\ServiceDeskTeamAssignment;
use App\Models\User;
use App\Services\ServiceDeskEscalationMatrixExportService;
use App\Services\ServiceDeskTeamAssignmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;

class ServiceDeskTeamAssignmentController extends BaseApiController
{
    public function __construct(
        private readonly ServiceDeskTeamAssignmentService $infraTeamAssignmentService,
        private readonly ServiceDeskEscalationMatrixExportService $infraEscalationMatrixExportService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', ServiceDeskTeamAssignment::class);

        $filters = $this->listFilters($request, 'sort_order');
        $filters['service_desk_category_id'] = $request->filled('service_desk_category_id')
            ? $request->integer('service_desk_category_id')
            : null;
        $filters['service_desk_level_id'] = $request->filled('service_desk_level_id')
            ? $request->integer('service_desk_level_id')
            : null;
        $filters['user_id'] = $request->filled('user_id')
            ? $request->integer('user_id')
            : null;

        $paginator = $this->infraTeamAssignmentService->list($filters);

        return $this->paginatedResponse(
            $paginator,
            ServiceDeskTeamAssignmentResource::class,
            __('messages.service_desk_team_assignments.listed'),
        );
    }

    public function details(): JsonResponse
    {
        abort_unless(
            request()->user()?->can('service-desk-escalation-matrix.view') ?? false,
            403,
        );

        return $this->successResponse(
            $this->infraTeamAssignmentService->detailsCards(),
            __('messages.service_desk_teams_details.retrieved'),
        );
    }

    public function export(): BinaryFileResponse
    {
        abort_unless(
            request()->user()?->can('service-desk-escalation-matrix.view') ?? false,
            403,
        );

        /** @var User $user */
        $user = request()->user();

        return $this->infraEscalationMatrixExportService->downloadAll($user);
    }

    public function exportCategory(ServiceDeskCategory $infraCategory): BinaryFileResponse
    {
        abort_unless(
            request()->user()?->can('service-desk-escalation-matrix.view') ?? false,
            403,
        );

        /** @var User $user */
        $user = request()->user();

        return $this->infraEscalationMatrixExportService->downloadCategory($infraCategory, $user);
    }

    public function statistics(): JsonResponse
    {
        $this->authorize('viewAny', ServiceDeskTeamAssignment::class);

        return $this->successResponse(
            $this->infraTeamAssignmentService->statistics(),
            __('messages.service_desk_team_assignments.statistics_retrieved'),
        );
    }

    public function categoriesSummary(Request $request): JsonResponse
    {
        $this->authorize('viewAny', ServiceDeskTeamAssignment::class);

        $filters = $this->listFilters($request, '-assignments_count');
        $paginator = $this->infraTeamAssignmentService->categoriesSummary($filters);

        return $this->paginatedResponse(
            $paginator,
            ServiceDeskCategoryResource::class,
            __('messages.service_desk_team_assignments.categories_listed'),
        );
    }

    public function categoryMatrix(ServiceDeskCategory $infraCategory): JsonResponse
    {
        $this->authorize('viewAny', ServiceDeskTeamAssignment::class);

        $category = $this->infraTeamAssignmentService->categoryMatrix($infraCategory->id);

        return $this->resourceResponse(
            new ServiceDeskCategoryResource($category),
            __('messages.service_desk_team_assignments.category_retrieved'),
        );
    }

    public function store(StoreServiceDeskTeamAssignmentRequest $request): JsonResponse
    {
        $assignments = $this->infraTeamAssignmentService->createMany($request->validated());

        return $this->successResponse(
            ServiceDeskTeamAssignmentResource::collection($assignments)->resolve(),
            __('messages.service_desk_team_assignments.created'),
            Response::HTTP_CREATED,
        );
    }

    public function show(ServiceDeskTeamAssignment $infraTeamAssignment): JsonResponse
    {
        $this->authorize('view', $infraTeamAssignment);

        return $this->resourceResponse(
            new ServiceDeskTeamAssignmentResource(
                $this->infraTeamAssignmentService->find($infraTeamAssignment->id)
            ),
            __('messages.service_desk_team_assignments.retrieved'),
        );
    }

    public function update(
        UpdateServiceDeskTeamAssignmentRequest $request,
        ServiceDeskTeamAssignment $infraTeamAssignment,
    ): JsonResponse {
        $assignment = $this->infraTeamAssignmentService->update(
            $infraTeamAssignment,
            $request->validated(),
        );

        return $this->resourceResponse(
            new ServiceDeskTeamAssignmentResource($assignment),
            __('messages.service_desk_team_assignments.updated'),
        );
    }

    public function destroy(ServiceDeskTeamAssignment $infraTeamAssignment): JsonResponse
    {
        $this->authorize('delete', $infraTeamAssignment);

        $this->infraTeamAssignmentService->delete($infraTeamAssignment);

        return $this->successResponse(null, __('messages.service_desk_team_assignments.deleted'));
    }
}
