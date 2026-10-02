<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\SmartFacilitiesLicense\StoreSmartFacilitiesLicenseRequest;
use App\Http\Requests\SmartFacilitiesLicense\UpdateSmartFacilitiesLicenseRequest;
use App\Http\Resources\SmartFacilitiesLicenseResource;
use App\Models\SmartFacilitiesLicense;
use App\Services\SmartFacilitiesLicenseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SmartFacilitiesLicenseController extends BaseApiController
{
    public function __construct(
        private readonly SmartFacilitiesLicenseService $smartFacilitiesLicenseService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', SmartFacilitiesLicense::class);

        $filters = $this->listFilters($request, 'name');

        $environment = $request->query('environment');
        $status = $request->query('status');

        $filters['environment'] = is_string($environment) ? $environment : null;
        $filters['status'] = is_string($status) ? $status : null;

        $paginator = $this->smartFacilitiesLicenseService->list($filters);

        return $this->paginatedResponse(
            $paginator,
            SmartFacilitiesLicenseResource::class,
            __('messages.smart_facilities_licenses.listed'),
        );
    }

    public function statistics(): JsonResponse
    {
        $this->authorize('viewAny', SmartFacilitiesLicense::class);

        return $this->successResponse(
            $this->smartFacilitiesLicenseService->statistics(),
            __('messages.smart_facilities_licenses.stats'),
        );
    }

    public function store(StoreSmartFacilitiesLicenseRequest $request): JsonResponse
    {
        $smartFacilitiesLicense = $this->smartFacilitiesLicenseService->create($request->validated());

        return $this->resourceResponse(
            new SmartFacilitiesLicenseResource($smartFacilitiesLicense),
            __('messages.smart_facilities_licenses.created'),
            Response::HTTP_CREATED,
        );
    }

    public function show(SmartFacilitiesLicense $smartFacilitiesLicense): JsonResponse
    {
        $this->authorize('view', $smartFacilitiesLicense);

        return $this->resourceResponse(
            new SmartFacilitiesLicenseResource($this->smartFacilitiesLicenseService->find($smartFacilitiesLicense->id)),
            __('messages.smart_facilities_licenses.retrieved'),
        );
    }

    public function update(
        UpdateSmartFacilitiesLicenseRequest $request,
        SmartFacilitiesLicense $smartFacilitiesLicense,
    ): JsonResponse {
        $smartFacilitiesLicense = $this->smartFacilitiesLicenseService->update($smartFacilitiesLicense, $request->validated());

        return $this->resourceResponse(
            new SmartFacilitiesLicenseResource($smartFacilitiesLicense),
            __('messages.smart_facilities_licenses.updated'),
        );
    }

    public function destroy(SmartFacilitiesLicense $smartFacilitiesLicense): JsonResponse
    {
        $this->authorize('delete', $smartFacilitiesLicense);

        $this->smartFacilitiesLicenseService->delete($smartFacilitiesLicense);

        return $this->successResponse(null, __('messages.smart_facilities_licenses.deleted'));
    }
}
