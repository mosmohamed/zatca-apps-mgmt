<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Department;
use App\Traits\SearchTrait;
use App\Traits\SortTrait;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class DepartmentService
{
    use SearchTrait;
    use SortTrait;

    /**
     * @param  array{search?: string|null, sort?: string|null, per_page?: int|null, page?: int|null}  $filters
     * @return LengthAwarePaginator<int, Department>
     */
    public function list(array $filters = []): LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));
        $page = max(1, (int) ($filters['page'] ?? 1));

        $query = Department::query();

        $this->applyColumnSearch($query, $filters['search'] ?? null, ['name_ar', 'name_en']);
        $this->applyColumnSort($query, $filters['sort'] ?? null, ['name_ar', 'name_en', 'created_at', 'updated_at'], 'name_en');

        return $query->paginate(perPage: $perPage, page: $page);
    }

    public function find(int $id): Department
    {
        return Department::query()->findOrFail($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Department
    {
        return DB::transaction(static function () use ($data): Department {
            return Department::query()->create($data);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Department $department, array $data): Department
    {
        return DB::transaction(static function () use ($department, $data): Department {
            $department->update($data);

            return $department->refresh();
        });
    }

    public function delete(Department $department): void
    {
        DB::transaction(static function () use ($department): void {
            $department->delete();
        });
    }
}
