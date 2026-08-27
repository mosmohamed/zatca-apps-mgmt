<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Application;
use App\Models\User;
use App\Traits\SearchTrait;
use App\Traits\SortTrait;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class ApplicationService
{
    use SearchTrait;
    use SortTrait;

    /**
     * @return list<string>
     */
    private static function detailRelations(): array
    {
        return [
            'department',
            'applicationType',
            'status',
            'criticality',
            'supportType',
            'vendor',
            'technologies',
            'businessOwners.jobTitle',
            'businessOwners.vendor',
            'technicalOwners.jobTitle',
            'technicalOwners.vendor',
            'creator',
            'updater',
        ];
    }

    /**
     * @param  array{search?: string|null, sort?: string|null, per_page?: int|null, page?: int|null}  $filters
     * @return LengthAwarePaginator<int, Application>
     */
    public function list(array $filters = []): LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));
        $page = max(1, (int) ($filters['page'] ?? 1));

        $query = Application::query()->with(self::detailRelations());

        $search = $filters['search'] ?? null;
        if (is_string($search) && trim($search) !== '') {
            $term = '%'.trim($search).'%';
            $query->where(static function (Builder $builder) use ($term): void {
                $builder
                    ->where('name_ar', 'like', $term)
                    ->orWhere('name_en', 'like', $term)
                    ->orWhere('code', 'like', $term)
                    ->orWhere('ha_model', 'like', $term)
                    ->orWhereHas('businessOwners', static function (Builder $owners) use ($term): void {
                        $owners
                            ->where('first_name', 'like', $term)
                            ->orWhere('last_name', 'like', $term)
                            ->orWhere('email', 'like', $term);
                    })
                    ->orWhereHas('technicalOwners', static function (Builder $owners) use ($term): void {
                        $owners
                            ->where('first_name', 'like', $term)
                            ->orWhere('last_name', 'like', $term)
                            ->orWhere('email', 'like', $term);
                    });
            });
        }

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
            ->with(self::detailRelations())
            ->findOrFail($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data, User $actor): Application
    {
        return DB::transaction(function () use ($data, $actor): Application {
            $technologyIds = self::extractIdList($data, 'technologies');
            $businessOwnerIds = self::extractIdList($data, 'business_owners');
            $technicalOwnerIds = self::extractIdList($data, 'technical_owners');

            $data['created_by'] = $actor->id;
            $data['updated_by'] = $actor->id;

            /** @var Application $application */
            $application = Application::query()->create($data);

            if ($technologyIds !== null) {
                $application->technologies()->sync($technologyIds);
            }

            if ($businessOwnerIds !== null) {
                $application->businessOwners()->sync($businessOwnerIds);
            }

            if ($technicalOwnerIds !== null) {
                $application->technicalOwners()->sync($technicalOwnerIds);
            }

            $this->logOwnerSync($application, $actor, $businessOwnerIds, $technicalOwnerIds, true);

            return $application->load(self::detailRelations());
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(Application $application, array $data, User $actor): Application
    {
        return DB::transaction(function () use ($application, $data, $actor): Application {
            $technologyIds = self::extractIdList($data, 'technologies');
            $businessOwnerIds = self::extractIdList($data, 'business_owners');
            $technicalOwnerIds = self::extractIdList($data, 'technical_owners');

            $data['updated_by'] = $actor->id;

            $application->update($data);

            if ($technologyIds !== null) {
                $application->technologies()->sync($technologyIds);
            }

            $previousBusiness = $application->businessOwners()->pluck('users.id')->map(static fn ($id): int => (int) $id)->all();
            $previousTechnical = $application->technicalOwners()->pluck('users.id')->map(static fn ($id): int => (int) $id)->all();

            if ($businessOwnerIds !== null) {
                $application->businessOwners()->sync($businessOwnerIds);
            }

            if ($technicalOwnerIds !== null) {
                $application->technicalOwners()->sync($technicalOwnerIds);
            }

            $this->logOwnerChanges(
                $application,
                $actor,
                $previousBusiness,
                $businessOwnerIds,
                $previousTechnical,
                $technicalOwnerIds,
            );

            return $application->refresh()->load(self::detailRelations());
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

            return $application->refresh()->load(self::detailRelations());
        });
    }

    /**
     * @param  array<string, mixed>  $data
     * @return list<int>|null
     */
    private static function extractIdList(array &$data, string $key): ?array
    {
        if (! array_key_exists($key, $data)) {
            return null;
        }

        $raw = $data[$key];
        unset($data[$key]);

        if (! is_array($raw)) {
            return [];
        }

        return array_values(array_unique(array_map(
            static fn (mixed $id): int => (int) $id,
            $raw,
        )));
    }

    /**
     * @param  list<int>|null  $businessOwnerIds
     * @param  list<int>|null  $technicalOwnerIds
     */
    private function logOwnerSync(
        Application $application,
        User $actor,
        ?array $businessOwnerIds,
        ?array $technicalOwnerIds,
        bool $created,
    ): void {
        if ($businessOwnerIds === null && $technicalOwnerIds === null) {
            return;
        }

        activity()
            ->performedOn($application)
            ->causedBy($actor)
            ->event($created ? 'created' : 'updated')
            ->withProperties([
                'business_owners' => $businessOwnerIds,
                'technical_owners' => $technicalOwnerIds,
            ])
            ->log($created ? 'application.owners_set' : 'application.owners_updated');
    }

    /**
     * @param  list<int>  $previousBusiness
     * @param  list<int>|null  $nextBusiness
     * @param  list<int>  $previousTechnical
     * @param  list<int>|null  $nextTechnical
     */
    private function logOwnerChanges(
        Application $application,
        User $actor,
        array $previousBusiness,
        ?array $nextBusiness,
        array $previousTechnical,
        ?array $nextTechnical,
    ): void {
        $businessChanged = $nextBusiness !== null
            && $this->sortedIds($previousBusiness) !== $this->sortedIds($nextBusiness);
        $technicalChanged = $nextTechnical !== null
            && $this->sortedIds($previousTechnical) !== $this->sortedIds($nextTechnical);

        if (! $businessChanged && ! $technicalChanged) {
            return;
        }

        activity()
            ->performedOn($application)
            ->causedBy($actor)
            ->event('updated')
            ->withProperties([
                'old' => [
                    'business_owners' => $previousBusiness,
                    'technical_owners' => $previousTechnical,
                ],
                'attributes' => [
                    'business_owners' => $nextBusiness ?? $previousBusiness,
                    'technical_owners' => $nextTechnical ?? $previousTechnical,
                ],
            ])
            ->log('application.owners_updated');
    }

    /**
     * @param  list<int>  $ids
     * @return list<int>
     */
    private function sortedIds(array $ids): array
    {
        $normalized = array_values(array_unique(array_map(static fn (int $id): int => $id, $ids)));
        sort($normalized);

        return $normalized;
    }

    /**
     * @return array{
     *     total: int,
     *     active: int,
     *     maintenance: int,
     *     with_open_assignments: int
     * }
     */
    public function statistics(): array
    {
        $statusCounts = Application::query()
            ->join('application_statuses', 'applications.status_id', '=', 'application_statuses.id')
            ->whereNull('applications.deleted_at')
            ->selectRaw('application_statuses.code as code')
            ->selectRaw('COUNT(*) as aggregate')
            ->groupBy('application_statuses.code')
            ->pluck('aggregate', 'code');

        return [
            'total' => Application::query()->count(),
            'active' => (int) ($statusCounts['Active'] ?? 0),
            'maintenance' => (int) ($statusCounts['Maintenance'] ?? 0),
            'with_open_assignments' => Application::query()
                ->whereHas('assignments', static function ($query): void {
                    $query->open();
                })
                ->count(),
        ];
    }

}
