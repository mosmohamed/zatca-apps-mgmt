<?php

declare(strict_types=1);

namespace App\Models;

use App\Enums\OperationalArea;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VendorOperationalArea extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'vendor_id',
        'area',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'vendor_id' => 'integer',
            'area' => OperationalArea::class,
        ];
    }

    /**
     * @return BelongsTo<Vendor, $this>
     */
    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }
}
