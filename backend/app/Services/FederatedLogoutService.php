<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\IdentityProvider;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * Builds optional IdP logout redirects after the local Sanctum session is cleared.
 */
class FederatedLogoutService
{
    public function __construct(
        private readonly OidcConnector $oidcConnector,
        private readonly SamlConnector $samlConnector,
    ) {}

    /**
     * @return array{federated_logout_url: string|null, protocol: string|null, provider: string|null}
     */
    public function resolve(User $user): array
    {
        $provider = $user->identityProvider
            ?? $user->externalIdentities()
                ->with('identityProvider')
                ->latest('last_login_at')
                ->first()
                ?->identityProvider;

        if (! $provider instanceof IdentityProvider || ! $provider->enabled) {
            return [
                'federated_logout_url' => null,
                'protocol' => null,
                'provider' => null,
            ];
        }

        $url = match ($provider->protocol) {
            'oidc' => $this->oidcLogoutUrl($provider),
            'saml' => $this->samlLogoutUrl($provider),
            default => null,
        };

        return [
            'federated_logout_url' => $url,
            'protocol' => $provider->protocol,
            'provider' => $provider->slug,
        ];
    }

    private function oidcLogoutUrl(IdentityProvider $provider): ?string
    {
        $configuration = (array) $provider->configuration;
        if (! empty($configuration['discovery_url'])) {
            $discovery = Cache::remember(
                'oidc-discovery:'.$provider->id,
                now()->addHour(),
                fn (): array => Http::acceptJson()
                    ->timeout(15)
                    ->get((string) $configuration['discovery_url'])
                    ->throw()
                    ->json(),
            );
            $configuration = array_replace($discovery, $configuration);
        }

        $endSession = $configuration['end_session_endpoint'] ?? null;
        if (! is_string($endSession) || $endSession === '') {
            return null;
        }

        $frontendUrl = rtrim((string) config('services.external_auth.frontend_url'), '/');
        $query = http_build_query(array_filter([
            'client_id' => $configuration['client_id'] ?? null,
            'post_logout_redirect_uri' => $frontendUrl !== '' ? $frontendUrl.'/login' : null,
        ], static fn (mixed $value): bool => is_string($value) && $value !== ''), '', '&', PHP_QUERY_RFC3986);

        return $endSession.($query !== '' ? '?'.$query : '');
    }

    private function samlLogoutUrl(IdentityProvider $provider): ?string
    {
        $configuration = (array) $provider->configuration;
        if (empty($configuration['slo_url'])) {
            return null;
        }

        try {
            return $this->samlConnector->logoutRequestUrl($provider);
        } catch (RuntimeException) {
            return null;
        }
    }
}
