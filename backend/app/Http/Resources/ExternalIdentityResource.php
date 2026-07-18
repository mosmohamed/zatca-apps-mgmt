<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Http\Resources\Concerns\FormatsResourceDates;
use App\Models\ExternalIdentity;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin ExternalIdentity
 */
class ExternalIdentityResource extends JsonResource
{
    use FormatsResourceDates;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'identity_provider_id' => $this->identity_provider_id,
            // Immutable IdP identifier (OIDC sub / SAML NameID).
            'external_subject' => $this->external_subject,
            'external_email' => $this->external_email,
            'last_login_at' => $this->formatDate($this->last_login_at),
            'identity_provider' => $this->whenLoaded(
                'identityProvider',
                fn () => $this->identityProvider === null
                    ? null
                    : [
                        'id' => $this->identityProvider->id,
                        'name' => $this->identityProvider->name,
                        'slug' => $this->identityProvider->slug,
                        'protocol' => $this->identityProvider->protocol,
                    ],
            ),
            'created_at' => $this->formatDate($this->created_at),
            'updated_at' => $this->formatDate($this->updated_at),
        ];
    }
}
