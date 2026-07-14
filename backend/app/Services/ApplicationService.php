<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Application;
use App\Models\User;
use App\Traits\SearchTrait;
use App\Traits\SortTrait;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class ApplicationService
{
    use SearchTrait;
    use SortTrait;

    /**
     * @param  array{search?: string|null, sort?: string|null, per_page?: int|null, page?: int|null}  $filters
     * @return LengthAwarePaginator<int, Application>
     */
    public function list(array $filters = []): LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));
        $page = max(1, (int) ($filters['page'] ?? 1));

        $query = Application::query()->with([
            'department',
            'applicationType',
            'status',
            'criticality',
            'supportType',
            'technologies',
            'creator',
            'updater',
        ]);

        $this->applyColumnSearch(
            $query,
            $filters['search'] ?? null,
            ['name_ar', 'name_en', 'code', 'business_owner', 'technical_owner'],
        );
        $this->applyColumnSort(
            $query,
            $filters['sort'] ?? null,
            ['name_ar', 'name_en', 'code', 'created_at', 'updated_at'],
            '-created_at',
        );

        return $query->paginate(perPage: $perPage, page: $page);
    }

    public function find(int $id): Application
    {
        return Application::query()
            ->with([
                'department',
                'applicationType',
                'status',
                'criticality',
                'supportType',
                'technologies',
                'creator',
                'updater',
            ])
            ->findOrFail($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, User $actor): Application
    {
        return DB::transaction(static function () use ($data, $actor): Application {
            $technologyIds = self::extractTechnologyIds($data);

            $data['created_by'] = $actor->id;
            $data['updated_by'] = $actor->id;

            /** @var Application $application */
            $application = Application::query()->create($data);

            if ($technologyIds !== null) {
                $application->technologies()->sync($technologyIds);
            }

            return $application->load([
                'department',
                'applicationType',
                'status',
                'criticality',
                'supportType',
                'technologies',
                'creator',
                'updater',
            ]);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Application $application, array $data, User $actor): Application
    {
        return DB::transaction(static function () use ($application, $data, $actor): Application {
            $technologyIds = self::extractTechnologyIds($data);

            $data['updated_by'] = $actor->id;

            $application->update($data);

            if ($technologyIds !== null) {
                $application->technologies()->sync($technologyIds);
            }

            return $application->refresh()->load([
                'department',
                'applicationType',
                'status',
                'criticality',
                'supportType',
                'technologies',
                'creator',
                'updater',
            ]);
        });
    }

    public function delete(Application $application): void
    {
        DB::transaction(static function () use ($application): void {
            $application->delete();
        });
    }

    public function restore(Application $application): Application
    {
        return DB::transaction(static function () use ($application): Application {
            $application->restore();

            return $application->refresh()->load([
                'department',
                'applicationType',
                'status',
                'criticality',
                'supportType',
                'technologies',
                'creator',
                'updater',
            ]);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     * @return list<int>|null
     */
    private static function extractTechnologyIds(array &$data): ?array
    {
        if (! array_key_exists('technologies', $data)) {
            return null;
        }

        $raw = $data['technologies'];
        unset($data['technologies']);

        if (! is_array($raw)) {
            return [];
        }

        return array_values(array_unique(array_map(
            static fn (mixed $id): int => (int) $id,
            $raw,
        )));
    }
}
