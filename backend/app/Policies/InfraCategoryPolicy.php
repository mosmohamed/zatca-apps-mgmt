<?php

declare(strict_types=1);

namespace App\Policies;

use App\Policies\Concerns\ChecksEntityPermissions;

class InfraCategoryPolicy
{
    use ChecksEntityPermissions;

    protected function entityPermissionPrefix(): string
    {
        return 'infra-categories';
    }
}
