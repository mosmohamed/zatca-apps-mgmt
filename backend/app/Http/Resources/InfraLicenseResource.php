<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\InfraLicense;

/**
 * Infrastructure licenses expose the same payload shape as Apps licenses.
 *
 * @mixin InfraLicense
 */
class InfraLicenseResource extends LicenseResource {}
