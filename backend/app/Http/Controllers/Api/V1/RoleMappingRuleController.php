<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\RoleMappingRule\StoreRoleMappingRuleRequest;
use App\Http\Requests\RoleMappingRule\UpdateRoleMappingRuleRequest;
use App\Http\Resources\RoleMappingRuleResource;
use App\Models\RoleMappingRule;
use App\Services\RoleMappingRuleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMappingRuleController extends BaseApiController
{
    public function __construct(private readonly RoleMappingRuleService $service) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', RoleMappingRule::class);

        return $this->paginatedResponse(
            $this->service->list($this->listFilters($request, '-priority')),
            RoleMappingRuleResource::class,
            __('messages.role_mappings.listed'),
        );
    }

    public function store(StoreRoleMappingRuleRequest $request): JsonResponse
    {
        return $this->resourceResponse(
            new RoleMappingRuleResource($this->service->create($request->validated())),
            __('messages.role_mappings.created'),
            Response::HTTP_CREATED,
        );
    }

    public function show(RoleMappingRule $roleMapping): JsonResponse
    {
        $this->authorize('view', $roleMapping);

        return $this->resourceResponse(
            new RoleMappingRuleResource($roleMapping->load(['identityProvider', 'role'])),
            __('messages.role_mappings.retrieved'),
        );
    }

    public function update(
        UpdateRoleMappingRuleRequest $request,
        RoleMappingRule $roleMapping,
    ): JsonResponse {
        return $this->resourceResponse(
            new RoleMappingRuleResource($this->service->update($roleMapping, $request->validated())),
            __('messages.role_mappings.updated'),
        );
    }

    public function destroy(RoleMappingRule $roleMapping): JsonResponse
    {
        $this->authorize('delete', $roleMapping);
        $this->service->delete($roleMapping);

        return $this->successResponse(null, __('messages.role_mappings.deleted'));
    }
}
