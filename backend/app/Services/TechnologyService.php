<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Technology;
use App\Traits\SearchTrait;
use App\Traits\SortTrait;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class TechnologyService
{
    use SearchTrait;
    use SortTrait;

    /**
     * @param  array{search?: string|null, sort?: string|null, per_page?: int|null, page?: int|null}  $filters
     * @return LengthAwarePaginator<int, Technology>
     */
    public function list(array $filters = []): LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));
        $page = max(1, (int) ($filters['page'] ?? 1));

        $query = Technology::query();

        $this->applyColumnSearch(
            $query,
            $filters['search'] ?? null,
            ['name', 'category', 'description'],
        );
        $this->applyColumnSort(
            $query,
            $filters['sort'] ?? null,
            ['name', 'category', 'is_active', 'created_at'],
            'name',
        );

        return $query->paginate(perPage: $perPage, page: $page);
    }

    public function find(int $id): Technology
    {
        return Technology::query()->findOrFail($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Technology
    {
        return DB::transaction(static function () use ($data): Technology {
            return Technology::query()->create($data);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Technology $technology, array $data): Technology
    {
        return DB::transaction(static function () use ($technology, $data): Technology {
            $technology->update($data);

            return $technology->refresh();
        });
    }

    public function delete(Technology $technology): void
    {
        DB::transaction(static function () use ($technology): void {
            $technology->delete();
        });
    }

    /**
     * @return array{
     *     total: int,
     *     active: int,
     *     inactive: int,
     *     in_use: int
     * }
     */
    public function statistics(): array
    {
        $totals = Technology::query()
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active')
            ->selectRaw('SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive')
            ->first();

        return [
            'total' => (int) ($totals?->total ?? 0),
            'active' => (int) ($totals?->active ?? 0),
            'inactive' => (int) ($totals?->inactive ?? 0),
            'in_use' => Technology::query()->has('applications')->count(),
        ];
    }

}
