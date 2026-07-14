<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Exports\ExportRegistry;
use App\Http\Requests\Export\ExportDataRequest;
use App\Models\User;
use App\Services\ExportService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ExportController extends BaseApiController
{
    public function __construct(
        private readonly ExportRegistry $registry,
        private readonly ExportService $exportService,
    ) {
    }

    public function store(string $entity, ExportDataRequest $request): BinaryFileResponse|StreamedResponse|JsonResponse
    {
        abort_unless($this->registry->has($entity), Response::HTTP_NOT_FOUND, __('messages.errors.not_found'));

        $definition = $this->registry->resolveOrFail($entity);

        /** @var User $user */
        $user = $request->user();

        abort_unless($user->can($definition->permission()), Response::HTTP_FORBIDDEN, __('messages.auth.forbidden'));

        return $this->exportService->export($definition, $request->payload(), $user);
    }
}
