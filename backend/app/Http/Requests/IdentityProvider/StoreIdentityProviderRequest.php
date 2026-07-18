<?php

declare(strict_types=1);

namespace App\Http\Requests\IdentityProvider;

use App\Models\IdentityProvider;

class StoreIdentityProviderRequest extends IdentityProviderRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', IdentityProvider::class) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return $this->providerRules(false);
    }
}
