<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\IdentityProvider;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use RuntimeException;
use Throwable;

class SsoAuthenticationService
{
    private const int STATE_TTL_SECONDS = 300;

    private const int EXCHANGE_TTL_SECONDS = 60;

    public function __construct(
        private readonly OidcConnector $oidcConnector,
        private readonly SamlConnector $samlConnector,
        private readonly ExternalIdentityProvisioningService $provisioningService,
        private readonly AuthenticationGateService $authenticationGate,
        private readonly AuthenticationAuditService $authenticationAudit,
        private readonly AccountLinkingService $accountLinking,
    ) {}

    public function initiate(IdentityProvider $provider): string
    {
        $this->authenticationGate->assertSsoLoginAllowed();
        $this->assertProviderEnabled($provider);
        $state = Str::random(64);

        if ($provider->protocol === 'oidc') {
            $redirectUri = route('sso.oidc.callback');
            $request = $this->oidcConnector->authorizationRequest($provider, $state, $redirectUri);
            Cache::put($this->stateKey($state), [
                'purpose' => 'login',
                'provider_id' => $provider->id,
                'protocol' => 'oidc',
                'verifier' => $request['verifier'],
                'nonce' => $request['nonce'],
            ], self::STATE_TTL_SECONDS);

            return $request['url'];
        }

        if ($provider->protocol === 'saml') {
            $request = $this->samlConnector->authenticationRequest($provider, $state);
            Cache::put($this->stateKey($state), [
                'purpose' => 'login',
                'provider_id' => $provider->id,
                'protocol' => 'saml',
                'request_id' => $request['request_id'],
            ], self::STATE_TTL_SECONDS);

            return $request['url'];
        }

        throw new RuntimeException('Unsupported identity provider protocol.');
    }

    /**
     * Completes OIDC callback and returns the frontend redirect URL (login or link confirm).
     */
    public function completeOidcCallback(string $state, string $code, ?Request $request = null): string
    {
        if ($this->accountLinking->isLinkState($state)) {
            try {
                return $this->accountLinking->completeOidc($state, $code, $request);
            } catch (Throwable $exception) {
                $this->authenticationAudit->ssoLoginFailed(null, $request, $this->failureReason($exception));

                throw $exception;
            }
        }

        return $this->frontendCallbackUrl($this->completeOidc($state, $code, $request));
    }

    /**
     * @param  array<string, mixed>  $requestData
     */
    public function completeSamlCallback(string $state, array $requestData, ?Request $request = null): string
    {
        if ($this->accountLinking->isLinkState($state)) {
            try {
                return $this->accountLinking->completeSaml($state, $requestData, $request);
            } catch (Throwable $exception) {
                $this->authenticationAudit->ssoLoginFailed(null, $request, $this->failureReason($exception));

                throw $exception;
            }
        }

        return $this->frontendCallbackUrl($this->completeSaml($state, $requestData, $request));
    }

    public function completeOidc(string $state, string $code, ?Request $request = null): string
    {
        $provider = null;
        try {
            $this->authenticationGate->assertSsoLoginAllowed();
            $context = $this->consumeState($state, 'oidc');
            $provider = $this->provider((int) $context['provider_id']);
            $identity = $this->oidcConnector->authenticate(
                $provider,
                $code,
                route('sso.oidc.callback'),
                (string) $context['verifier'],
                (string) $context['nonce'],
            );

            $user = $this->provisioningService->provision($provider, $identity, $request);
            $this->authenticationGate->assertUserMayUseSso($user);

            return $this->createExchangeCode($user);
        } catch (Throwable $exception) {
            $this->authenticationAudit->ssoLoginFailed(
                $provider,
                $request,
                $this->failureReason($exception),
            );

            throw $exception;
        }
    }

    /**
     * @param  array<string, mixed>  $requestData
     */
    public function completeSaml(string $state, array $requestData, ?Request $request = null): string
    {
        $provider = null;
        try {
            $this->authenticationGate->assertSsoLoginAllowed();
            $context = $this->consumeState($state, 'saml');
            $provider = $this->provider((int) $context['provider_id']);
            $identity = $this->samlConnector->authenticate(
                $provider,
                $requestData,
                (string) $context['request_id'],
            );

            $user = $this->provisioningService->provision($provider, $identity, $request);
            $this->authenticationGate->assertUserMayUseSso($user);

            return $this->createExchangeCode($user);
        } catch (Throwable $exception) {
            $this->authenticationAudit->ssoLoginFailed(
                $provider,
                $request,
                $this->failureReason($exception),
            );

            throw $exception;
        }
    }

    public function frontendCallbackUrl(string $exchangeCode): string
    {
        $frontendUrl = rtrim((string) config('services.external_auth.frontend_url'), '/');
        if ($frontendUrl === '' || filter_var($frontendUrl, FILTER_VALIDATE_URL) === false) {
            throw new RuntimeException('FRONTEND_URL is not configured.');
        }

        return $frontendUrl.'/auth/sso/callback?code='.rawurlencode($exchangeCode);
    }

    /**
     * @return array{token: string, user: User}
     */
    public function exchange(string $code, ?Request $request = null): array
    {
        $provider = null;
        try {
            $this->authenticationGate->assertSsoLoginAllowed();
            $userId = Cache::pull($this->exchangeKey($code));
            if (! is_numeric($userId)) {
                throw ValidationException::withMessages(['code' => [__('messages.sso.invalid_exchange_code')]]);
            }

            $user = User::query()
                ->with([
                    'vendor',
                    'department',
                    'identityProvider',
                    'externalIdentities.identityProvider',
                    'jobTitle',
                    'roles.permissions',
                ])
                ->findOrFail((int) $userId);
            $provider = $user->identityProvider
                ?? $user->externalIdentities
                    ->sortByDesc(static fn ($identity): mixed => $identity->last_login_at)
                    ->first()
                    ?->identityProvider;
            if (! $user->is_active) {
                throw ValidationException::withMessages(['code' => [__('messages.auth.inactive')]]);
            }
            $this->authenticationGate->assertUserMayUseSso($user);
            if (! $provider instanceof IdentityProvider) {
                throw ValidationException::withMessages([
                    'provider' => [__('messages.sso.missing_linked_identity')],
                ]);
            }

            $token = $user->createToken('sso')->plainTextToken;
            $provider->forceFill(['last_successful_auth_at' => now()])->save();
            $this->authenticationAudit->ssoLoginSucceeded($user, $provider, $request);

            return ['token' => $token, 'user' => $user];
        } catch (Throwable $exception) {
            $this->authenticationAudit->ssoLoginFailed(
                $provider,
                $request,
                $this->failureReason($exception),
            );

            throw $exception;
        }
    }

    private function failureReason(Throwable $exception): string
    {
        $message = trim($exception->getMessage());
        if ($message === '') {
            return $exception::class;
        }

        return mb_substr($message, 0, 500);
    }

    /**
     * @return array<string, mixed>
     */
    private function consumeState(string $state, string $protocol): array
    {
        $context = Cache::pull($this->stateKey($state));
        if (! is_array($context) || ($context['protocol'] ?? null) !== $protocol) {
            throw ValidationException::withMessages(['state' => [__('messages.sso.invalid_state')]]);
        }

        return $context;
    }

    private function createExchangeCode(User $user): string
    {
        $code = Str::random(64);
        Cache::put($this->exchangeKey($code), $user->id, self::EXCHANGE_TTL_SECONDS);

        return $code;
    }

    private function provider(int $id): IdentityProvider
    {
        $provider = IdentityProvider::query()->findOrFail($id);
        $this->assertProviderEnabled($provider);

        return $provider;
    }

    private function assertProviderEnabled(IdentityProvider $provider): void
    {
        if (! $provider->enabled) {
            throw ValidationException::withMessages(['provider' => [__('messages.sso.provider_disabled')]]);
        }
    }

    private function stateKey(string $state): string
    {
        return 'sso-state:'.hash('sha256', $state);
    }

    private function exchangeKey(string $code): string
    {
        return 'sso-exchange:'.hash('sha256', $code);
    }
}
