<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\OperationalArea;
use App\Models\User;
use App\Models\UserOperationalArea;
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
     * @param  array{search?: string|null, sort?: string|null, per_page?: int|null, page?: int|null, area?: string|null}  $filters
     * @return LengthAwarePaginator<int, User>
     */
    public function list(array $filters = []): LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));
        $page = max(1, (int) ($filters['page'] ?? 1));

        $query = User::query()->with(['vendor', 'jobTitle', 'roles', 'operationalAreas']);

        $area = isset($filters['area']) ? trim((string) $filters['area']) : '';
        if ($area !== '' && in_array($area, OperationalArea::values(), true)) {
            $query->whereHas('operationalAreas', static function (Builder $builder) use ($area): void {
                $builder->where('area', $area);
            });
        }

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
        return User::query()->with(['vendor', 'jobTitle', 'roles', 'operationalAreas'])->findOrFail($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, ?User $actor = null): User
    {
        return DB::transaction(function () use ($data, $actor): User {
            $roles = $this->extractRoles($data);
            $areas = $this->extractAreas($data);
            unset($data['password_confirmation']);

            /** @var User $user */
            $user = User::query()->create($data);

            if ($roles !== null) {
                $this->syncUserRoles($user, $roles, $actor);
            }

            if ($areas !== null) {
                $this->syncAreas($user, $areas);
            }

            return $user->load(['vendor', 'jobTitle', 'roles', 'operationalAreas']);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(User $user, array $data, ?User $actor = null): User
    {
        return DB::transaction(function () use ($user, $data, $actor): User {
            $roles = $this->extractRoles($data);
            $areas = $this->extractAreas($data);
            unset($data['password_confirmation']);

            if (array_key_exists('password', $data) && ($data['password'] === null || $data['password'] === '')) {
                unset($data['password']);
            }

            $user->update($data);

            if ($roles !== null) {
                $this->syncUserRoles($user, $roles, $actor);
            }

            if ($areas !== null) {
                $this->syncAreas($user, $areas);
            }

            return $user->refresh()->load(['vendor', 'jobTitle', 'roles', 'operationalAreas']);
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

            return $user->refresh()->load(['vendor', 'jobTitle', 'roles', 'operationalAreas']);
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
     * @param  array<string, mixed>  $data
     * @return list<string>|null
     */
    private function extractAreas(array &$data): ?array
    {
        if (! array_key_exists('areas', $data)) {
            return null;
        }

        /** @var list<string>|null $areas */
        $areas = $data['areas'];
        unset($data['areas']);

        if ($areas === null) {
            return null;
        }

        if (! is_array($areas)) {
            return [];
        }

        return array_values(array_unique(array_map('strval', $areas)));
    }

    /**
     * @param  list<string>  $areas
     */
    private function syncAreas(User $user, array $areas): void
    {
        $allowed = OperationalArea::values();
        $normalized = array_values(array_intersect($areas, $allowed));

        $user->operationalAreas()->whereNotIn('area', $normalized)->delete();

        foreach ($normalized as $area) {
            UserOperationalArea::query()->firstOrCreate(
                [
                    'user_id' => $user->id,
                    'area' => $area,
                ],
            );
        }
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

    /**
     * @param  array{area?: string|null}  $filters
     * @return array{
     *     total: int,
     *     active: int,
     *     inactive: int,
     *     with_open_assignments: int
     * }
     */
    public function statistics(array $filters = []): array
    {
        $query = User::query();

        $area = isset($filters['area']) ? trim((string) $filters['area']) : '';
        if ($area !== '' && in_array($area, OperationalArea::values(), true)) {
            $query->whereHas('operationalAreas', static function (Builder $builder) use ($area): void {
                $builder->where('area', $area);
            });
        }

        $totals = (clone $query)
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active')
            ->selectRaw('SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive')
            ->first();

        $withAssignments = (clone $query)
            ->whereHas('assignments', static function ($builder): void {
                $builder->open();
            })
            ->count();

        return [
            'total' => (int) ($totals?->total ?? 0),
            'active' => (int) ($totals?->active ?? 0),
            'inactive' => (int) ($totals?->inactive ?? 0),
            'with_open_assignments' => $withAssignments,
        ];
    }
}
