<?php

declare(strict_types=1);

namespace App\Services;

use App\Exceptions\DomainException;
use App\Models\Application;
use App\Models\ApplicationAssignment;
use App\Models\User;
use App\Traits\SearchTrait;
use App\Traits\SortTrait;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class AssignmentService
{
    use SearchTrait;
    use SortTrait;

    /**
     * @param  array{
     *     search?: string|null,
     *     sort?: string|null,
     *     per_page?: int|null,
     *     page?: int|null,
     *     application_id?: int|null,
     *     user_id?: int|null,
     *     open_only?: bool|null
     * }  $filters
     * @return LengthAwarePaginator<int, ApplicationAssignment>
     */
    public function list(array $filters = []): LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));
        $page = max(1, (int) ($filters['page'] ?? 1));

        $query = ApplicationAssignment::query()->with([
            'application',
            'user.vendor',
            'appRole',
            'assignedBy',
        ]);

        if (! empty($filters['application_id'])) {
            $query->where('application_id', (int) $filters['application_id']);
        }

        if (! empty($filters['user_id'])) {
            $query->where('user_id', (int) $filters['user_id']);
        }

        if (($filters['open_only'] ?? false) === true) {
            $query->open();
        }

        $this->applyRelationalSearch($query, $filters['search'] ?? null);
        $this->applyColumnSort(
            $query,
            $filters['sort'] ?? null,
            ['assigned_at', 'ended_at', 'is_primary', 'created_at', 'updated_at'],
            '-assigned_at',
        );

        return $query->paginate(perPage: $perPage, page: $page);
    }

    public function find(int $id): ApplicationAssignment
    {
        return ApplicationAssignment::query()
            ->with(['application', 'user.vendor', 'appRole', 'assignedBy'])
            ->findOrFail($id);
    }

    /**
     * Application-centric matrix index: applications with active assignment counts.
     *
     * @param  array{search?: string|null, sort?: string|null, per_page?: int|null, page?: int|null}  $filters
     * @return LengthAwarePaginator<int, Application>
     */
    public function applicationsSummary(array $filters = []): LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));
        $page = max(1, (int) ($filters['page'] ?? 1));

        $query = Application::query()
            ->with(['department', 'status'])
            ->withCount([
                'assignments as active_users_count' => static function (Builder $builder): void {
                    $builder->whereNull('ended_at');
                },
            ]);

        $this->applyColumnSearch(
            $query,
            $filters['search'] ?? null,
            ['name_en', 'name_ar', 'code'],
        );

        $this->applyColumnSort(
            $query,
            $filters['sort'] ?? null,
            ['name_en', 'name_ar', 'code', 'active_users_count', 'created_at', 'updated_at'],
            'name_en',
        );

        return $query->paginate(perPage: $perPage, page: $page);
    }

    /**
     * Application matrix detail with currently open assignments.
     */
    public function applicationMatrix(int $applicationId): Application
    {
        return Application::query()
            ->with([
                'department',
                'status',
                'assignments' => static function ($query): void {
                    $query
                        ->whereNull('ended_at')
                        ->with(['user.vendor', 'appRole'])
                        ->orderByDesc('is_primary')
                        ->orderBy('assigned_at');
                },
            ])
            ->findOrFail($applicationId);
    }

    /**
     * Assign a user to an application with a specific app role.
     *
     * @param  array{
     *     application_id: int,
     *     user_id: int,
     *     app_role_id: int,
     *     is_primary?: bool,
     *     remarks?: string|null,
     *     assigned_at?: \Illuminate\Support\Carbon|string|null
     * }  $data
     */
    public function assign(array $data, User $actor): ApplicationAssignment
    {
        return DB::transaction(function () use ($data, $actor): ApplicationAssignment {
            return $this->createAssignmentRecord(
                (int) $data['application_id'],
                (int) $data['user_id'],
                (int) $data['app_role_id'],
                $actor,
                (bool) ($data['is_primary'] ?? false),
                $data['remarks'] ?? null,
                $data['assigned_at'] ?? now(),
            );
        });
    }

    /**
     * @param  list<array{
     *     user_id: int,
     *     app_role_id: int,
     *     is_primary?: bool,
     *     remarks?: string|null
     * }>  $usersData
     * @return list<ApplicationAssignment>
     */
    public function assignMultiple(int $applicationId, array $usersData, User $actor): array
    {
        return DB::transaction(function () use ($applicationId, $usersData, $actor): array {
            $assignments = [];

            foreach ($usersData as $userData) {
                $assignments[] = $this->createAssignmentRecord(
                    $applicationId,
                    (int) $userData['user_id'],
                    (int) $userData['app_role_id'],
                    $actor,
                    (bool) ($userData['is_primary'] ?? false),
                    $userData['remarks'] ?? null,
                    now(),
                );
            }

            return $assignments;
        });
    }

    /**
     * Update mutable fields on an existing assignment.
     *
     * @param  array{is_primary?: bool, remarks?: string|null}  $data
     */
    public function update(ApplicationAssignment $assignment, array $data): ApplicationAssignment
    {
        if ($assignment->ended_at !== null) {
            throw new DomainException('Closed assignments cannot be updated. Create a new assignment instead.');
        }

        return DB::transaction(static function () use ($assignment, $data): ApplicationAssignment {
            $payload = array_intersect_key($data, array_flip(['is_primary', 'remarks']));

            $assignment->update($payload);

            return $assignment->refresh()->load(['application', 'user.vendor', 'appRole', 'assignedBy']);
        });
    }

    public function end(ApplicationAssignment $assignment): ApplicationAssignment
    {
        if ($assignment->ended_at !== null) {
            throw new DomainException('Assignment is already closed.');
        }

        return DB::transaction(static function () use ($assignment): ApplicationAssignment {
            $assignment->update([
                'ended_at' => now(),
            ]);

            return $assignment->refresh()->load(['application', 'user.vendor', 'appRole', 'assignedBy']);
        });
    }

    public function delete(ApplicationAssignment $assignment): void
    {
        if ($assignment->ended_at === null) {
            $this->end($assignment);
        }
    }

    private function createAssignmentRecord(
        int $applicationId,
        int $userId,
        int $appRoleId,
        User $actor,
        bool $isPrimary,
        ?string $remarks,
        \Illuminate\Support\Carbon|string $assignedAt,
    ): ApplicationAssignment {
        $openAssignment = ApplicationAssignment::query()
            ->where('application_id', $applicationId)
            ->where('user_id', $userId)
            ->open()
            ->lockForUpdate()
            ->first();

        if ($openAssignment !== null) {
            $openAssignment->update([
                'ended_at' => now(),
            ]);
        }

        /** @var ApplicationAssignment $assignment */
        $assignment = ApplicationAssignment::query()->create([
            'application_id' => $applicationId,
            'user_id' => $userId,
            'app_role_id' => $appRoleId,
            'assigned_by' => $actor->id,
            'assigned_at' => $assignedAt,
            'ended_at' => null,
            'is_primary' => $isPrimary,
            'remarks' => $remarks,
        ]);

        return $assignment->load(['application', 'user.vendor', 'appRole', 'assignedBy']);
    }

    /**
     * @param  Builder<ApplicationAssignment>  $query
     */
    private function applyRelationalSearch(Builder $query, ?string $search): void
    {
        if ($search === null || trim($search) === '') {
            return;
        }

        $term = '%'.trim($search).'%';

        $query->where(static function (Builder $builder) use ($term): void {
            $builder
                ->where('remarks', 'like', $term)
                ->orWhereHas('user', static function (Builder $userQuery) use ($term): void {
                    $userQuery
                        ->where('first_name', 'like', $term)
                        ->orWhere('last_name', 'like', $term)
                        ->orWhere('email', 'like', $term);
                })
                ->orWhereHas('application', static function (Builder $applicationQuery) use ($term): void {
                    $applicationQuery
                        ->where('name_en', 'like', $term)
                        ->orWhere('name_ar', 'like', $term)
                        ->orWhere('code', 'like', $term);
                })
                ->orWhereHas('appRole', static function (Builder $roleQuery) use ($term): void {
                    $roleQuery->where('name', 'like', $term);
                });
        });
    }
}
