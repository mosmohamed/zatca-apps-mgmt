<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\SupportType;
use App\Models\User;

class SupportTypePolicy
{
    public function viewAny(User $user): bool
    {
        return $this->isReader($user);
    }

    public function view(User $user, SupportType $supportType): bool
    {
        return $this->isReader($user);
    }

    public function create(User $user): bool
    {
        return $this->isSuperAdmin($user);
    }

    public function update(User $user, SupportType $supportType): bool
    {
        return $this->isSuperAdmin($user);
    }

    public function delete(User $user, SupportType $supportType): bool
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
