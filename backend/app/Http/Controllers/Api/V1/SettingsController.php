<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Settings\UpdateSettingsRequest;
use App\Http\Resources\SettingResource;
use App\Models\Setting;
use App\Services\SettingsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SettingsController extends BaseApiController
{
    public function __construct(
        private readonly SettingsService $settingsService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Setting::class);

        return $this->successResponse(
            SettingResource::collection($this->settingsService->all())->resolve(),
            __('messages.settings.listed'),
        );
    }

    public function public(): JsonResponse
    {
        return $this->successResponse(
            $this->settingsService->publicSettings(),
            __('messages.settings.public_listed'),
        );
    }

    public function update(UpdateSettingsRequest $request): JsonResponse
    {
        $this->settingsService->setMany($request->settingsPayload());

        return $this->successResponse(
            $this->settingsService->publicSettings(),
            __('messages.settings.updated'),
            Response::HTTP_OK,
        );
    }
}
