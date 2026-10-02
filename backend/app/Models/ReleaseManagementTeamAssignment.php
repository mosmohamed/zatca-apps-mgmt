<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class ReleaseManagementTeamAssignment extends Model
{
    use LogsActivity;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'release_management_category_id',
        'user_id',
        'release_management_level_id',
        'sort_order',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'release_management_category_id' => 'integer',
            'user_id' => 'integer',
            'release_management_level_id' => 'integer',
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
     * @return BelongsTo<ReleaseManagementCategory, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(ReleaseManagementCategory::class, 'release_management_category_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<ReleaseManagementLevel, $this>
     */
    public function level(): BelongsTo
    {
        return $this->belongsTo(ReleaseManagementLevel::class, 'release_management_level_id');
    }
}
