<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;
use Spatie\Permission\Models\Role;

class RoleMappingRule extends Model
{
    use LogsActivity;
    use SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'identity_provider_id',
        'claim_name',
        'external_value',
        'role_id',
        'priority',
        'enabled',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'identity_provider_id' => 'integer',
            'role_id' => 'integer',
            'priority' => 'integer',
            'enabled' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::saving(static function (RoleMappingRule $rule): void {
            $rule->uniqueness_key = hash('sha256', implode("\0", [
                (string) $rule->identity_provider_id,
                $rule->claim_name,
                $rule->external_value,
                (string) $rule->role_id,
            ]));
        });

        static::deleting(static function (RoleMappingRule $rule): void {
            if (! $rule->isForceDeleting()) {
                $rule->uniqueness_key = null;
                $rule->saveQuietly();
            }
        });
    }

    /**
     * @return BelongsTo<IdentityProvider, $this>
     */
    public function identityProvider(): BelongsTo
    {
        return $this->belongsTo(IdentityProvider::class);
    }

    /**
     * @return BelongsTo<Role, $this>
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()
            ->logOnlyDirty()
            ->dontLogEmptyChanges()
            ->useLogName('role-mappings');
    }
}
