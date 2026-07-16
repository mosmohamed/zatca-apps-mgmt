<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\License;
use App\Traits\SearchTrait;
use App\Traits\SortTrait;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class LicenseService
{
    use SearchTrait;
    use SortTrait;

    /**
     * @param  array{
     *     search?: string|null,
     *     sort?: string|null,
     *     per_page?: int|null,
     *     page?: int|null,
     *     environment?: string|null,
     *     status?: string|null
     * }  $filters
     * @return LengthAwarePaginator<int, License>
     */
    public function list(array $filters = []): LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));
        $page = max(1, (int) ($filters['page'] ?? 1));

        $query = License::query();

        $this->applyColumnSearch(
            $query,
            $filters['search'] ?? null,
            ['publisher', 'name', 'product', 'version', 'description', 'environment', 'proof_of_entitlement'],
        );
        $this->applyColumnSort(
            $query,
            $filters['sort'] ?? null,
            [
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
            ],
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

    public function find(int $id): License
    {
        return License::query()->findOrFail($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): License
    {
        return DB::transaction(function () use ($data): License {
            return License::query()->create($this->withComputedAvailable($data));
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(License $license, array $data): License
    {
        return DB::transaction(function () use ($license, $data): License {
            $license->update($this->withComputedAvailable($data, $license));

            return $license->refresh();
        });
    }

    public function delete(License $license): void
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

        $totals = License::query()
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
     * @param  Builder<License>  $query
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
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function withComputedAvailable(array $data, ?License $existing = null): array
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
