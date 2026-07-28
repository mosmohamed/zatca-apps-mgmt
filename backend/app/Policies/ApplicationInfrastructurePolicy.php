<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\ApplicationEnvironment;
use App\Models\User;

/**
 * Field-level authorization for infrastructure payloads.
 *
 * Application-scoped access (assignment + permission, with Super Admin bypass)
 * is enforced via {@see ApplicationPolicy} before these abilities are consulted.
 * `viewPublic` and `viewOperational` only decide which sensitive fields are
 * included once the caller is already allowed to read the profile.
 */
class ApplicationInfrastructurePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('application-infrastructure.view');
    }

    public function view(User $user, ?ApplicationEnvironment $applicationEnvironment = null): bool
    {
        return $user->can('application-infrastructure.view');
    }

    public function create(User $user): bool
    {
        return $user->can('application-infrastructure.create');
    }

    public function update(User $user, ?ApplicationEnvironment $applicationEnvironment = null): bool
    {
        return $user->can('application-infrastructure.update');
    }

    public function delete(User $user, ?ApplicationEnvironment $applicationEnvironment = null): bool
    {
        return $user->can('application-infrastructure.delete');
    }

    public function restore(User $user, ?ApplicationEnvironment $applicationEnvironment = null): bool
    {
        return $user->can('application-infrastructure.delete');
    }

    public function forceDelete(User $user, ?ApplicationEnvironment $applicationEnvironment = null): bool
    {
        return $user->can('application-infrastructure.delete');
    }

    public function viewPublic(User $user): bool
    {
        return $user->can('application-infrastructure.view-public');
    }

    public function viewOperational(User $user): bool
    {
        return $user->can('application-infrastructure.view-operational');
    }

    public function copyEnvironment(User $user): bool
    {
        return $user->can('application-infrastructure.copy-environment');
    }
}
