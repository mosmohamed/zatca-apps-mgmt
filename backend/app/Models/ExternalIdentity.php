<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Links an application user to a single identity provider.
 *
 * Constraints:
 * - Unique (identity_provider_id, external_subject): one external identity cannot belong to multiple users.
 * - Unique (user_id, identity_provider_id): one user may link many providers, but only once per provider.
 *
 * @property string $external_subject The immutable identifier from the Identity Provider.
 *                                    For OIDC this is the "sub" claim; for SAML this is NameID.
 */
class ExternalIdentity extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'identity_provider_id',
        'external_subject',
        'external_email',
        'last_login_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
            'identity_provider_id' => 'integer',
            'last_login_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<IdentityProvider, $this>
     */
    public function identityProvider(): BelongsTo
    {
        return $this->belongsTo(IdentityProvider::class);
    }
}
