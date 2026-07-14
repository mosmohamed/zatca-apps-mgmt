<?php

declare(strict_types=1);

namespace App\Traits;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Http\Resources\Json\ResourceCollection;
use Symfony\Component\HttpFoundation\Response;

trait ApiResponseTrait
{
    protected function successResponse(
        mixed $data = null,
        string $message = 'Operation successful',
        int $status = Response::HTTP_OK,
    ): JsonResponse {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
            'errors' => null,
        ], $status);
    }

    protected function errorResponse(
        string $message,
        mixed $errors = null,
        int $status = Response::HTTP_BAD_REQUEST,
        mixed $data = null,
    ): JsonResponse {
        return response()->json([
            'success' => false,
            'message' => $message,
            'data' => $data,
            'errors' => $errors,
        ], $status);
    }

    protected function validationErrorResponse(
        mixed $errors,
        string $message = '',
    ): JsonResponse {
        return $this->errorResponse(
            $message !== '' ? $message : __('messages.validation.failed'),
            $errors,
            Response::HTTP_UNPROCESSABLE_ENTITY,
        );
    }

    /**
     * @param  class-string<JsonResource>  $resourceClass
     */
    protected function paginatedResponse(
        LengthAwarePaginator $paginator,
        string $resourceClass,
        string $message = 'Operation successful',
    ): JsonResponse {
        return $this->successResponse([
            'items' => $resourceClass::collection($paginator->items())->resolve(),
            'pagination' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
        ], $message);
    }

    protected function resourceResponse(
        JsonResource|ResourceCollection $resource,
        string $message = 'Operation successful',
        int $status = Response::HTTP_OK,
    ): JsonResponse {
        return $this->successResponse(
            $resource->resolve(),
            $message,
            $status,
        );
    }
}
