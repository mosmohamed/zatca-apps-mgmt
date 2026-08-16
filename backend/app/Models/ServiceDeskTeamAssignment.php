<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class ServiceDeskTeamAssignment extends Model
{
    use LogsActivity;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'service_desk_category_id',
        'user_id',
        'service_desk_level_id',
        'sort_order',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'service_desk_category_id' => 'integer',
            'user_id' => 'integer',
            'service_desk_level_id' => 'integer',
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
     * @return BelongsTo<ServiceDeskCategory, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(ServiceDeskCategory::class, 'service_desk_category_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<ServiceDeskLevel, $this>
     */
    public function level(): BelongsTo
    {
        return $this->belongsTo(ServiceDeskLevel::class, 'service_desk_level_id');
    }
}
