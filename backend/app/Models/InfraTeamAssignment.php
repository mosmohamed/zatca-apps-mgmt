<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\Activitylog\LogOptions;
use Spatie\Activitylog\Traits\LogsActivity;

class InfraTeamAssignment extends Model
{
    use LogsActivity;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'infra_category_id',
        'user_id',
        'infra_level_id',
        'sort_order',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'infra_category_id' => 'integer',
            'user_id' => 'integer',
            'infra_level_id' => 'integer',
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
     * @return BelongsTo<InfraCategory, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(InfraCategory::class, 'infra_category_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return BelongsTo<InfraLevel, $this>
     */
    public function level(): BelongsTo
    {
        return $this->belongsTo(InfraLevel::class, 'infra_level_id');
    }
}
