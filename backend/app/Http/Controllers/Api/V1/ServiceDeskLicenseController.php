<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\ServiceDeskLicense\StoreServiceDeskLicenseRequest;
use App\Http\Requests\ServiceDeskLicense\UpdateServiceDeskLicenseRequest;
use App\Http\Resources\ServiceDeskLicenseResource;
use App\Models\ServiceDeskLicense;
use App\Services\ServiceDeskLicenseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ServiceDeskLicenseController extends BaseApiController
{
    public function __construct(
        private readonly ServiceDeskLicenseService $serviceDeskLicenseService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', ServiceDeskLicense::class);

        $filters = $this->listFilters($request, 'name');

        $environment = $request->query('environment');
        $status = $request->query('status');

        $filters['environment'] = is_string($environment) ? $environment : null;
        $filters['status'] = is_string($status) ? $status : null;

        $paginator = $this->serviceDeskLicenseService->list($filters);

        return $this->paginatedResponse(
            $paginator,
            ServiceDeskLicenseResource::class,
            __('messages.service_desk_licenses.listed'),
        );
    }

    public function statistics(): JsonResponse
    {
        $this->authorize('viewAny', ServiceDeskLicense::class);

        return $this->successResponse(
            $this->serviceDeskLicenseService->statistics(),
            __('messages.service_desk_licenses.stats'),
        );
    }

    public function store(StoreServiceDeskLicenseRequest $request): JsonResponse
    {
        $serviceDeskLicense = $this->serviceDeskLicenseService->create($request->validated());

        return $this->resourceResponse(
            new ServiceDeskLicenseResource($serviceDeskLicense),
            __('messages.service_desk_licenses.created'),
            Response::HTTP_CREATED,
        );
    }

    public function show(ServiceDeskLicense $serviceDeskLicense): JsonResponse
    {
        $this->authorize('view', $serviceDeskLicense);

        return $this->resourceResponse(
            new ServiceDeskLicenseResource($this->serviceDeskLicenseService->find($serviceDeskLicense->id)),
            __('messages.service_desk_licenses.retrieved'),
        );
    }

    public function update(
        UpdateServiceDeskLicenseRequest $request,
        ServiceDeskLicense $serviceDeskLicense,
    ): JsonResponse {
        $serviceDeskLicense = $this->serviceDeskLicenseService->update($serviceDeskLicense, $request->validated());

        return $this->resourceResponse(
            new ServiceDeskLicenseResource($serviceDeskLicense),
            __('messages.service_desk_licenses.updated'),
        );
    }

    public function destroy(ServiceDeskLicense $serviceDeskLicense): JsonResponse
    {
        $this->authorize('delete', $serviceDeskLicense);

        $this->serviceDeskLicenseService->delete($serviceDeskLicense);

        return $this->successResponse(null, __('messages.service_desk_licenses.deleted'));
    }
}
