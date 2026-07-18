<?php

declare(strict_types=1);

namespace App\Services;

use App\Data\ExternalIdentity;
use App\Models\IdentityProvider;
use Firebase\JWT\JWK;
use Firebase\JWT\JWT;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use RuntimeException;

class OidcConnector
{
    /**
     * @return array{url: string, verifier: string, nonce: string}
     */
    public function authorizationRequest(
        IdentityProvider $provider,
        string $state,
        string $redirectUri,
    ): array {
        $configuration = $this->configuration($provider);
        $verifier = Str::random(96);
        $nonce = Str::random(64);
        $challenge = rtrim(strtr(base64_encode(hash('sha256', $verifier, true)), '+/', '-_'), '=');

        $query = http_build_query([
            'client_id' => $configuration['client_id'],
            'redirect_uri' => $redirectUri,
            'response_type' => 'code',
            'scope' => implode(' ', $configuration['scopes'] ?? ['openid', 'profile', 'email']),
            'state' => $state,
            'nonce' => $nonce,
            'code_challenge' => $challenge,
            'code_challenge_method' => 'S256',
        ], '', '&', PHP_QUERY_RFC3986);

        return [
            'url' => $configuration['authorization_endpoint'].'?'.$query,
            'verifier' => $verifier,
            'nonce' => $nonce,
        ];
    }

    public function authenticate(
        IdentityProvider $provider,
        string $code,
        string $redirectUri,
        string $verifier,
        string $nonce,
    ): ExternalIdentity {
        $configuration = $this->configuration($provider);
        $tokenResponse = Http::asForm()
            ->acceptJson()
            ->timeout(15)
            ->post($configuration['token_endpoint'], [
                'grant_type' => 'authorization_code',
                'code' => $code,
                'redirect_uri' => $redirectUri,
                'client_id' => $configuration['client_id'],
                'client_secret' => $configuration['client_secret'],
                'code_verifier' => $verifier,
            ])
            ->throw()
            ->json();

        if (! is_array($tokenResponse) || ! is_string($tokenResponse['id_token'] ?? null)) {
            throw new RuntimeException('The identity provider did not return an ID token.');
        }

        $claims = $this->validateIdToken($tokenResponse['id_token'], $configuration, $nonce);

        if (
            is_string($configuration['userinfo_endpoint'] ?? null)
            && is_string($tokenResponse['access_token'] ?? null)
        ) {
            $userinfo = Http::withToken($tokenResponse['access_token'])
                ->acceptJson()
                ->timeout(15)
                ->get($configuration['userinfo_endpoint'])
                ->throw()
                ->json();
            if (is_array($userinfo)) {
                if (($userinfo['sub'] ?? $claims['sub']) !== $claims['sub']) {
                    throw new RuntimeException('The UserInfo subject does not match the ID token.');
                }
                $claims = array_replace($claims, $userinfo);
            }
        }

        return new ExternalIdentity((string) $claims['sub'], $claims);
    }

    /**
     * @param  array<string, mixed>  $configuration
     * @return array<string, mixed>
     */
    public function validateIdToken(string $jwt, array $configuration, string $nonce): array
    {
        $segments = explode('.', $jwt);
        $header = isset($segments[0])
            ? json_decode((string) base64_decode(strtr($segments[0], '-_', '+/'), true), true)
            : null;
        if (! is_array($header) || ! in_array($header['alg'] ?? null, ['RS256', 'RS384', 'RS512', 'ES256'], true)) {
            throw new RuntimeException('The ID token uses an unsupported signing algorithm.');
        }

        $jwks = Http::acceptJson()->timeout(15)->get($configuration['jwks_uri'])->throw()->json();
        if (! is_array($jwks)) {
            throw new RuntimeException('The identity provider returned invalid signing keys.');
        }

        $decoded = (array) JWT::decode($jwt, JWK::parseKeySet($jwks));
        $audience = $decoded['aud'] ?? null;
        $audiences = is_array($audience) ? $audience : [$audience];

        if (($decoded['iss'] ?? null) !== $configuration['issuer']) {
            throw new RuntimeException('The ID token issuer is invalid.');
        }
        if (! in_array($configuration['client_id'], $audiences, true)) {
            throw new RuntimeException('The ID token audience is invalid.');
        }
        if (count($audiences) > 1 && ($decoded['azp'] ?? null) !== $configuration['client_id']) {
            throw new RuntimeException('The ID token authorized party is invalid.');
        }
        if (($decoded['nonce'] ?? null) !== $nonce) {
            throw new RuntimeException('The ID token nonce is invalid.');
        }
        if (! is_numeric($decoded['exp'] ?? null) || ! is_numeric($decoded['iat'] ?? null)) {
            throw new RuntimeException('The ID token lifetime claims are missing.');
        }
        if (! is_string($decoded['sub'] ?? null) || $decoded['sub'] === '') {
            throw new RuntimeException('The ID token subject is missing.');
        }

        return $decoded;
    }

    /**
     * @return array<string, mixed>
     */
    private function configuration(IdentityProvider $provider): array
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

        foreach (['issuer', 'authorization_endpoint', 'token_endpoint', 'jwks_uri', 'client_id', 'client_secret'] as $key) {
            if (! is_string($configuration[$key] ?? null) || $configuration[$key] === '') {
                throw new RuntimeException("OIDC configuration value [{$key}] is missing.");
            }
        }

        return $configuration;
    }
}
