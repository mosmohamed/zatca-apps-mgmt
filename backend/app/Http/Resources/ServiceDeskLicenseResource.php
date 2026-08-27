<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\ServiceDeskLicense;

/**
 * Service Desk licenses expose the same payload shape as Apps licenses.
 *
 * @mixin ServiceDeskLicense
 */
class ServiceDeskLicenseResource extends LicenseResource {}
