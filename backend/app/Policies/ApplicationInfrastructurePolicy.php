<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\ApplicationEnvironment;
use App\Models\User;

/**
 * Authorization for the application infrastructure module. Abilities map onto
 * the `application-infrastructure.*` Spatie permissions.
 *
 * `viewPublic` and `viewOperational` are field-level abilities used by the API
 * resources to decide whether internet exposure details and monitoring details
 * are included in the payload.
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
