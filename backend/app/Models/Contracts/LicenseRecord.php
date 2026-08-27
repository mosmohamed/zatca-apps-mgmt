<?php

declare(strict_types=1);

namespace App\Models\Contracts;

/**
 * Implemented by every independent license catalogue model
 * (Apps, Infrastructure and Service Desk).
 */
interface LicenseRecord
{
    /**
     * @return 'expired'|'expiring_soon'|'active'
     */
    public function status(): string;

    public function daysRemaining(): ?int;
}
