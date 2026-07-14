<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ApplicationStatus;
use App\Traits\SearchTrait;
use App\Traits\SortTrait;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class ApplicationStatusService
{
    use SearchTrait;
    use SortTrait;

    /**
     * @param  array{search?: string|null, sort?: string|null, per_page?: int|null, page?: int|null}  $filters
     * @return LengthAwarePaginator<int, ApplicationStatus>
     */
    public function list(array $filters = []): LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));
        $page = max(1, (int) ($filters['page'] ?? 1));

        $query = ApplicationStatus::query();

        $this->applyColumnSearch($query, $filters['search'] ?? null, ['name_en', 'name_ar', 'code']);
        $this->applyColumnSort(
            $query,
            $filters['sort'] ?? null,
            ['name_en', 'name_ar', 'code', 'is_active', 'created_at'],
            'name_en',
        );

        return $query->paginate(perPage: $perPage, page: $page);
    }

    public function find(int $id): ApplicationStatus
    {
        return ApplicationStatus::query()->findOrFail($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): ApplicationStatus
    {
        return DB::transaction(static function () use ($data): ApplicationStatus {
            return ApplicationStatus::query()->create($data);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(ApplicationStatus $applicationStatus, array $data): ApplicationStatus
    {
        return DB::transaction(static function () use ($applicationStatus, $data): ApplicationStatus {
            $applicationStatus->update($data);

            return $applicationStatus->refresh();
        });
    }

    public function delete(ApplicationStatus $applicationStatus): void
    {
        DB::transaction(static function () use ($applicationStatus): void {
            $applicationStatus->delete();
        });
    }
}
