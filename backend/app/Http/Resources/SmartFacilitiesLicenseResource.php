<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\SmartFacilitiesLicense;

/**
 * Smart Facilities licenses expose the same payload shape as Apps licenses.
 *
 * @mixin SmartFacilitiesLicense
 */
class SmartFacilitiesLicenseResource extends LicenseResource {}
