<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

/**
 * Shared behaviour for every infrastructure component that belongs to a single
 * application environment profile (servers, databases, networks, ...).
 */
abstract class InfrastructureComponent extends Model
{
    use LogsActivity, SoftDeletes;

    /**
     * Columns that are never carried over when a component is copied into
     * another environment profile.
     *
     * @var list<string>
     */
    public const NON_COPYABLE_COLUMNS = [
        'id',
        'application_environment_id',
        'created_by',
        'updated_by',
        'created_at',
        'updated_at',
        'deleted_at',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'application_environment_id' => 'integer',
            'sort_order' => 'integer',
            'created_by' => 'integer',
            'updated_by' => 'integer',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }

    /**
     * @return BelongsTo<ApplicationEnvironment, $this>
     */
    public function applicationEnvironment(): BelongsTo
    {
        return $this->belongsTo(ApplicationEnvironment::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function updater(): BelongsTo
    {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
