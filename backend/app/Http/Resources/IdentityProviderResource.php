<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Http\Resources\Concerns\FormatsResourceDates;
use App\Models\IdentityProvider;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin IdentityProvider
 */
class IdentityProviderResource extends JsonResource
{
    use FormatsResourceDates;

    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $originalConfiguration = is_array($this->configuration)
            ? $this->configuration
            : [];
        $configuration = $originalConfiguration;
        unset($configuration['client_secret'], $configuration['x509_certificate'], $configuration['private_key']);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'protocol' => $this->protocol,
            'enabled' => $this->enabled,
            'configuration' => $configuration,
            'has_client_secret' => ! empty($originalConfiguration['client_secret'] ?? null),
            'has_x509_certificate' => ! empty($originalConfiguration['x509_certificate'] ?? null),
            'last_successful_auth_at' => $this->formatDate($this->last_successful_auth_at),
            'created_at' => $this->formatDate($this->created_at),
            'updated_at' => $this->formatDate($this->updated_at),
        ];
    }
}
