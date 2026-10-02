<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\SmartFacilitiesLicense;

/**
 * Smart Facilities licenses catalogue.
 *
 * @extends AbstractLicenseService<SmartFacilitiesLicense>
 */
class SmartFacilitiesLicenseService extends AbstractLicenseService
{
    protected function modelClass(): string
    {
        return SmartFacilitiesLicense::class;
    }
}
