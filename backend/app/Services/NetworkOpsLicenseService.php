<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\NetworkOpsLicense;

/**
 * Network Ops licenses catalogue.
 *
 * @extends AbstractLicenseService<NetworkOpsLicense>
 */
class NetworkOpsLicenseService extends AbstractLicenseService
{
    protected function modelClass(): string
    {
        return NetworkOpsLicense::class;
    }
}
