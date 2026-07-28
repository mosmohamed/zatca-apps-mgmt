<?php

declare(strict_types=1);

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Per-user ordering of dashboard widgets. Visibility remains role-scoped and
 * is handled by the `dashboard_widgets` setting.
 */
class UserDashboardLayout extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'widget_order',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
            'widget_order' => 'array',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
