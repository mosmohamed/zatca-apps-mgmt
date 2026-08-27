<?php

declare(strict_types=1);

namespace App\Policies;

use App\Policies\Concerns\ChecksEntityPermissions;

class ServiceDeskLicensePolicy
{
    use ChecksEntityPermissions;

    protected function entityPermissionPrefix(): string
    {
        return 'service-desk-licenses';
    }
}
