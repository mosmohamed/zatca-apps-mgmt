<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\License\StoreLicenseRequest;
use App\Http\Requests\License\UpdateLicenseRequest;
use App\Http\Resources\LicenseResource;
use App\Models\License;
use App\Services\LicenseService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class LicenseController extends BaseApiController
{
    public function __construct(
        private readonly LicenseService $licenseService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', License::class);

        $filters = $this->listFilters($request, 'name');

        $environment = $request->query('environment');
        $status = $request->query('status');

        $filters['environment'] = is_string($environment) ? $environment : null;
        $filters['status'] = is_string($status) ? $status : null;

        $paginator = $this->licenseService->list($filters);

        return $this->paginatedResponse(
            $paginator,
            LicenseResource::class,
            __('messages.licenses.listed'),
        );
    }

    public function statistics(): JsonResponse
    {
        $this->authorize('viewAny', License::class);

        return $this->successResponse(
            $this->licenseService->statistics(),
            __('messages.licenses.stats'),
        );
    }

    public function store(StoreLicenseRequest $request): JsonResponse
    {
        $license = $this->licenseService->create($request->validated());

        return $this->resourceResponse(
            new LicenseResource($license),
            __('messages.licenses.created'),
            Response::HTTP_CREATED,
        );
    }

    public function show(License $license): JsonResponse
    {
        $this->authorize('view', $license);

        return $this->resourceResponse(
            new LicenseResource($this->licenseService->find($license->id)),
            __('messages.licenses.retrieved'),
        );
    }

    public function update(UpdateLicenseRequest $request, License $license): JsonResponse
    {
        $license = $this->licenseService->update($license, $request->validated());

        return $this->resourceResponse(
            new LicenseResource($license),
            __('messages.licenses.updated'),
        );
    }

    public function destroy(License $license): JsonResponse
    {
        $this->authorize('delete', $license);

        $this->licenseService->delete($license);

        return $this->successResponse(null, __('messages.licenses.deleted'));
    }
}
