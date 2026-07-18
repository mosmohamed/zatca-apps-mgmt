<?php

declare(strict_types=1);

namespace App\Support;

/**
 * Administrator presets for creating identity providers.
 * Existing providers are unaffected; presets only seed configuration drafts.
 */
final class IdentityProviderPresets
{
    /**
     * @return list<array<string, mixed>>
     */
    public static function catalog(): array
    {
        return [
            [
                'type' => 'microsoft_entra',
                'label' => 'Microsoft Entra ID',
                'protocol' => 'oidc',
                'required_fields' => ['tenant_id', 'client_id', 'client_secret'],
            ],
            [
                'type' => 'auth0',
                'label' => 'Auth0',
                'protocol' => 'oidc',
                'required_fields' => ['domain', 'client_id', 'client_secret'],
            ],
            [
                'type' => 'keycloak',
                'label' => 'Keycloak',
                'protocol' => 'oidc',
                'required_fields' => ['discovery_url', 'client_id', 'client_secret'],
            ],
            [
                'type' => 'okta',
                'label' => 'Okta',
                'protocol' => 'oidc',
                'required_fields' => ['discovery_url', 'client_id', 'client_secret'],
            ],
            [
                'type' => 'generic_oidc',
                'label' => 'Generic OIDC',
                'protocol' => 'oidc',
                'required_fields' => ['client_id', 'client_secret'],
            ],
            [
                'type' => 'generic_saml',
                'label' => 'Generic SAML',
                'protocol' => 'saml',
                'required_fields' => ['idp_entity_id', 'sso_url', 'x509_certificate', 'sp_entity_id', 'acs_url'],
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array{protocol: string, configuration: array<string, mixed>}
     */
    public static function build(string $type, array $input = []): array
    {
        return match ($type) {
            'microsoft_entra' => self::microsoftEntra($input),
            'auth0' => self::auth0($input),
            'keycloak', 'okta', 'generic_oidc' => self::genericOidc($input),
            'generic_saml' => self::genericSaml($input),
            default => throw new \InvalidArgumentException('Unknown identity provider preset.'),
        };
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array{protocol: string, configuration: array<string, mixed>}
     */
    private static function microsoftEntra(array $input): array
    {
        $tenantId = trim((string) ($input['tenant_id'] ?? ''));

        return [
            'protocol' => 'oidc',
            'configuration' => [
                'tenant_id' => $tenantId,
                'discovery_url' => $tenantId === ''
                    ? ''
                    : 'https://login.microsoftonline.com/'.$tenantId.'/v2.0/.well-known/openid-configuration',
                'client_id' => (string) ($input['client_id'] ?? ''),
                'client_secret' => (string) ($input['client_secret'] ?? ''),
                'scopes' => ['openid', 'profile', 'email'],
                'claim_mapping' => [
                    'first_name' => 'given_name',
                    'last_name' => 'family_name',
                    'email' => 'preferred_username',
                    'username' => 'preferred_username',
                ],
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array{protocol: string, configuration: array<string, mixed>}
     */
    private static function auth0(array $input): array
    {
        $domain = trim((string) ($input['domain'] ?? ''));
        $domain = preg_replace('#^https?://#i', '', $domain) ?? $domain;
        $domain = rtrim($domain, '/');

        return [
            'protocol' => 'oidc',
            'configuration' => [
                'domain' => $domain,
                'discovery_url' => $domain === ''
                    ? ''
                    : 'https://'.$domain.'/.well-known/openid-configuration',
                'client_id' => (string) ($input['client_id'] ?? ''),
                'client_secret' => (string) ($input['client_secret'] ?? ''),
                'scopes' => ['openid', 'profile', 'email'],
                'claim_mapping' => [
                    'first_name' => 'given_name',
                    'last_name' => 'family_name',
                    'email' => 'email',
                    'username' => 'nickname',
                ],
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array{protocol: string, configuration: array<string, mixed>}
     */
    private static function genericOidc(array $input): array
    {
        return [
            'protocol' => 'oidc',
            'configuration' => [
                'discovery_url' => (string) ($input['discovery_url'] ?? ''),
                'issuer' => (string) ($input['issuer'] ?? ''),
                'authorization_endpoint' => (string) ($input['authorization_endpoint'] ?? ''),
                'token_endpoint' => (string) ($input['token_endpoint'] ?? ''),
                'userinfo_endpoint' => (string) ($input['userinfo_endpoint'] ?? ''),
                'jwks_uri' => (string) ($input['jwks_uri'] ?? ''),
                'client_id' => (string) ($input['client_id'] ?? ''),
                'client_secret' => (string) ($input['client_secret'] ?? ''),
                'scopes' => ['openid', 'profile', 'email'],
                'claim_mapping' => [
                    'first_name' => 'given_name',
                    'last_name' => 'family_name',
                    'email' => 'email',
                    'username' => 'preferred_username',
                ],
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $input
     * @return array{protocol: string, configuration: array<string, mixed>}
     */
    private static function genericSaml(array $input): array
    {
        return [
            'protocol' => 'saml',
            'configuration' => [
                'idp_entity_id' => (string) ($input['idp_entity_id'] ?? ''),
                'sso_url' => (string) ($input['sso_url'] ?? ''),
                'slo_url' => (string) ($input['slo_url'] ?? ''),
                'x509_certificate' => (string) ($input['x509_certificate'] ?? ''),
                'sp_entity_id' => (string) ($input['sp_entity_id'] ?? ''),
                'acs_url' => (string) ($input['acs_url'] ?? ''),
                'claim_mapping' => [
                    'first_name' => 'given_name',
                    'last_name' => 'family_name',
                    'email' => 'email',
                    'username' => 'username',
                ],
            ],
        ];
    }
}
