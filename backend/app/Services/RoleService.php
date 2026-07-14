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
