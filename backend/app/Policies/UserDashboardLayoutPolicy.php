<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\User;

/**
 * Every dashboard user manages only their own layout, so the abilities are
 * resolved from the `dashboard-layout.manage` permission without a model.
 */
class UserDashboardLayoutPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('dashboard-layout.manage');
    }

    public function update(User $user): bool
    {
        return $user->can('dashboard-layout.manage');
    }

    public function delete(User $user): bool
    {
        return $user->can('dashboard-layout.manage');
    }
}
