<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\OperationalArea;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserOperationalArea extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'user_id',
        'area',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'user_id' => 'integer',
            'area' => OperationalArea::class,
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
