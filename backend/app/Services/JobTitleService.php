<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\JobTitle;
use App\Traits\SearchTrait;
use App\Traits\SortTrait;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class JobTitleService
{
    use SearchTrait;
    use SortTrait;

    /**
     * @param  array{search?: string|null, sort?: string|null, per_page?: int|null, page?: int|null}  $filters
     * @return LengthAwarePaginator<int, JobTitle>
     */
    public function list(array $filters = []): LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));
        $page = max(1, (int) ($filters['page'] ?? 1));

        $query = JobTitle::query();

        $this->applyColumnSearch($query, $filters['search'] ?? null, ['name_en', 'name_ar', 'description']);
        $this->applyColumnSort(
            $query,
            $filters['sort'] ?? null,
            ['name_en', 'name_ar', 'sort_order', 'is_active', 'created_at'],
            'sort_order',
        );

        return $query->paginate(perPage: $perPage, page: $page);
    }

    public function find(int $id): JobTitle
    {
        return JobTitle::query()->findOrFail($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): JobTitle
    {
        return DB::transaction(static function () use ($data): JobTitle {
            return JobTitle::query()->create($data);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(JobTitle $jobTitle, array $data): JobTitle
    {
        return DB::transaction(static function () use ($jobTitle, $data): JobTitle {
            $jobTitle->update($data);

            return $jobTitle->refresh();
        });
    }

    public function delete(JobTitle $jobTitle): void
    {
        DB::transaction(static function () use ($jobTitle): void {
            $jobTitle->delete();
        });
    }
}
