<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Application;
use App\Models\User;
use App\Policies\Concerns\ChecksEntityPermissions;
use Illuminate\Database\Eloquent\Model;

/**
 * Application main-data viewing is available to every authenticated user.
 * Mutations still require the standard `applications.*` Spatie permissions.
 *
 * Infrastructure access additionally requires an open assignment on that
 * application (Super Admin bypasses the assignment requirement).
 */
class ApplicationPolicy
{
    use ChecksEntityPermissions;

    protected function entityPermissionPrefix(): string
    {
        return 'applications';
    }

    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Model $model): bool
    {
        return true;
    }

    public function viewInfrastructure(User $user, Application $application): bool
    {
        return $this->allowsInfrastructure($user, $application, 'application-infrastructure.view');
    }

    public function createInfrastructure(User $user, Application $application): bool
    {
        return $this->allowsInfrastructure($user, $application, 'application-infrastructure.create');
    }

    public function updateInfrastructure(User $user, Application $application): bool
    {
        return $this->allowsInfrastructure($user, $application, 'application-infrastructure.update');
    }

    public function deleteInfrastructure(User $user, Application $application): bool
    {
        return $this->allowsInfrastructure($user, $application, 'application-infrastructure.delete');
    }

    public function copyInfrastructure(User $user, Application $application): bool
    {
        return $this->allowsInfrastructure($user, $application, 'application-infrastructure.copy-environment');
    }

    private function allowsInfrastructure(User $user, Application $application, string $permission): bool
    {
        if ($user->isSuperAdmin()) {
            return true;
        }

        if (! $user->can($permission)) {
            return false;
        }

        return $user->hasOpenAssignmentTo($application);
    }
}
