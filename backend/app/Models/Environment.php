<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Environment extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'code',
        'name_en',
        'name_ar',
        'sort_order',
        'is_active',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return HasMany<ApplicationEnvironment, $this>
     */
    public function applicationEnvironments(): HasMany
    {
        return $this->hasMany(ApplicationEnvironment::class);
    }
}
