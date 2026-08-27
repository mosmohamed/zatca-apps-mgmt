<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\InfraLicense\StoreInfraLicenseRequest;
use App\Http\Requests\InfraLicense\UpdateInfraLicenseRequest;
use App\Http\Resources\InfraLicenseResource;
use App\Models\InfraLicense;
use App\Services\InfraLicenseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class InfraLicenseController extends BaseApiController
{
    public function __construct(
        private readonly InfraLicenseService $infraLicenseService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', InfraLicense::class);

        $filters = $this->listFilters($request, 'name');

        $environment = $request->query('environment');
        $status = $request->query('status');

        $filters['environment'] = is_string($environment) ? $environment : null;
        $filters['status'] = is_string($status) ? $status : null;

        $paginator = $this->infraLicenseService->list($filters);

        return $this->paginatedResponse(
            $paginator,
            InfraLicenseResource::class,
            __('messages.infra_licenses.listed'),
        );
    }

    public function statistics(): JsonResponse
    {
        $this->authorize('viewAny', InfraLicense::class);

        return $this->successResponse(
            $this->infraLicenseService->statistics(),
            __('messages.infra_licenses.stats'),
        );
    }

    public function store(StoreInfraLicenseRequest $request): JsonResponse
    {
        $infraLicense = $this->infraLicenseService->create($request->validated());

        return $this->resourceResponse(
            new InfraLicenseResource($infraLicense),
            __('messages.infra_licenses.created'),
            Response::HTTP_CREATED,
        );
    }

    public function show(InfraLicense $infraLicense): JsonResponse
    {
        $this->authorize('view', $infraLicense);

        return $this->resourceResponse(
            new InfraLicenseResource($this->infraLicenseService->find($infraLicense->id)),
            __('messages.infra_licenses.retrieved'),
        );
    }

    public function update(UpdateInfraLicenseRequest $request, InfraLicense $infraLicense): JsonResponse
    {
        $infraLicense = $this->infraLicenseService->update($infraLicense, $request->validated());

        return $this->resourceResponse(
            new InfraLicenseResource($infraLicense),
            __('messages.infra_licenses.updated'),
        );
    }

    public function destroy(InfraLicense $infraLicense): JsonResponse
    {
        $this->authorize('delete', $infraLicense);

        $this->infraLicenseService->delete($infraLicense);

        return $this->successResponse(null, __('messages.infra_licenses.deleted'));
    }
}
