<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class SmartFacilitiesTeamAssignment extends Model
{
    use LogsActivity;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'smart_facilities_category_id',
        'user_id',
        'smart_facilities_level_id',
        'sort_order',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'smart_facilities_category_id' => 'integer',
            'user_id' => 'integer',
            'smart_facilities_level_id' => 'integer',
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
     * @return BelongsTo<SmartFacilitiesCategory, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(SmartFacilitiesCategory::class, 'smart_facilities_category_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<SmartFacilitiesLevel, $this>
     */
    public function level(): BelongsTo
    {
        return $this->belongsTo(SmartFacilitiesLevel::class, 'smart_facilities_level_id');
    }
}
