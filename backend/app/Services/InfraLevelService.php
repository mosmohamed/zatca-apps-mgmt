<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\InfraLevel;
use App\Traits\SearchTrait;
use App\Traits\SortTrait;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class InfraLevelService
{
    use SearchTrait;
    use SortTrait;

    /**
     * @param  array{search?: string|null, sort?: string|null, per_page?: int|null, page?: int|null, active_only?: bool|null}  $filters
     * @return LengthAwarePaginator<int, InfraLevel>
     */
    public function list(array $filters = []): LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 50), 100));
        $page = max(1, (int) ($filters['page'] ?? 1));

        $query = InfraLevel::query();

        if (! empty($filters['active_only'])) {
            $query->where('is_active', true);
        }

        $this->applyColumnSearch($query, $filters['search'] ?? null, ['name_en', 'name_ar', 'code', 'note_en', 'note_ar']);
        $this->applyColumnSort(
            $query,
            $filters['sort'] ?? null,
            ['name_en', 'name_ar', 'code', 'sort_order', 'is_active', 'created_at'],
            'sort_order',
        );

        return $query->paginate(perPage: $perPage, page: $page);
    }

    /**
     * @return Collection<int, InfraLevel>
     */
    public function activeOrdered(): Collection
    {
        return InfraLevel::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name_en')
            ->get();
    }

    public function find(int $id): InfraLevel
    {
        return InfraLevel::query()->findOrFail($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): InfraLevel
    {
        return DB::transaction(static function () use ($data): InfraLevel {
            return InfraLevel::query()->create($data);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(InfraLevel $level, array $data): InfraLevel
    {
        return DB::transaction(static function () use ($level, $data): InfraLevel {
            $level->update($data);

            return $level->refresh();
        });
    }

    public function delete(InfraLevel $level): void
    {
        DB::transaction(static function () use ($level): void {
            $level->delete();
        });
    }
}
