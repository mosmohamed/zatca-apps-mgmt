<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\AppRole;
use App\Traits\SearchTrait;
use App\Traits\SortTrait;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class AppRoleService
{
    use SearchTrait;
    use SortTrait;

    /**
     * @param  array{search?: string|null, sort?: string|null, per_page?: int|null, page?: int|null}  $filters
     * @return LengthAwarePaginator<int, AppRole>
     */
    public function list(array $filters = []): LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));
        $page = max(1, (int) ($filters['page'] ?? 1));

        $query = AppRole::query();

        $this->applyColumnSearch($query, $filters['search'] ?? null, ['name', 'description']);
        $this->applyColumnSort(
            $query,
            $filters['sort'] ?? null,
            ['name', 'sort_order', 'is_active', 'created_at'],
            'sort_order',
        );

        return $query->paginate(perPage: $perPage, page: $page);
    }

    public function find(int $id): AppRole
    {
        return AppRole::query()->findOrFail($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): AppRole
    {
        return DB::transaction(static function () use ($data): AppRole {
            return AppRole::query()->create($data);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(AppRole $appRole, array $data): AppRole
    {
        return DB::transaction(static function () use ($appRole, $data): AppRole {
            $appRole->update($data);

            return $appRole->refresh();
        });
    }

    public function delete(AppRole $appRole): void
    {
        DB::transaction(static function () use ($appRole): void {
            $appRole->delete();
        });
    }
}
