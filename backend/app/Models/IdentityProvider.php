<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class IdentityProvider extends Model
{
    use LogsActivity;
    use SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'slug',
        'protocol',
        'enabled',
        'configuration',
        'last_successful_auth_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'enabled' => 'boolean',
            'configuration' => 'encrypted:array',
            'last_successful_auth_at' => 'datetime',
        ];
    }

    /**
     * @return HasMany<ExternalIdentity, $this>
     */
    public function externalIdentities(): HasMany
    {
        return $this->hasMany(ExternalIdentity::class);
    }

    /**
     * @return HasMany<RoleMappingRule, $this>
     */
    public function roleMappingRules(): HasMany
    {
        return $this->hasMany(RoleMappingRule::class);
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['name', 'slug', 'protocol', 'enabled'])
            ->logOnlyDirty()
            ->dontLogEmptyChanges()
            ->useLogName('identity-providers');
    }
}
