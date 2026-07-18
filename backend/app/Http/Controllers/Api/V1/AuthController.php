<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Requests\Auth\ConfirmIdentityLinkRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\ExternalIdentityResource;
use App\Http\Resources\UserResource;
use App\Models\IdentityProvider;
use App\Models\User;
use App\Services\AccountLinkingService;
use App\Services\AuthenticationAuditService;
use App\Services\AuthenticationGateService;
use App\Services\FederatedLogoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends BaseController
{
    public function __construct(
        private readonly AuthenticationGateService $authenticationGate,
        private readonly AuthenticationAuditService $authenticationAudit,
        private readonly FederatedLogoutService $federatedLogout,
        private readonly AccountLinkingService $accountLinking,
    ) {}

    public function login(LoginRequest $request): JsonResponse
    {
        $email = (string) $request->validated('email');
        try {
            $this->authenticationGate->assertLocalLoginAllowed();
        } catch (ValidationException $exception) {
            $this->authenticationAudit->localLoginFailed($email, $request, 'local-login-disabled');

            throw $exception;
        }

        /** @var User|null $user */
        $user = User::query()->where('email', $email)->first();

        if ($user === null || ! Hash::check($request->validated('password'), $user->password)) {
            $this->authenticationAudit->localLoginFailed($email, $request, 'invalid-credentials');

            throw ValidationException::withMessages([
                'email' => [__('messages.auth.failed')],
            ]);
        }

        try {
            $this->authenticationGate->assertUserMayUseLocal($user);
        } catch (ValidationException $exception) {
            $this->authenticationAudit->localLoginFailed($email, $request, 'user-login-type-not-allowed');

            throw $exception;
        }

        if (! $user->is_active) {
            $this->authenticationAudit->localLoginFailed($email, $request, 'inactive-account');

            throw ValidationException::withMessages([
                'email' => [__('messages.auth.inactive')],
            ]);
        }

        $user->load([
            'vendor',
            'department',
            'identityProvider',
            'externalIdentities.identityProvider',
            'jobTitle',
            'roles.permissions',
        ]);

        $token = $user->createToken('api')->plainTextToken;
        $this->authenticationAudit->localLoginSucceeded($user, $request);

        return $this->successResponse([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => (new UserResource($user))->resolve(),
        ], __('messages.auth.login_success'));
    }

    public function me(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $user->load([
            'vendor',
            'department',
            'identityProvider',
            'externalIdentities.identityProvider',
            'jobTitle',
            'roles.permissions',
        ]);

        return $this->resourceResponse(
            new UserResource($user),
            __('messages.auth.me_success'),
        );
    }

    public function logout(Request $request): JsonResponse
    {
        /** @var User $authenticated */
        $authenticated = $request->user();
        $user = User::query()
            ->with(['identityProvider', 'externalIdentities.identityProvider'])
            ->findOrFail($authenticated->id);
        $federated = $this->federatedLogout->resolve($user);
        $authenticated->currentAccessToken()?->delete();

        return $this->successResponse($federated, __('messages.auth.logout_success'));
    }

    public function linkedIdentities(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $user->load(['externalIdentities.identityProvider']);

        return $this->successResponse(
            ExternalIdentityResource::collection($user->externalIdentities)->resolve(),
            __('messages.sso.linked_identities_listed'),
        );
    }

    public function initiateIdentityLink(Request $request, IdentityProvider $identityProvider): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $url = $this->accountLinking->initiate($user, $identityProvider);

        return $this->successResponse([
            'redirect_url' => $url,
        ], __('messages.sso.link_initiated'));
    }

    public function previewIdentityLink(ConfirmIdentityLinkRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return $this->successResponse(
            $this->accountLinking->preview($user, (string) $request->validated('code')),
            __('messages.sso.link_previewed'),
        );
    }

    public function confirmIdentityLink(ConfirmIdentityLinkRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $record = $this->accountLinking->confirm(
            $user,
            (string) $request->validated('code'),
            $request,
        );
        $user->refresh()->load([
            'vendor',
            'department',
            'identityProvider',
            'externalIdentities.identityProvider',
            'jobTitle',
            'roles.permissions',
        ]);

        return $this->successResponse([
            'identity' => (new ExternalIdentityResource($record->load('identityProvider')))->resolve(),
            'user' => (new UserResource($user))->resolve(),
        ], __('messages.sso.link_confirmed'));
    }
}
