<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Sso\ExchangeCodeRequest;
use App\Http\Requests\Sso\OidcCallbackRequest;
use App\Http\Requests\Sso\SamlAcsRequest;
use App\Http\Resources\PublicIdentityProviderResource;
use App\Http\Resources\UserResource;
use App\Models\IdentityProvider;
use App\Services\IdentityProviderService;
use App\Services\SsoAuthenticationService;
use App\Support\AuthenticationMode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class SsoController extends BaseApiController
{
    public function __construct(
        private readonly IdentityProviderService $providerService,
        private readonly SsoAuthenticationService $authenticationService,
    ) {}

    public function providers(): JsonResponse
    {
        if (! AuthenticationMode::allowsSso()) {
            return $this->successResponse([], __('messages.sso.providers_listed'));
        }

        return $this->successResponse(
            PublicIdentityProviderResource::collection($this->providerService->enabled())->resolve(),
            __('messages.sso.providers_listed'),
        );
    }

    public function redirect(IdentityProvider $identityProvider): RedirectResponse
    {
        return redirect()->away($this->authenticationService->initiate($identityProvider));
    }

    public function oidcCallback(OidcCallbackRequest $request): RedirectResponse
    {
        $url = $this->authenticationService->completeOidcCallback(
            (string) $request->validated('state'),
            (string) $request->validated('code'),
            $request,
        );

        return redirect()->away($url);
    }

    public function samlAcs(SamlAcsRequest $request): RedirectResponse
    {
        $url = $this->authenticationService->completeSamlCallback(
            (string) $request->validated('RelayState'),
            $request->validated(),
            $request,
        );

        return redirect()->away($url);
    }

    public function samlSls(Request $request): RedirectResponse
    {
        $frontendUrl = rtrim((string) config('services.external_auth.frontend_url'), '/');

        return redirect()->away(($frontendUrl !== '' ? $frontendUrl : url('/')).'/login');
    }

    public function exchange(ExchangeCodeRequest $request): JsonResponse
    {
        $result = $this->authenticationService->exchange(
            (string) $request->validated('code'),
            $request,
        );

        return $this->successResponse([
            'token' => $result['token'],
            'token_type' => 'Bearer',
            'user' => (new UserResource($result['user']))->resolve(),
        ], __('messages.auth.login_success'));
    }
}
