<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\SupportType;
use App\Traits\SearchTrait;
use App\Traits\SortTrait;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class SupportTypeService
{
    use SearchTrait;
    use SortTrait;

    /**
     * @param  array{search?: string|null, sort?: string|null, per_page?: int|null, page?: int|null}  $filters
     * @return LengthAwarePaginator<int, SupportType>
     */
    public function list(array $filters = []): LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));
        $page = max(1, (int) ($filters['page'] ?? 1));

        $query = SupportType::query();

        $this->applyColumnSearch($query, $filters['search'] ?? null, ['name_en', 'name_ar', 'code']);
        $this->applyColumnSort(
            $query,
            $filters['sort'] ?? null,
            ['name_en', 'name_ar', 'code', 'is_active', 'created_at'],
            'name_en',
        );

        return $query->paginate(perPage: $perPage, page: $page);
    }

    public function find(int $id): SupportType
    {
        return SupportType::query()->findOrFail($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): SupportType
    {
        return DB::transaction(static function () use ($data): SupportType {
            return SupportType::query()->create($data);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(SupportType $supportType, array $data): SupportType
    {
        return DB::transaction(static function () use ($supportType, $data): SupportType {
            $supportType->update($data);

            return $supportType->refresh();
        });
    }

    public function delete(SupportType $supportType): void
    {
        DB::transaction(static function () use ($supportType): void {
            $supportType->delete();
        });
    }
}
