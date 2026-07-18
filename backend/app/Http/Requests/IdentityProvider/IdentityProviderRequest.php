<?php

declare(strict_types=1);

namespace App\Http\Requests\IdentityProvider;

use App\Http\Requests\Concerns\HasLocalizedValidationMessages;
use App\Models\IdentityProvider;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

abstract class IdentityProviderRequest extends FormRequest
{
    use HasLocalizedValidationMessages;

    /**
     * @return array<string, mixed>
     */
    protected function providerRules(bool $updating): array
    {
        /** @var IdentityProvider|null $provider */
        $provider = $this->route('identity_provider');
        $required = $updating ? 'sometimes' : 'required';

        return [
            'name' => [$required, 'string', 'max:255'],
            'slug' => [
                $required,
                'string',
                'max:100',
                'alpha_dash:ascii',
                Rule::unique('identity_providers', 'slug')->ignore($provider?->id),
            ],
            'protocol' => [$required, 'string', Rule::in(['oidc', 'saml'])],
            'enabled' => ['sometimes', 'boolean'],
            'configuration' => [$required, 'array'],
            'configuration.discovery_url' => ['nullable', 'url', 'max:2048'],
            'configuration.metadata_url' => ['nullable', 'url', 'max:2048'],
            'configuration.issuer' => ['nullable', 'url', 'max:2048'],
            'configuration.authorization_endpoint' => ['nullable', 'url', 'max:2048'],
            'configuration.token_endpoint' => ['nullable', 'url', 'max:2048'],
            'configuration.userinfo_endpoint' => ['nullable', 'url', 'max:2048'],
            'configuration.jwks_uri' => ['nullable', 'url', 'max:2048'],
            'configuration.client_id' => ['nullable', 'string', 'max:2048'],
            'configuration.client_secret' => ['nullable', 'string', 'max:8192'],
            'configuration.scopes' => ['nullable', 'array'],
            'configuration.scopes.*' => ['required', 'string', 'max:255'],
            'configuration.idp_entity_id' => ['nullable', 'string', 'max:2048'],
            'configuration.sso_url' => ['nullable', 'url', 'max:2048'],
            'configuration.slo_url' => ['nullable', 'url', 'max:2048'],
            'configuration.x509_certificate' => ['nullable', 'string', 'max:50000'],
            'configuration.sp_entity_id' => ['nullable', 'string', 'max:2048'],
            'configuration.acs_url' => ['nullable', 'url', 'max:2048'],
            'configuration.want_messages_signed' => ['nullable', 'boolean'],
            'configuration.claim_mapping' => [$required, 'array'],
            'configuration.claim_mapping.*' => ['nullable', 'string', 'max:255'],
        ];
    }

    /**
     * @return list<callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                /** @var IdentityProvider|null $provider */
                $provider = $this->route('identity_provider');
                $protocol = (string) ($this->input('protocol') ?? $provider?->protocol);
                $submittedConfig = $this->input('configuration');

                if (! is_array($submittedConfig)) {
                    return;
                }

                // Empty protected fields mean "keep the stored value" on update.
                foreach (['client_secret', 'x509_certificate', 'private_key'] as $secretKey) {
                    if (
                        array_key_exists($secretKey, $submittedConfig)
                        && trim((string) $submittedConfig[$secretKey]) === ''
                    ) {
                        unset($submittedConfig[$secretKey]);
                    }
                }

                $config = array_replace((array) $provider?->configuration, $submittedConfig);

                $required = $protocol === 'oidc'
                    ? ['client_id', 'client_secret']
                    : ['idp_entity_id', 'sso_url', 'x509_certificate', 'sp_entity_id', 'acs_url'];

                if ($protocol === 'oidc' && empty($config['discovery_url'])) {
                    $required = array_merge($required, ['issuer', 'authorization_endpoint', 'token_endpoint', 'jwks_uri']);
                }
                if (
                    $protocol === 'oidc'
                    && isset($config['scopes'])
                    && (! is_array($config['scopes']) || ! in_array('openid', $config['scopes'], true))
                ) {
                    $validator->errors()->add(
                        'configuration.scopes',
                        __('messages.sso.openid_scope_required'),
                    );
                }

                foreach ($required as $key) {
                    if (! isset($config[$key]) || trim((string) $config[$key]) === '') {
                        $validator->errors()->add(
                            "configuration.{$key}",
                            __('messages.validation.required', ['attribute' => $key]),
                        );
                    }
                }

                $urlKeys = $protocol === 'oidc'
                    ? ['discovery_url', 'issuer', 'authorization_endpoint', 'token_endpoint', 'userinfo_endpoint', 'jwks_uri']
                    : ['metadata_url', 'discovery_url', 'sso_url', 'slo_url', 'acs_url'];

                foreach ($urlKeys as $key) {
                    if (! empty($config[$key]) && filter_var($config[$key], FILTER_VALIDATE_URL) === false) {
                        $validator->errors()->add(
                            "configuration.{$key}",
                            __('messages.validation.url', ['attribute' => $key]),
                        );
                    }
                    if (
                        ! app()->environment(['local', 'testing'])
                        && ! empty($config[$key])
                        && parse_url((string) $config[$key], PHP_URL_SCHEME) !== 'https'
                    ) {
                        $validator->errors()->add(
                            "configuration.{$key}",
                            __('messages.sso.https_required'),
                        );
                    }
                }

                if (
                    $protocol === 'saml'
                    && ! empty($config['x509_certificate'])
                    && openssl_x509_read((string) $config['x509_certificate']) === false
                ) {
                    $validator->errors()->add(
                        'configuration.x509_certificate',
                        __('messages.sso.invalid_certificate'),
                    );
                }
            },
        ];
    }
}
