<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\InfraLicense;

/**
 * Infrastructure licenses catalogue.
 *
 * @extends AbstractLicenseService<InfraLicense>
 */
class InfraLicenseService extends AbstractLicenseService
{
    protected function modelClass(): string
    {
        return InfraLicense::class;
    }
}
