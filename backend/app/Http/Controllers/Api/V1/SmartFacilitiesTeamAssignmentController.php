<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\SmartFacilitiesTeamAssignment\StoreSmartFacilitiesTeamAssignmentRequest;
use App\Http\Requests\SmartFacilitiesTeamAssignment\UpdateSmartFacilitiesTeamAssignmentRequest;
use App\Http\Resources\SmartFacilitiesCategoryResource;
use App\Http\Resources\SmartFacilitiesTeamAssignmentResource;
use App\Models\SmartFacilitiesCategory;
use App\Models\SmartFacilitiesTeamAssignment;
use App\Models\User;
use App\Services\SmartFacilitiesEscalationMatrixExportService;
use App\Services\SmartFacilitiesTeamAssignmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;

class SmartFacilitiesTeamAssignmentController extends BaseApiController
{
    public function __construct(
        private readonly SmartFacilitiesTeamAssignmentService $infraTeamAssignmentService,
        private readonly SmartFacilitiesEscalationMatrixExportService $infraEscalationMatrixExportService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', SmartFacilitiesTeamAssignment::class);

        $filters = $this->listFilters($request, 'sort_order');
        $filters['smart_facilities_category_id'] = $request->filled('smart_facilities_category_id')
            ? $request->integer('smart_facilities_category_id')
            : null;
        $filters['smart_facilities_level_id'] = $request->filled('smart_facilities_level_id')
            ? $request->integer('smart_facilities_level_id')
            : null;
        $filters['user_id'] = $request->filled('user_id')
            ? $request->integer('user_id')
            : null;

        $paginator = $this->infraTeamAssignmentService->list($filters);

        return $this->paginatedResponse(
            $paginator,
            SmartFacilitiesTeamAssignmentResource::class,
            __('messages.smart_facilities_team_assignments.listed'),
        );
    }

    public function details(): JsonResponse
    {
        abort_unless(
            request()->user()?->can('smart-facilities-escalation-matrix.view') ?? false,
            403,
        );

        return $this->successResponse(
            $this->infraTeamAssignmentService->detailsCards(),
            __('messages.smart_facilities_teams_details.retrieved'),
        );
    }

    public function export(): BinaryFileResponse
    {
        abort_unless(
            request()->user()?->can('smart-facilities-escalation-matrix.view') ?? false,
            403,
        );

        /** @var User $user */
        $user = request()->user();

        return $this->infraEscalationMatrixExportService->downloadAll($user);
    }

    public function exportCategory(SmartFacilitiesCategory $infraCategory): BinaryFileResponse
    {
        abort_unless(
            request()->user()?->can('smart-facilities-escalation-matrix.view') ?? false,
            403,
        );

        /** @var User $user */
        $user = request()->user();

        return $this->infraEscalationMatrixExportService->downloadCategory($infraCategory, $user);
    }

    public function statistics(): JsonResponse
    {
        $this->authorize('viewAny', SmartFacilitiesTeamAssignment::class);

        return $this->successResponse(
            $this->infraTeamAssignmentService->statistics(),
            __('messages.smart_facilities_team_assignments.statistics_retrieved'),
        );
    }

    public function categoriesSummary(Request $request): JsonResponse
    {
        $this->authorize('viewAny', SmartFacilitiesTeamAssignment::class);

        $filters = $this->listFilters($request, '-assignments_count');
        $paginator = $this->infraTeamAssignmentService->categoriesSummary($filters);

        return $this->paginatedResponse(
            $paginator,
            SmartFacilitiesCategoryResource::class,
            __('messages.smart_facilities_team_assignments.categories_listed'),
        );
    }

    public function categoryMatrix(SmartFacilitiesCategory $infraCategory): JsonResponse
    {
        $this->authorize('viewAny', SmartFacilitiesTeamAssignment::class);

        $category = $this->infraTeamAssignmentService->categoryMatrix($infraCategory->id);

        return $this->resourceResponse(
            new SmartFacilitiesCategoryResource($category),
            __('messages.smart_facilities_team_assignments.category_retrieved'),
        );
    }

    public function store(StoreSmartFacilitiesTeamAssignmentRequest $request): JsonResponse
    {
        $assignments = $this->infraTeamAssignmentService->createMany($request->validated());

        return $this->successResponse(
            SmartFacilitiesTeamAssignmentResource::collection($assignments)->resolve(),
            __('messages.smart_facilities_team_assignments.created'),
            Response::HTTP_CREATED,
        );
    }

    public function show(SmartFacilitiesTeamAssignment $infraTeamAssignment): JsonResponse
    {
        $this->authorize('view', $infraTeamAssignment);

        return $this->resourceResponse(
            new SmartFacilitiesTeamAssignmentResource(
                $this->infraTeamAssignmentService->find($infraTeamAssignment->id)
            ),
            __('messages.smart_facilities_team_assignments.retrieved'),
        );
    }

    public function update(
        UpdateSmartFacilitiesTeamAssignmentRequest $request,
        SmartFacilitiesTeamAssignment $infraTeamAssignment,
    ): JsonResponse {
        $assignment = $this->infraTeamAssignmentService->update(
            $infraTeamAssignment,
            $request->validated(),
        );

        return $this->resourceResponse(
            new SmartFacilitiesTeamAssignmentResource($assignment),
            __('messages.smart_facilities_team_assignments.updated'),
        );
    }

    public function destroy(SmartFacilitiesTeamAssignment $infraTeamAssignment): JsonResponse
    {
        $this->authorize('delete', $infraTeamAssignment);

        $this->infraTeamAssignmentService->delete($infraTeamAssignment);

        return $this->successResponse(null, __('messages.smart_facilities_team_assignments.deleted'));
    }
}
