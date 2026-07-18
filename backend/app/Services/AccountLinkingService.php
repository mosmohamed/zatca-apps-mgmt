<?php

declare(strict_types=1);

namespace App\Services;

use App\Data\ExternalIdentity;
use App\Models\ExternalIdentity as ExternalIdentityRecord;
use App\Models\IdentityProvider;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Explicit, user-initiated linking of an IdP identity to the authenticated account.
 * Automatic email-based linking during SSO login is intentionally not performed here.
 */
class AccountLinkingService
{
    private const int STATE_TTL_SECONDS = 300;

    private const int CONFIRM_TTL_SECONDS = 600;

    public function __construct(
        private readonly OidcConnector $oidcConnector,
        private readonly SamlConnector $samlConnector,
        private readonly RoleMappingService $roleMappingService,
        private readonly AuthenticationAuditService $authenticationAudit,
    ) {}

    public function assertLinkingAllowed(): void
    {
        $settings = $this->roleMappingService->settings();
        if (! $settings['allow_email_account_linking']) {
            throw ValidationException::withMessages([
                'provider' => [__('messages.sso.email_account_linking_disabled')],
            ]);
        }
    }

    public function initiate(User $user, IdentityProvider $provider): string
    {
        $this->assertLinkingAllowed();
        if (! $user->is_active) {
            throw ValidationException::withMessages(['user' => [__('messages.auth.inactive')]]);
        }
        if (! $provider->enabled) {
            throw ValidationException::withMessages(['provider' => [__('messages.sso.provider_disabled')]]);
        }

        $state = Str::random(64);

        if ($provider->protocol === 'oidc') {
            $redirectUri = route('sso.oidc.callback');
            $request = $this->oidcConnector->authorizationRequest($provider, $state, $redirectUri);
            Cache::put($this->stateKey($state), [
                'purpose' => 'link',
                'user_id' => $user->id,
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
                'purpose' => 'link',
                'user_id' => $user->id,
                'provider_id' => $provider->id,
                'protocol' => 'saml',
                'request_id' => $request['request_id'],
            ], self::STATE_TTL_SECONDS);

            return $request['url'];
        }

        throw ValidationException::withMessages(['provider' => [__('messages.sso.provider_disabled')]]);
    }

    public function isLinkState(string $state): bool
    {
        $context = Cache::get($this->stateKey($state));

        return is_array($context) && ($context['purpose'] ?? null) === 'link';
    }

    public function completeOidc(string $state, string $code, ?Request $request = null): string
    {
        $context = $this->consumeLinkState($state, 'oidc');
        $provider = IdentityProvider::query()->findOrFail((int) $context['provider_id']);
        $identity = $this->oidcConnector->authenticate(
            $provider,
            $code,
            route('sso.oidc.callback'),
            (string) $context['verifier'],
            (string) $context['nonce'],
        );

        return $this->storePendingConfirmation(
            (int) $context['user_id'],
            $provider,
            $identity,
            $request,
        );
    }

    /**
     * @param  array<string, mixed>  $requestData
     */
    public function completeSaml(string $state, array $requestData, ?Request $request = null): string
    {
        $context = $this->consumeLinkState($state, 'saml');
        $provider = IdentityProvider::query()->findOrFail((int) $context['provider_id']);
        $identity = $this->samlConnector->authenticate(
            $provider,
            $requestData,
            (string) $context['request_id'],
        );

        return $this->storePendingConfirmation(
            (int) $context['user_id'],
            $provider,
            $identity,
            $request,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function preview(User $user, string $code): array
    {
        $pending = $this->pending($code);
        if ((int) $pending['user_id'] !== $user->id) {
            throw ValidationException::withMessages(['code' => [__('messages.sso.invalid_link_code')]]);
        }

        $provider = IdentityProvider::query()->findOrFail((int) $pending['provider_id']);

        return [
            'provider' => [
                'id' => $provider->id,
                'name' => $provider->name,
                'slug' => $provider->slug,
                'protocol' => $provider->protocol,
            ],
            'external_subject' => $pending['external_subject'],
            'external_email' => $pending['external_email'],
            'email_verified' => (bool) $pending['email_verified'],
            'authentication_type' => $user->authentication_type,
            'will_become_both' => $user->authentication_type === 'local',
        ];
    }

    public function confirm(User $user, string $code, ?Request $request = null): ExternalIdentityRecord
    {
        $this->assertLinkingAllowed();
        $pending = $this->pending($code);
        if ((int) $pending['user_id'] !== $user->id) {
            throw ValidationException::withMessages(['code' => [__('messages.sso.invalid_link_code')]]);
        }

        $provider = IdentityProvider::query()->findOrFail((int) $pending['provider_id']);
        $settings = $this->roleMappingService->settings();
        if ($settings['require_verified_email_for_linking'] && ! $pending['email_verified']) {
            throw ValidationException::withMessages([
                'email' => [__('messages.sso.verified_email_required_for_linking')],
            ]);
        }

        $subject = (string) $pending['external_subject'];
        $ownedByOther = ExternalIdentityRecord::query()
            ->where('identity_provider_id', $provider->id)
            ->where('external_subject', $subject)
            ->where('user_id', '!=', $user->id)
            ->exists();
        if ($ownedByOther) {
            throw ValidationException::withMessages([
                'provider' => [__('messages.sso.external_identity_already_linked')],
            ]);
        }

        return DB::transaction(function () use ($user, $provider, $pending, $subject, $request, $code): ExternalIdentityRecord {
            $record = ExternalIdentityRecord::query()->updateOrCreate(
                [
                    'user_id' => $user->id,
                    'identity_provider_id' => $provider->id,
                ],
                [
                    'external_subject' => $subject,
                    'external_email' => is_string($pending['external_email'] ?? null)
                        ? $pending['external_email']
                        : null,
                    'last_login_at' => now(),
                ],
            );

            $changes = [
                'identity_provider_id' => $provider->id,
                'external_subject' => $subject,
            ];
            if ($user->authentication_type === 'local') {
                $changes['authentication_type'] = 'both';
            }
            $user->update($changes);

            Cache::forget($this->confirmKey($code));

            $this->authenticationAudit->accountLinked(
                $user->refresh(),
                $provider,
                'explicit-confirmation',
                $request,
                $subject,
            );

            return $record;
        });
    }

    /**
     * @return array<string, mixed>
     */
    private function pending(string $code): array
    {
        $pending = Cache::get($this->confirmKey($code));
        if (! is_array($pending)) {
            throw ValidationException::withMessages(['code' => [__('messages.sso.invalid_link_code')]]);
        }

        return $pending;
    }

    private function storePendingConfirmation(
        int $userId,
        IdentityProvider $provider,
        ExternalIdentity $identity,
        ?Request $request,
    ): string {
        $settings = $this->roleMappingService->settings();
        $emailVerified = $identity->claim('email_verified');
        $isVerified = $emailVerified === true || $emailVerified === 'true';
        if ($settings['require_verified_email_for_linking'] && ! $isVerified) {
            throw ValidationException::withMessages([
                'email' => [__('messages.sso.verified_email_required_for_linking')],
            ]);
        }

        $ownedByOther = ExternalIdentityRecord::query()
            ->where('identity_provider_id', $provider->id)
            ->where('external_subject', $identity->subject)
            ->where('user_id', '!=', $userId)
            ->exists();
        if ($ownedByOther) {
            throw ValidationException::withMessages([
                'provider' => [__('messages.sso.external_identity_already_linked')],
            ]);
        }

        $email = $identity->claim('email');
        $code = Str::random(64);
        Cache::put($this->confirmKey($code), [
            'user_id' => $userId,
            'provider_id' => $provider->id,
            'external_subject' => $identity->subject,
            'external_email' => is_scalar($email) ? trim((string) $email) : null,
            'email_verified' => $isVerified,
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
        ], self::CONFIRM_TTL_SECONDS);

        $frontendUrl = rtrim((string) config('services.external_auth.frontend_url'), '/');
        if ($frontendUrl === '' || filter_var($frontendUrl, FILTER_VALIDATE_URL) === false) {
            throw ValidationException::withMessages(['code' => [__('messages.sso.invalid_link_code')]]);
        }

        return $frontendUrl.'/auth/link/confirm?code='.rawurlencode($code);
    }

    /**
     * @return array<string, mixed>
     */
    private function consumeLinkState(string $state, string $protocol): array
    {
        $context = Cache::pull($this->stateKey($state));
        if (
            ! is_array($context)
            || ($context['purpose'] ?? null) !== 'link'
            || ($context['protocol'] ?? null) !== $protocol
        ) {
            throw ValidationException::withMessages(['state' => [__('messages.sso.invalid_state')]]);
        }

        return $context;
    }

    private function stateKey(string $state): string
    {
        return 'sso-state:'.hash('sha256', $state);
    }

    private function confirmKey(string $code): string
    {
        return 'sso-link-confirm:'.hash('sha256', $code);
    }
}
