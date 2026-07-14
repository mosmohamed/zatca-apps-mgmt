<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Criticality;
use App\Models\User;

class CriticalityPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->isReader($user);
    }

    public function view(User $user, Criticality $criticality): bool
    {
        return $this->isReader($user);
    }

    public function create(User $user): bool
    {
        return $this->isSuperAdmin($user);
    }

    public function update(User $user, Criticality $criticality): bool
    {
        return $this->isSuperAdmin($user);
    }

    public function delete(User $user, Criticality $criticality): bool
    {
        return $this->isSuperAdmin($user);
    }

    private function isReader(User $user): bool
    {
        return $user->hasAnyRole(['super_admin', 'employee']);
    }

    private function isSuperAdmin(User $user): bool
    {
        return $user->hasRole('super_admin');
    }
}
