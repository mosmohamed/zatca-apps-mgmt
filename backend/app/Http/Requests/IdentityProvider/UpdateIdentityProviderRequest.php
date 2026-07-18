<?php

declare(strict_types=1);

namespace App\Http\Requests\IdentityProvider;

use App\Models\IdentityProvider;

class UpdateIdentityProviderRequest extends IdentityProviderRequest
{
    public function authorize(): bool
    {
        /** @var IdentityProvider|null $provider */
        $provider = $this->route('identity_provider');

        return $provider !== null && ($this->user()?->can('update', $provider) ?? false);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return $this->providerRules(true);
    }
}
