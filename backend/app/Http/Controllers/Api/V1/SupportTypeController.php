<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\SupportType\StoreSupportTypeRequest;
use App\Http\Requests\SupportType\UpdateSupportTypeRequest;
use App\Http\Resources\SupportTypeResource;
use App\Models\SupportType;
use App\Services\SupportTypeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SupportTypeController extends BaseApiController
{
    public function __construct(
        private readonly SupportTypeService $supportTypeService,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', SupportType::class);

        $paginator = $this->supportTypeService->list(
            $this->listFilters($request, 'name_en')
        );

        return $this->paginatedResponse(
            $paginator,
            SupportTypeResource::class,
            __('messages.support_types.listed'),
        );
    }

    public function store(StoreSupportTypeRequest $request): JsonResponse
    {
        $supportType = $this->supportTypeService->create($request->validated());

        return $this->resourceResponse(
            new SupportTypeResource($supportType),
            __('messages.support_types.created'),
            Response::HTTP_CREATED,
        );
    }

    public function show(SupportType $supportType): JsonResponse
    {
        $this->authorize('view', $supportType);

        return $this->resourceResponse(
            new SupportTypeResource($this->supportTypeService->find($supportType->id)),
            __('messages.support_types.retrieved'),
        );
    }

    public function update(UpdateSupportTypeRequest $request, SupportType $supportType): JsonResponse
    {
        $supportType = $this->supportTypeService->update($supportType, $request->validated());

        return $this->resourceResponse(
            new SupportTypeResource($supportType),
            __('messages.support_types.updated'),
        );
    }

    public function destroy(SupportType $supportType): JsonResponse
    {
        $this->authorize('delete', $supportType);

        $this->supportTypeService->delete($supportType);

        return $this->successResponse(null, __('messages.support_types.deleted'));
    }
}
