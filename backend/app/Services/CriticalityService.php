<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Criticality;
use App\Traits\SearchTrait;
use App\Traits\SortTrait;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class CriticalityService
{
    use SearchTrait;
    use SortTrait;

    /**
     * @param  array{search?: string|null, sort?: string|null, per_page?: int|null, page?: int|null}  $filters
     * @return LengthAwarePaginator<int, Criticality>
     */
    public function list(array $filters = []): LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));
        $page = max(1, (int) ($filters['page'] ?? 1));

        $query = Criticality::query();

        $this->applyColumnSearch($query, $filters['search'] ?? null, ['name_en', 'name_ar', 'code']);
        $this->applyColumnSort(
            $query,
            $filters['sort'] ?? null,
            ['name_en', 'name_ar', 'code', 'is_active', 'created_at'],
            'name_en',
        );

        return $query->paginate(perPage: $perPage, page: $page);
    }

    public function find(int $id): Criticality
    {
        return Criticality::query()->findOrFail($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Criticality
    {
        return DB::transaction(static function () use ($data): Criticality {
            return Criticality::query()->create($data);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Criticality $criticality, array $data): Criticality
    {
        return DB::transaction(static function () use ($criticality, $data): Criticality {
            $criticality->update($data);

            return $criticality->refresh();
        });
    }

    public function delete(Criticality $criticality): void
    {
        DB::transaction(static function () use ($criticality): void {
            $criticality->delete();
        });
    }
}
