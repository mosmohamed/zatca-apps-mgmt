<?php

declare(strict_types=1);

namespace App\Services;

use App\Data\ExternalIdentity;
use App\Models\IdentityProvider;
use OneLogin\Saml2\Auth;
use RuntimeException;

class SamlConnector
{
    /**
     * @return array{url: string, request_id: string}
     */
    public function authenticationRequest(IdentityProvider $provider, string $state): array
    {
        $auth = new Auth($this->settings($provider));
        $url = $auth->login($state, [], false, false, true);
        $requestId = $auth->getLastRequestID();

        if (! is_string($url) || ! is_string($requestId) || $requestId === '') {
            throw new RuntimeException('Unable to create the SAML authentication request.');
        }

        return ['url' => $url, 'request_id' => $requestId];
    }

    /**
     * @param  array<string, mixed>  $requestData
     */
    public function authenticate(
        IdentityProvider $provider,
        array $requestData,
        string $requestId,
    ): ExternalIdentity {
        $originalPost = $_POST;
        $originalGet = $_GET;

        try {
            $_POST = array_map('strval', $requestData);
            $_GET = [];
            $auth = new Auth($this->settings($provider));
            $auth->processResponse($requestId);

            if ($auth->getErrors() !== [] || ! $auth->isAuthenticated()) {
                throw new RuntimeException('SAML response validation failed: '.$auth->getLastErrorReason());
            }

            $subject = $auth->getNameId();
            if (! is_string($subject) || $subject === '') {
                throw new RuntimeException('The SAML assertion does not contain a NameID.');
            }

            return new ExternalIdentity(
                $subject,
                $this->normalizeAttributes($auth->getAttributes(), $subject),
            );
        } finally {
            $_POST = $originalPost;
            $_GET = $originalGet;
        }
    }

    /**
     * Builds a SAML Single Logout redirect URL when the IdP SLO endpoint is configured.
     */
    public function logoutRequestUrl(IdentityProvider $provider): string
    {
        $configuration = (array) $provider->configuration;
        if (empty($configuration['slo_url'])) {
            throw new RuntimeException('SAML single logout is not configured for this provider.');
        }

        $auth = new Auth($this->settings($provider));
        $url = $auth->logout(null, [], null, null, true);
        if (! is_string($url) || $url === '') {
            throw new RuntimeException('Unable to create the SAML logout request.');
        }

        return $url;
    }

    /**
     * @param  array<string, list<string>>  $attributes
     * @return array<string, mixed>
     */
    public function normalizeAttributes(array $attributes, string $nameId): array
    {
        $normalized = ['name_id' => $nameId, 'sub' => $nameId];

        foreach ($attributes as $name => $values) {
            $cleanValues = array_values(array_map('strval', $values));
            $normalized[$name] = count($cleanValues) === 1 ? $cleanValues[0] : $cleanValues;
        }

        return $normalized;
    }

    /**
     * @return array<string, mixed>
     */
    private function settings(IdentityProvider $provider): array
    {
        $configuration = (array) $provider->configuration;
        $idp = [
            'entityId' => $configuration['idp_entity_id'],
            'singleSignOnService' => [
                'url' => $configuration['sso_url'],
                'binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
            ],
            'x509cert' => $configuration['x509_certificate'],
        ];
        if (! empty($configuration['slo_url'])) {
            $idp['singleLogoutService'] = ['url' => $configuration['slo_url']];
        }

        return [
            'strict' => true,
            'debug' => false,
            'sp' => [
                'entityId' => $configuration['sp_entity_id'],
                'assertionConsumerService' => [
                    'url' => $configuration['acs_url'],
                    'binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
                ],
                'singleLogoutService' => [
                    'url' => route('sso.saml.sls'),
                    'binding' => 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect',
                ],
            ],
            'idp' => $idp,
            'security' => [
                'authnRequestsSigned' => false,
                'wantMessagesSigned' => (bool) ($configuration['want_messages_signed'] ?? false),
                'wantAssertionsSigned' => true,
                'wantAssertionsEncrypted' => false,
                'wantNameIdEncrypted' => false,
                'requestedAuthnContext' => false,
                'rejectUnsolicitedResponsesWithInResponseTo' => true,
                'allowRepeatAttributeName' => true,
            ],
        ];
    }
}
