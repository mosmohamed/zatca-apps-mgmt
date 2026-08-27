<?php

declare(strict_types=1);

namespace App\Models\Concerns;

use Illuminate\Support\Carbon;
use Spatie\Activitylog\LogOptions;

/**
 * Shared behaviour for the three independent license catalogues
 * (Apps, Infrastructure and Service Desk), which share an identical schema.
 *
 * @property int $licensed
 * @property int $used
 * @property int $available
 * @property Carbon|null $start_date
 * @property Carbon|null $end_date
 */
trait HasLicenseAttributes
{
    /**
     * Days before expiry at which a license is flagged as expiring soon.
     */
    public const int EXPIRY_WARNING_DAYS = 30;

    protected function initializeHasLicenseAttributes(): void
    {
        $this->fillable = [
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
    }

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
            ->dontSubmitEmptyLogs();
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

        if ($endDate->lte($today->copy()->addDays(self::EXPIRY_WARNING_DAYS))) {
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
