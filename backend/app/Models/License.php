<?php

declare(strict_types=1);

namespace App\Models;

use Database\Factories\LicenseFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\Activitylog\Models\Concerns\LogsActivity;
use Spatie\Activitylog\Support\LogOptions;

class License extends Model
{
    /** @use HasFactory<LicenseFactory> */
    use HasFactory, LogsActivity, SoftDeletes;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'publisher',
        'name',
        'product',
        'version',
        'description',
        'environment',
        'licensed',
        'used',
        'available',
        'proof_of_entitlement',
        'start_date',
        'end_date',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'licensed' => 'integer',
            'used' => 'integer',
            'available' => 'integer',
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logFillable()
            ->logOnlyDirty()
            ->dontLogEmptyChanges();
    }

    /**
     * @return 'expired'|'expiring_soon'|'active'
     */
    public function status(): string
    {
        if ($this->end_date === null) {
            return 'active';
        }

        $today = now()->startOfDay();
        $endDate = $this->end_date->copy()->startOfDay();

        if ($endDate->lt($today)) {
            return 'expired';
        }

        if ($endDate->lte($today->copy()->addDays(30))) {
            return 'expiring_soon';
        }

        return 'active';
    }

    public function daysRemaining(): ?int
    {
        if ($this->end_date === null) {
            return null;
        }

        return (int) now()->startOfDay()->diffInDays($this->end_date->copy()->startOfDay(), false);
    }
}
