<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\NetworkOpsLicense\StoreNetworkOpsLicenseRequest;
use App\Http\Requests\NetworkOpsLicense\UpdateNetworkOpsLicenseRequest;
use App\Http\Resources\NetworkOpsLicenseResource;
use App\Models\NetworkOpsLicense;
use App\Services\NetworkOpsLicenseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class NetworkOpsLicenseController extends BaseApiController
{
    public function __construct(
        private readonly NetworkOpsLicenseService $networkOpsLicenseService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', NetworkOpsLicense::class);

        $filters = $this->listFilters($request, 'name');

        $environment = $request->query('environment');
        $status = $request->query('status');

        $filters['environment'] = is_string($environment) ? $environment : null;
        $filters['status'] = is_string($status) ? $status : null;

        $paginator = $this->networkOpsLicenseService->list($filters);

        return $this->paginatedResponse(
            $paginator,
            NetworkOpsLicenseResource::class,
            __('messages.network_ops_licenses.listed'),
        );
    }

    public function statistics(): JsonResponse
    {
        $this->authorize('viewAny', NetworkOpsLicense::class);

        return $this->successResponse(
            $this->networkOpsLicenseService->statistics(),
            __('messages.network_ops_licenses.stats'),
        );
    }

    public function store(StoreNetworkOpsLicenseRequest $request): JsonResponse
    {
        $networkOpsLicense = $this->networkOpsLicenseService->create($request->validated());

        return $this->resourceResponse(
            new NetworkOpsLicenseResource($networkOpsLicense),
            __('messages.network_ops_licenses.created'),
            Response::HTTP_CREATED,
        );
    }

    public function show(NetworkOpsLicense $networkOpsLicense): JsonResponse
    {
        $this->authorize('view', $networkOpsLicense);

        return $this->resourceResponse(
            new NetworkOpsLicenseResource($this->networkOpsLicenseService->find($networkOpsLicense->id)),
            __('messages.network_ops_licenses.retrieved'),
        );
    }

    public function update(
        UpdateNetworkOpsLicenseRequest $request,
        NetworkOpsLicense $networkOpsLicense,
    ): JsonResponse {
        $networkOpsLicense = $this->networkOpsLicenseService->update($networkOpsLicense, $request->validated());

        return $this->resourceResponse(
            new NetworkOpsLicenseResource($networkOpsLicense),
            __('messages.network_ops_licenses.updated'),
        );
    }

    public function destroy(NetworkOpsLicense $networkOpsLicense): JsonResponse
    {
        $this->authorize('delete', $networkOpsLicense);

        $this->networkOpsLicenseService->delete($networkOpsLicense);

        return $this->successResponse(null, __('messages.network_ops_licenses.deleted'));
    }
}
