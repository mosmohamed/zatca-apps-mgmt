<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\IdentityProvider;
use App\Models\User;
use Illuminate\Http\Request;

/**
 * Writes authentication and SSO audit events with a consistent property schema.
 *
 * Shared properties on every event:
 * - user_id
 * - email
 * - provider (IdP slug, or null for local login)
 * - provider_id
 * - provider_protocol
 * - ip_address
 * - user_agent
 * - result (success|failure)
 * - failure_reason
 * - timestamp (ISO-8601)
 */
class AuthenticationAuditService
{
    public function localLoginSucceeded(User $user, ?Request $request = null): void
    {
        activity('authentication')
            ->performedOn($user)
            ->withProperties($this->context($user, null, $request, 'success'))
            ->event('local-login-succeeded')
            ->log('Local login succeeded');
    }

    public function localLoginFailed(?string $email, ?Request $request, string $reason): void
    {
        activity('authentication')
            ->withProperties($this->context(null, null, $request, 'failure', $reason, $email))
            ->event('local-login-failed')
            ->log('Local login failed');
    }

    public function ssoLoginSucceeded(
        User $user,
        IdentityProvider $provider,
        ?Request $request = null,
    ): void {
        activity('authentication')
            ->performedOn($user)
            ->withProperties($this->context($user, $provider, $request, 'success'))
            ->event('sso-login-succeeded')
            ->log('SSO login succeeded');
    }

    public function ssoLoginFailed(
        ?IdentityProvider $provider,
        ?Request $request,
        string $reason,
    ): void {
        activity('authentication')
            ->withProperties($this->context(null, $provider, $request, 'failure', $reason))
            ->event('sso-login-failed')
            ->log('SSO login failed');
    }

    public function accountLinked(
        User $user,
        IdentityProvider $provider,
        string $method,
        ?Request $request = null,
        ?string $externalSubject = null,
    ): void {
        activity('authentication')
            ->performedOn($user)
            ->withProperties($this->context($user, $provider, $request, 'success') + array_filter([
                'method' => $method,
                'external_subject' => $externalSubject,
            ], static fn (mixed $value): bool => $value !== null && $value !== ''))
            ->event('account-linked')
            ->log('External identity linked to account');
    }

    /**
     * @param  array<string, mixed>  $extra
     */
    public function userProvisioned(
        User $user,
        IdentityProvider $provider,
        ?Request $request = null,
        array $extra = [],
    ): void {
        activity('authentication')
            ->performedOn($user)
            ->withProperties($this->context($user, $provider, $request, 'success') + $extra)
            ->event('user-provisioned')
            ->log('External identity user provisioned');
    }

    /**
     * @param  array<string, mixed>  $extra
     */
    public function userSynchronized(
        User $user,
        IdentityProvider $provider,
        ?Request $request = null,
        array $extra = [],
    ): void {
        activity('authentication')
            ->performedOn($user)
            ->withProperties($this->context($user, $provider, $request, 'success') + $extra)
            ->event('user-synchronized')
            ->log('External identity user synchronized');
    }

    /**
     * @param  array<string, mixed>  $extra
     */
    public function rolesSynchronized(
        User $user,
        IdentityProvider $provider,
        ?Request $request = null,
        array $extra = [],
    ): void {
        activity('authentication')
            ->performedOn($user)
            ->withProperties($this->context($user, $provider, $request, 'success') + $extra)
            ->event('roles-synchronized')
            ->log('External identity roles synchronized');
    }

    /**
     * @return array<string, mixed>
     */
    private function context(
        ?User $user,
        ?IdentityProvider $provider,
        ?Request $request,
        string $result,
        ?string $failureReason = null,
        ?string $email = null,
    ): array {
        $request = $this->resolveRequest($request);

        return [
            'user_id' => $user?->id,
            'email' => $user?->email ?? $email,
            'provider' => $provider?->slug,
            'provider_id' => $provider?->id,
            'provider_protocol' => $provider?->protocol,
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
            'result' => $result,
            'failure_reason' => $failureReason,
            'timestamp' => now()->toIso8601String(),
        ];
    }

    private function resolveRequest(?Request $request): ?Request
    {
        if ($request instanceof Request) {
            return $request;
        }

        if (! app()->bound('request')) {
            return null;
        }

        $current = request();

        return $current instanceof Request ? $current : null;
    }
}
