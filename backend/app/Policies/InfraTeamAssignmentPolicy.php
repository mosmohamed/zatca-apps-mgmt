<?php

declare(strict_types=1);

namespace App\Policies;

use App\Policies\Concerns\ChecksEntityPermissions;

class InfraTeamAssignmentPolicy
{
    use ChecksEntityPermissions;

    protected function entityPermissionPrefix(): string
    {
        return 'infra-team-assignments';
    }
}
