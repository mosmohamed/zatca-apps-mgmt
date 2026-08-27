<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ServiceDeskLicense;

/**
 * Service Desk licenses catalogue.
 *
 * @extends AbstractLicenseService<ServiceDeskLicense>
 */
class ServiceDeskLicenseService extends AbstractLicenseService
{
    protected function modelClass(): string
    {
        return ServiceDeskLicense::class;
    }
}
