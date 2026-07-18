<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\IdentityProvider;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Throwable;

class IdentityProviderConnectionTester
{
    /**
     * @return array{
     *     success: bool,
     *     protocol: string,
     *     checks: list<array{name: string, status: string, message: string}>,
     *     message: string
     * }
     */
    public function test(IdentityProvider $provider): array
    {
        $checks = $provider->protocol === 'oidc'
            ? $this->testOidc((array) $provider->configuration)
            : $this->testSaml((array) $provider->configuration);
        $success = collect($checks)->every(
            static fn (array $check): bool => $check['status'] === 'passed',
        );

        return [
            'success' => $success,
            'protocol' => $provider->protocol,
            'checks' => $checks,
            'message' => $success
                ? __('messages.identity_providers.connection_succeeded')
                : __('messages.identity_providers.connection_failed'),
        ];
    }

    /**
     * @param  array<string, mixed>  $configuration
     * @return list<array{name: string, status: string, message: string}>
     */
    private function testOidc(array $configuration): array
    {
        $checks = [];
        $resolved = $configuration;
        $discoveryUrl = trim((string) ($configuration['discovery_url'] ?? ''));

        if ($discoveryUrl !== '') {
            if (! $this->isAllowedUrl($discoveryUrl)) {
                $checks[] = $this->failed('discovery', 'The discovery URL is invalid or must use HTTPS.');
            } else {
                try {
                    $response = Http::acceptJson()->timeout(15)->get($discoveryUrl);
                    if ($response->successful() && is_array($response->json())) {
                        $resolved = array_replace($response->json(), $configuration);
                        $checks[] = $this->passed('discovery', 'The OIDC discovery document is reachable.');
                    } else {
                        $checks[] = $this->failedResponse('discovery', $response);
                    }
                } catch (Throwable $exception) {
                    $checks[] = $this->failed('discovery', $this->safeFailureMessage($exception));
                }
            }
        }

        foreach (['issuer', 'authorization_endpoint', 'token_endpoint', 'jwks_uri'] as $key) {
            $url = trim((string) ($resolved[$key] ?? ''));
            $checks[] = $this->isAllowedUrl($url)
                ? $this->passed($key, "The {$key} URL is valid.")
                : $this->failed($key, "The {$key} URL is missing, invalid, or must use HTTPS.");
        }

        $jwksUri = trim((string) ($resolved['jwks_uri'] ?? ''));
        if ($this->isAllowedUrl($jwksUri)) {
            try {
                $response = Http::acceptJson()->timeout(15)->get($jwksUri);
                $json = $response->json();
                if ($response->successful() && is_array($json) && is_array($json['keys'] ?? null)) {
                    $checks[] = $this->passed('jwks_reachability', 'The JWKS endpoint is reachable and returned keys.');
                } else {
                    $checks[] = $this->failedResponse('jwks_reachability', $response);
                }
            } catch (Throwable $exception) {
                $checks[] = $this->failed('jwks_reachability', $this->safeFailureMessage($exception));
            }
        }

        return $checks;
    }

    /**
     * @param  array<string, mixed>  $configuration
     * @return list<array{name: string, status: string, message: string}>
     */
    private function testSaml(array $configuration): array
    {
        $checks = [];
        $certificate = trim((string) ($configuration['x509_certificate'] ?? ''));
        $checks[] = $certificate !== '' && @openssl_x509_read($certificate) !== false
            ? $this->passed('x509_certificate', 'The SAML signing certificate is valid.')
            : $this->failed('x509_certificate', 'The SAML signing certificate is missing or invalid.');

        $ssoUrl = trim((string) ($configuration['sso_url'] ?? ''));
        $checks[] = $this->isAllowedUrl($ssoUrl)
            ? $this->passed('sso_url', 'The SAML SSO URL is valid.')
            : $this->failed('sso_url', 'The SAML SSO URL is missing, invalid, or must use HTTPS.');

        $metadataUrl = trim((string) (
            $configuration['metadata_url']
            ?? $configuration['discovery_url']
            ?? ''
        ));
        if ($metadataUrl !== '') {
            if (! $this->isAllowedUrl($metadataUrl)) {
                $checks[] = $this->failed('metadata', 'The SAML metadata URL is invalid or must use HTTPS.');
            } else {
                try {
                    $response = Http::accept('application/xml')->timeout(15)->get($metadataUrl);
                    $checks[] = $response->successful() && trim($response->body()) !== ''
                        ? $this->passed('metadata', 'The SAML metadata endpoint is reachable.')
                        : $this->failedResponse('metadata', $response);
                } catch (Throwable $exception) {
                    $checks[] = $this->failed('metadata', $this->safeFailureMessage($exception));
                }
            }
        }

        return $checks;
    }

    private function isAllowedUrl(string $url): bool
    {
        if ($url === '' || filter_var($url, FILTER_VALIDATE_URL) === false) {
            return false;
        }

        return app()->environment(['local', 'testing'])
            || parse_url($url, PHP_URL_SCHEME) === 'https';
    }

    /**
     * @return array{name: string, status: string, message: string}
     */
    private function passed(string $name, string $message): array
    {
        return ['name' => $name, 'status' => 'passed', 'message' => $message];
    }

    /**
     * @return array{name: string, status: string, message: string}
     */
    private function failed(string $name, string $message): array
    {
        return ['name' => $name, 'status' => 'failed', 'message' => $message];
    }

    /**
     * @return array{name: string, status: string, message: string}
     */
    private function failedResponse(string $name, Response $response): array
    {
        return $this->failed($name, "The endpoint returned HTTP {$response->status()}.");
    }

    private function safeFailureMessage(Throwable $exception): string
    {
        return 'The endpoint could not be reached: '.class_basename($exception).'.';
    }
}
