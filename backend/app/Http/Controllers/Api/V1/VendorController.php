<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Vendor\StoreVendorRequest;
use App\Http\Requests\Vendor\UpdateVendorRequest;
use App\Http\Resources\VendorResource;
use App\Models\Vendor;
use App\Services\VendorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class VendorController extends BaseApiController
{
    public function __construct(
        private readonly VendorService $vendorService,
    ) {
    }

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Vendor::class);

        $paginator = $this->vendorService->list(
            $this->listFilters($request, '-created_at')
        );

        return $this->paginatedResponse(
            $paginator,
            VendorResource::class,
            __('messages.vendors.listed'),
        );
    }


    public function statistics(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Vendor::class);

        $area = $request->string('area')->toString();

        return $this->successResponse(
            $this->vendorService->statistics($area !== '' ? ['area' => $area] : []),
            __('messages.vendors.stats'),
        );
    }

    public function store(StoreVendorRequest $request): JsonResponse
    {
        $vendor = $this->vendorService->create($request->validated());

        return $this->resourceResponse(
            new VendorResource($vendor),
            __('messages.vendors.created'),
            Response::HTTP_CREATED,
        );
    }

    public function show(Vendor $vendor): JsonResponse
    {
        $this->authorize('view', $vendor);

        return $this->resourceResponse(
            new VendorResource($this->vendorService->find($vendor->id)),
            __('messages.vendors.retrieved'),
        );
    }

    public function update(UpdateVendorRequest $request, Vendor $vendor): JsonResponse
    {
        $vendor = $this->vendorService->update($vendor, $request->validated());

        return $this->resourceResponse(
            new VendorResource($vendor),
            __('messages.vendors.updated'),
        );
    }

    public function destroy(Vendor $vendor): JsonResponse
    {
        $this->authorize('delete', $vendor);

        $this->vendorService->delete($vendor);

        return $this->successResponse(null, __('messages.vendors.deleted'));
    }
}
