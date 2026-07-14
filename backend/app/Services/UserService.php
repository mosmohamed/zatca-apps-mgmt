<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use App\Traits\SearchTrait;
use App\Traits\SortTrait;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class UserService
{
    use SearchTrait;
    use SortTrait;

    /**
     * @param  array{search?: string|null, sort?: string|null, per_page?: int|null, page?: int|null}  $filters
     * @return LengthAwarePaginator<int, User>
     */
    public function list(array $filters = []): LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));
        $page = max(1, (int) ($filters['page'] ?? 1));

        $query = User::query()->with(['vendor', 'jobTitle']);

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
        return User::query()->with(['vendor', 'jobTitle'])->findOrFail($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): User
    {
        return DB::transaction(static function () use ($data): User {
            /** @var User $user */
            $user = User::query()->create($data);

            return $user->load(['vendor', 'jobTitle']);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(User $user, array $data): User
    {
        return DB::transaction(static function () use ($user, $data): User {
            if (array_key_exists('password', $data) && ($data['password'] === null || $data['password'] === '')) {
                unset($data['password']);
            }

            $user->update($data);

            return $user->refresh()->load(['vendor', 'jobTitle']);
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

            return $user->refresh()->load(['vendor', 'jobTitle']);
        });
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
