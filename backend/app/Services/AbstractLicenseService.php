<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Contracts\LicenseRecord;
use App\Traits\SearchTrait;
use App\Traits\SortTrait;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

/**
 * Shared read/write pipeline for the independent license catalogues
 * (Apps, Infrastructure and Service Desk). Each catalogue owns its own table
 * and permission prefix; only the backing model differs.
 *
 * @template TModel of Model&LicenseRecord
 */
abstract class AbstractLicenseService
{
    use SearchTrait;
    use SortTrait;

    /**
     * @return class-string<TModel>
     */
    abstract protected function modelClass(): string;

    /**
     * @param  array{
     *     search?: string|null,
     *     sort?: string|null,
     *     per_page?: int|null,
     *     page?: int|null,
     *     environment?: string|null,
     *     status?: string|null
     * }  $filters
     * @return LengthAwarePaginator<int, TModel>
     */
    public function list(array $filters = []): LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));
        $page = max(1, (int) ($filters['page'] ?? 1));

        $query = $this->newQuery();

        $this->applyColumnSearch(
            $query,
            $filters['search'] ?? null,
            $this->searchableColumns(),
        );
        $this->applyColumnSort(
            $query,
            $filters['sort'] ?? null,
            $this->sortableColumns(),
            'name',
        );

        $environment = $filters['environment'] ?? null;
        if (is_string($environment) && $environment !== '') {
            $query->where('environment', $environment);
        }

        $status = $filters['status'] ?? null;
        if (is_string($status) && $status !== '') {
            $this->applyStatusFilter($query, $status);
        }

        return $query->paginate(perPage: $perPage, page: $page);
    }

    /**
     * @return TModel
     */
    public function find(int $id): Model
    {
        return $this->newQuery()->findOrFail($id);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return TModel
     */
    public function create(array $data): Model
    {
        return DB::transaction(function () use ($data): Model {
            return $this->newQuery()->create($this->withComputedAvailable($data));
        });
    }

    /**
     * @param  TModel  $license
     * @param  array<string, mixed>  $data
     * @return TModel
     */
    public function update(Model $license, array $data): Model
    {
        return DB::transaction(function () use ($license, $data): Model {
            $license->update($this->withComputedAvailable($data, $license));

            return $license->refresh();
        });
    }

    /**
     * @param  TModel  $license
     */
    public function delete(Model $license): void
    {
        DB::transaction(static function () use ($license): void {
            $license->delete();
        });
    }

    /**
     * @return array{
     *     total_licenses: int,
     *     total_licensed: int,
     *     total_used: int,
     *     total_available: int,
     *     expiring_within_30_days: int,
     *     expired: int
     * }
     */
    public function statistics(): array
    {
        $today = now()->toDateString();
        $within30 = now()->addDays(30)->toDateString();

        $totals = $this->newQuery()
            ->selectRaw('COUNT(*) as total_licenses')
            ->selectRaw('COALESCE(SUM(licensed), 0) as total_licensed')
            ->selectRaw('COALESCE(SUM(used), 0) as total_used')
            ->selectRaw('COALESCE(SUM(available), 0) as total_available')
            ->selectRaw(
                'SUM(CASE WHEN end_date IS NOT NULL AND end_date >= ? AND end_date <= ? THEN 1 ELSE 0 END) as expiring_within_30_days',
                [$today, $within30],
            )
            ->selectRaw(
                'SUM(CASE WHEN end_date IS NOT NULL AND end_date < ? THEN 1 ELSE 0 END) as expired',
                [$today],
            )
            ->first();

        return [
            'total_licenses' => (int) ($totals?->total_licenses ?? 0),
            'total_licensed' => (int) ($totals?->total_licensed ?? 0),
            'total_used' => (int) ($totals?->total_used ?? 0),
            'total_available' => (int) ($totals?->total_available ?? 0),
            'expiring_within_30_days' => (int) ($totals?->expiring_within_30_days ?? 0),
            'expired' => (int) ($totals?->expired ?? 0),
        ];
    }

    /**
     * @return Builder<TModel>
     */
    protected function newQuery(): Builder
    {
        $model = $this->modelClass();

        return $model::query();
    }

    /**
     * @return list<string>
     */
    protected function searchableColumns(): array
    {
        return ['publisher', 'name', 'product', 'version', 'description', 'environment', 'proof_of_entitlement'];
    }

    /**
     * @return list<string>
     */
    protected function sortableColumns(): array
    {
        return [
            'publisher',
            'name',
            'product',
            'version',
            'description',
            'environment',
            'proof_of_entitlement',
            'licensed',
            'used',
            'available',
            'start_date',
            'end_date',
            'created_at',
        ];
    }

    /**
     * @param  Builder<TModel>  $query
     */
    private function applyStatusFilter(Builder $query, string $status): void
    {
        $today = now()->toDateString();
        $within30 = now()->addDays(30)->toDateString();

        match ($status) {
            'expired' => $query
                ->whereNotNull('end_date')
                ->where('end_date', '<', $today),
            'expiring_soon' => $query
                ->whereNotNull('end_date')
                ->where('end_date', '>=', $today)
                ->where('end_date', '<=', $within30),
            'active' => $query->where(static function (Builder $builder) use ($within30): void {
                $builder
                    ->whereNull('end_date')
                    ->orWhere('end_date', '>', $within30);
            }),
            default => null,
        };
    }

    /**
     * `available` is always derived server-side so the three catalogues can never
     * drift from `licensed - used`.
     *
     * @param  array<string, mixed>  $data
     * @param  TModel|null  $existing
     * @return array<string, mixed>
     */
    private function withComputedAvailable(array $data, ?Model $existing = null): array
    {
        unset($data['available']);

        $licensed = array_key_exists('licensed', $data)
            ? (int) $data['licensed']
            : (int) ($existing?->licensed ?? 0);
        $used = array_key_exists('used', $data)
            ? (int) $data['used']
            : (int) ($existing?->used ?? 0);

        $data['available'] = max(0, $licensed - $used);

        return $data;
    }
}
