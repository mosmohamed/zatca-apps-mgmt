<?php

declare(strict_types=1);

namespace App\Http\Resources;

use App\Models\NetworkOpsLicense;

/**
 * Network Ops licenses expose the same payload shape as Apps licenses.
 *
 * @mixin NetworkOpsLicense
 */
class NetworkOpsLicenseResource extends LicenseResource {}
