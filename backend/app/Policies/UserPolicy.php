<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $this->isReader($user);
    }

    public function view(User $user, User $model): bool
    {
        return $this->isReader($user);
    }

    public function create(User $user): bool
    {
        return $this->isSuperAdmin($user);
    }

    public function update(User $user, User $model): bool
    {
        return $this->isSuperAdmin($user);
    }

    public function delete(User $user, User $model): bool
    {
        return $this->isSuperAdmin($user);
    }

    public function restore(User $user, User $model): bool
    {
        return $this->isSuperAdmin($user);
    }

    public function forceDelete(User $user, User $model): bool
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
