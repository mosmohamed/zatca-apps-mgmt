<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class NetworkOpsTeamAssignment extends Model
{
    use LogsActivity;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'network_ops_category_id',
        'user_id',
        'network_ops_level_id',
        'sort_order',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'network_ops_category_id' => 'integer',
            'user_id' => 'integer',
            'network_ops_level_id' => 'integer',
            'sort_order' => 'integer',
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
     * @return BelongsTo<NetworkOpsCategory, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(NetworkOpsCategory::class, 'network_ops_category_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<NetworkOpsLevel, $this>
     */
    public function level(): BelongsTo
    {
        return $this->belongsTo(NetworkOpsLevel::class, 'network_ops_level_id');
    }
}
