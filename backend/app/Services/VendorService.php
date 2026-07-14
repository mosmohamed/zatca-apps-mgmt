<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Vendor;
use App\Traits\SearchTrait;
use App\Traits\SortTrait;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class VendorService
{
    use SearchTrait;
    use SortTrait;

    /**
     * @param  array{search?: string|null, sort?: string|null, per_page?: int|null, page?: int|null}  $filters
     * @return LengthAwarePaginator<int, Vendor>
     */
    public function list(array $filters = []): LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));
        $page = max(1, (int) ($filters['page'] ?? 1));

        $query = Vendor::query();

        $this->applyColumnSearch($query, $filters['search'] ?? null, ['name', 'email', 'phone', 'contact_person_email']);
        $this->applyColumnSort($query, $filters['sort'] ?? null, ['name', 'email', 'status', 'created_at', 'updated_at'], '-created_at');

        return $query->paginate(perPage: $perPage, page: $page);
    }

    public function find(int $id): Vendor
    {
        return Vendor::query()->findOrFail($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): Vendor
    {
        return DB::transaction(static function () use ($data): Vendor {
            return Vendor::query()->create($data);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Vendor $vendor, array $data): Vendor
    {
        return DB::transaction(static function () use ($vendor, $data): Vendor {
            $vendor->update($data);

            return $vendor->refresh();
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

            return $vendor->refresh();
        });
    }
}
