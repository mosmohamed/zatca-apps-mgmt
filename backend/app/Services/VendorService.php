<?php

declare(strict_types=1);

namespace App\Services;

use App\Enums\OperationalArea;
use App\Models\Vendor;
use App\Models\VendorOperationalArea;
use App\Traits\SearchTrait;
use App\Traits\SortTrait;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class VendorService
{
    use SearchTrait;
    use SortTrait;

    /**
     * @param  array{search?: string|null, sort?: string|null, per_page?: int|null, page?: int|null, area?: string|null}  $filters
     * @return LengthAwarePaginator<int, Vendor>
     */
    public function list(array $filters = []): LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));
        $page = max(1, (int) ($filters['page'] ?? 1));

        $query = Vendor::query()->with(['operationalAreas']);

        $area = isset($filters['area']) ? trim((string) $filters['area']) : '';
        if ($area !== '' && in_array($area, OperationalArea::values(), true)) {
            $query->whereHas('operationalAreas', static function (Builder $builder) use ($area): void {
                $builder->where('area', $area);
            });
        }

        $this->applyColumnSearch($query, $filters['search'] ?? null, ['name', 'email', 'phone', 'contact_person_email']);
        $this->applyColumnSort($query, $filters['sort'] ?? null, ['name', 'email', 'status', 'created_at', 'updated_at'], '-created_at');

        return $query->paginate(perPage: $perPage, page: $page);
    }

    public function find(int $id): Vendor
    {
        return Vendor::query()->with(['operationalAreas'])->findOrFail($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Vendor
    {
        return DB::transaction(function () use ($data): Vendor {
            $areas = $this->extractAreas($data);
            $vendor = Vendor::query()->create($data);

            if ($areas !== null) {
                $this->syncAreas($vendor, $areas);
            }

            return $vendor->load(['operationalAreas']);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Vendor $vendor, array $data): Vendor
    {
        return DB::transaction(function () use ($vendor, $data): Vendor {
            $areas = $this->extractAreas($data);
            $vendor->update($data);

            if ($areas !== null) {
                $this->syncAreas($vendor, $areas);
            }

            return $vendor->refresh()->load(['operationalAreas']);
        });
    }

    public function delete(Vendor $vendor): void
    {
        DB::transaction(static function () use ($vendor): void {
            $vendor->delete();
        });
    }

    public function restore(Vendor $vendor): Vendor
    {
        return DB::transaction(static function () use ($vendor): Vendor {
            $vendor->restore();

            return $vendor->refresh()->load(['operationalAreas']);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     * @return list<string>|null
     */
    private function extractAreas(array &$data): ?array
    {
        if (! array_key_exists('areas', $data)) {
            return null;
        }

        /** @var list<string>|null $areas */
        $areas = $data['areas'];
        unset($data['areas']);

        if ($areas === null) {
            return null;
        }

        if (! is_array($areas)) {
            return [];
        }

        return array_values(array_unique(array_map('strval', $areas)));
    }

    /**
     * @param  list<string>  $areas
     */
    private function syncAreas(Vendor $vendor, array $areas): void
    {
        $allowed = OperationalArea::values();
        $normalized = array_values(array_intersect($areas, $allowed));

        $vendor->operationalAreas()->whereNotIn('area', $normalized)->delete();

        foreach ($normalized as $area) {
            VendorOperationalArea::query()->firstOrCreate(
                [
                    'vendor_id' => $vendor->id,
                    'area' => $area,
                ],
            );
        }
    }

    /**
     * @param  array{area?: string|null}  $filters
     * @return array{
     *     total: int,
     *     active: int,
     *     inactive: int,
     *     with_users: int
     * }
     */
    public function statistics(array $filters = []): array
    {
        $query = Vendor::query();

        $area = isset($filters['area']) ? trim((string) $filters['area']) : '';
        if ($area !== '' && in_array($area, OperationalArea::values(), true)) {
            $query->whereHas('operationalAreas', static function (Builder $builder) use ($area): void {
                $builder->where('area', $area);
            });
        }

        $totals = (clone $query)
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(CASE WHEN status = 1 THEN 1 ELSE 0 END) as active')
            ->selectRaw('SUM(CASE WHEN status = 0 THEN 1 ELSE 0 END) as inactive')
            ->first();

        return [
            'total' => (int) ($totals?->total ?? 0),
            'active' => (int) ($totals?->active ?? 0),
            'inactive' => (int) ($totals?->inactive ?? 0),
            'with_users' => (clone $query)->has('users')->count(),
        ];
    }
}
