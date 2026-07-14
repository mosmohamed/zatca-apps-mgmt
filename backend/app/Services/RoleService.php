<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use RuntimeException;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleService
{
    private const string PROTECTED_ROLE = 'super_admin';

    /**
     * @return Collection<int, Role>
     */
    public function list(): Collection
    {
        return $this->roleQuery()
            ->with('permissions')
            ->orderBy('name')
            ->get();
    }

    public function find(int $id): Role
    {
        return $this->roleQuery()
            ->with('permissions')
            ->findOrFail($id);
    }

    /**
     * @param  array{name: string, permissions?: list<string>}  $data
     */
    public function create(array $data): Role
    {
        return DB::transaction(function () use ($data): Role {
            /** @var Role $role */
            $role = Role::query()->create([
                'name' => $data['name'],
                'guard_name' => 'web',
            ]);

            if (array_key_exists('permissions', $data)) {
                $role->syncPermissions($data['permissions']);
            }

            $this->forgetPermissionCache();

            return $this->find($role->id);
        });
    }

    public function updateName(Role $role, string $name): Role
    {
        $this->guardProtectedRole($role);

        return DB::transaction(function () use ($role, $name): Role {
            $role->update(['name' => $name]);

            $this->forgetPermissionCache();

            return $this->find($role->id);
        });
    }

    /**
     * @param  list<string>  $permissionNames
     */
    public function syncPermissions(Role $role, array $permissionNames): Role
    {
        return DB::transaction(function () use ($role, $permissionNames): Role {
            $role->syncPermissions($permissionNames);

            $this->forgetPermissionCache();

            return $this->find($role->id);
        });
    }

    public function delete(Role $role): void
    {
        $this->guardProtectedRole($role);

        DB::transaction(function () use ($role): void {
            $role->delete();

            $this->forgetPermissionCache();
        });
    }

    /**
     * @param  array{search?: string|null, page?: int|null, per_page?: int|null}  $filters
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator<int, User>
     */
    public function listUsers(Role $role, array $filters = []): \Illuminate\Contracts\Pagination\LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));
        $page = max(1, (int) ($filters['page'] ?? 1));

        $query = User::query()
            ->role($role->name, 'web')
            ->with(['vendor', 'jobTitle', 'roles'])
            ->orderBy('first_name')
            ->orderBy('last_name');

        $search = $filters['search'] ?? null;
        if (is_string($search) && trim($search) !== '') {
            $term = '%'.trim($search).'%';
            $query->where(static function (Builder $builder) use ($term): void {
                $builder
                    ->where('first_name', 'like', $term)
                    ->orWhere('last_name', 'like', $term)
                    ->orWhere('email', 'like', $term);
            });
        }

        return $query->paginate(perPage: $perPage, page: $page);
    }

    /**
     * @param  list<int>  $userIds
     */
    public function syncUsers(Role $role, array $userIds, ?User $actor = null): Role
    {
        if ($role->name === self::PROTECTED_ROLE && ($actor === null || ! $actor->hasRole('super_admin'))) {
            throw new RuntimeException('Only a super admin can manage super_admin membership.');
        }

        return DB::transaction(function () use ($role, $userIds): Role {
            $uniqueIds = array_values(array_unique(array_map('intval', $userIds)));

            // Prefer User::assignRole/removeRole (avoids Spatie Role::users() under Sanctum).
            $currentlyAssigned = User::role($role->name, 'web')->pluck('id')->all();
            $toDetach = array_diff($currentlyAssigned, $uniqueIds);
            $toAttach = array_diff($uniqueIds, $currentlyAssigned);

            if ($toDetach !== []) {
                User::query()
                    ->whereIn('id', $toDetach)
                    ->get()
                    ->each(static function (User $user) use ($role): void {
                        $user->removeRole($role);
                    });
            }

            if ($toAttach !== []) {
                User::query()
                    ->whereIn('id', $toAttach)
                    ->get()
                    ->each(static function (User $user) use ($role): void {
                        $user->assignRole($role);
                    });
            }

            $this->forgetPermissionCache();

            return $this->find($role->id);
        });
    }

    public function attachUser(Role $role, User $user, ?User $actor = null): void
    {
        if ($role->name === self::PROTECTED_ROLE && ($actor === null || ! $actor->hasRole('super_admin'))) {
            throw new RuntimeException('Only a super admin can assign the super_admin role.');
        }

        if (! $user->hasRole($role->name)) {
            $user->assignRole($role);
            $this->forgetPermissionCache();
        }
    }

    public function detachUser(Role $role, User $user, ?User $actor = null): void
    {
        if ($role->name === self::PROTECTED_ROLE && ($actor === null || ! $actor->hasRole('super_admin'))) {
            throw new RuntimeException('Only a super admin can remove the super_admin role.');
        }

        if ($user->hasRole($role->name)) {
            $user->removeRole($role);
            $this->forgetPermissionCache();
        }
    }

    /**
     * Count assigned users via an explicit subquery.
     *
     * Avoid Spatie's `users()` / `withCount('users')` under Sanctum: the package
     * resolves the related model from Auth::getDefaultDriver() (sanctum), and
     * `getModelForGuard('sanctum')` returns null unless a sanctum guard exists.
     *
     * @return Builder<Role>
     */
    private function roleQuery(): Builder
    {
        $pivotTable = (string) config('permission.table_names.model_has_roles');
        $roleKey = (string) (config('permission.column_names.role_pivot_key') ?: 'role_id');

        return Role::query()->addSelect([
            'users_count' => DB::table($pivotTable)
                ->selectRaw('count(*)')
                ->whereColumn($pivotTable.'.'.$roleKey, 'roles.id')
                ->where($pivotTable.'.model_type', (new User)->getMorphClass()),
        ]);
    }

    private function guardProtectedRole(Role $role): void
    {
        if ($role->name === self::PROTECTED_ROLE) {
            throw new RuntimeException('The super_admin role cannot be modified or deleted.');
        }
    }

    private function forgetPermissionCache(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }
}
