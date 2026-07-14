<?php

declare(strict_types=1);

namespace App\Policies\Concerns;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

/**
 * Maps standard Eloquent policy abilities onto Spatie permission checks for
 * a given entity prefix (e.g. "departments" -> "departments.view").
 */
trait ChecksEntityPermissions
{
    /**
     * Permission prefix for this entity, e.g. "departments", "applications".
     */
    abstract protected function entityPermissionPrefix(): string;

    public function viewAny(User $user): bool
    {
        return $user->can($this->entityPermissionPrefix().'.view');
    }

    public function view(User $user, Model $model): bool
    {
        return $user->can($this->entityPermissionPrefix().'.view');
    }

    public function create(User $user): bool
    {
        return $user->can($this->entityPermissionPrefix().'.create');
    }

    public function update(User $user, Model $model): bool
    {
        return $user->can($this->entityPermissionPrefix().'.update');
    }

    public function delete(User $user, Model $model): bool
    {
        return $user->can($this->entityPermissionPrefix().'.delete');
    }

    public function restore(User $user, Model $model): bool
    {
        return $user->can($this->entityPermissionPrefix().'.delete');
    }

    public function forceDelete(User $user, Model $model): bool
    {
        return $user->can($this->entityPermissionPrefix().'.delete');
    }

    public function export(User $user): bool
    {
        return $user->can($this->entityPermissionPrefix().'.export');
    }
}
