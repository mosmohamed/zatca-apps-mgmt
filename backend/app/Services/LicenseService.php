<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\License;

/**
 * Apps licenses catalogue.
 *
 * @extends AbstractLicenseService<License>
 */
class LicenseService extends AbstractLicenseService
{
    protected function modelClass(): string
    {
        return License::class;
    }
}
