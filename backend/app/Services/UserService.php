<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use App\Traits\SearchTrait;
use App\Traits\SortTrait;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

class UserService
{
    use SearchTrait;
    use SortTrait;

    private const string ROLE_GUARD = 'web';

    /**
     * @param  array{search?: string|null, sort?: string|null, per_page?: int|null, page?: int|null}  $filters
     * @return LengthAwarePaginator<int, User>
     */
    public function list(array $filters = []): LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));
        $page = max(1, (int) ($filters['page'] ?? 1));

        $query = User::query()->with(['vendor', 'jobTitle', 'roles']);

        $this->applyUserSearch($query, $filters['search'] ?? null);
        $this->applyColumnSort(
            $query,
            $filters['sort'] ?? null,
            ['first_name', 'last_name', 'email', 'is_active', 'created_at', 'updated_at'],
            '-created_at',
        );

        return $query->paginate(perPage: $perPage, page: $page);
    }

    public function find(int $id): User
    {
        return User::query()->with(['vendor', 'jobTitle', 'roles'])->findOrFail($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, ?User $actor = null): User
    {
        return DB::transaction(function () use ($data, $actor): User {
            $roles = $this->extractRoles($data);
            unset($data['password_confirmation']);

            /** @var User $user */
            $user = User::query()->create($data);

            if ($roles !== null) {
                $this->syncUserRoles($user, $roles, $actor);
            }

            return $user->load(['vendor', 'jobTitle', 'roles']);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(User $user, array $data, ?User $actor = null): User
    {
        return DB::transaction(function () use ($user, $data, $actor): User {
            $roles = $this->extractRoles($data);
            unset($data['password_confirmation']);

            if (array_key_exists('password', $data) && ($data['password'] === null || $data['password'] === '')) {
                unset($data['password']);
            }

            $user->update($data);

            if ($roles !== null) {
                $this->syncUserRoles($user, $roles, $actor);
            }

            return $user->refresh()->load(['vendor', 'jobTitle', 'roles']);
        });
    }

    public function delete(User $user): void
    {
        DB::transaction(static function () use ($user): void {
            $user->delete();
        });
    }

    public function restore(User $user): User
    {
        return DB::transaction(static function () use ($user): User {
            $user->restore();

            return $user->refresh()->load(['vendor', 'jobTitle', 'roles']);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     * @return list<string>|null
     */
    private function extractRoles(array &$data): ?array
    {
        if (! array_key_exists('roles', $data)) {
            return null;
        }

        /** @var list<string>|null $roles */
        $roles = $data['roles'];
        unset($data['roles']);

        if ($roles === null) {
            return null;
        }

        return array_values(array_unique(array_map('strval', $roles)));
    }

    /**
     * @param  list<string>  $roleNames
     */
    private function syncUserRoles(User $user, array $roleNames, ?User $actor): void
    {
        $this->assertCanAssignRoles($roleNames, $actor);

        $roles = Role::query()
            ->where('guard_name', self::ROLE_GUARD)
            ->whereIn('name', $roleNames)
            ->get();

        if ($roles->count() !== count($roleNames)) {
            throw ValidationException::withMessages([
                'roles' => [__('messages.validation.exists', ['attribute' => 'roles'])],
            ]);
        }

        $user->syncRoles($roles);
    }

    /**
     * @param  list<string>  $roleNames
     */
    private function assertCanAssignRoles(array $roleNames, ?User $actor): void
    {
        if (! in_array('super_admin', $roleNames, true)) {
            return;
        }

        if ($actor === null || ! $actor->hasRole('super_admin')) {
            throw ValidationException::withMessages([
                'roles' => [__('messages.roles.super_admin_assign_forbidden')],
            ]);
        }
    }

    /**
     * @param  Builder<User>  $query
     */
    private function applyUserSearch(Builder $query, ?string $search): void
    {
        if ($search === null || trim($search) === '') {
            return;
        }

        $term = '%'.trim($search).'%';

        $query->where(static function (Builder $builder) use ($term): void {
            $builder
                ->where('first_name', 'like', $term)
                ->orWhere('last_name', 'like', $term)
                ->orWhere('email', 'like', $term)
                ->orWhere('phone', 'like', $term)
                ->orWhereHas('jobTitle', static function (Builder $jobTitleQuery) use ($term): void {
                    $jobTitleQuery
                        ->where('name_en', 'like', $term)
                        ->orWhere('name_ar', 'like', $term);
                });
        });
    }
}
