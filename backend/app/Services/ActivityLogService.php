<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Application;
use App\Models\Department;
use App\Models\Setting;
use App\Models\Technology;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Spatie\Activitylog\Models\Activity;

class ActivityLogService
{
    /**
     * @var array<string, class-string>
     */
    private const array SUBJECT_TYPE_ALIASES = [
        'application' => Application::class,
        'applications' => Application::class,
        'vendor' => Vendor::class,
        'vendors' => Vendor::class,
        'user' => User::class,
        'users' => User::class,
        'department' => Department::class,
        'departments' => Department::class,
        'technology' => Technology::class,
        'technologies' => Technology::class,
        'setting' => Setting::class,
        'settings' => Setting::class,
    ];

    /**
     * @param  array{subject_type?: string|null, causer_id?: int|null, date_from?: string|null, date_to?: string|null, search?: string|null, page?: int|null, per_page?: int|null}  $filters
     * @return LengthAwarePaginator<int, Activity>
     */
    public function list(array $filters = []): LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));
        $page = max(1, (int) ($filters['page'] ?? 1));

        $query = Activity::query()->with(['causer', 'subject']);

        if (! empty($filters['subject_type'])) {
            $subjectType = $this->resolveSubjectType((string) $filters['subject_type']);

            if ($subjectType !== null) {
                $query->where('subject_type', $subjectType);
            }
        }

        if (! empty($filters['causer_id'])) {
            $query->where('causer_id', (int) $filters['causer_id']);
        }

        if (! empty($filters['date_from'])) {
            $query->whereDate('created_at', '>=', (string) $filters['date_from']);
        }

        if (! empty($filters['date_to'])) {
            $query->whereDate('created_at', '<=', (string) $filters['date_to']);
        }

        if (! empty($filters['search'])) {
            $term = '%'.trim((string) $filters['search']).'%';
            $query->where(static function ($builder) use ($term): void {
                $builder
                    ->where('description', 'like', $term)
                    ->orWhereHasMorph('causer', [User::class], static function ($causerQuery) use ($term): void {
                        $causerQuery
                            ->where('first_name', 'like', $term)
                            ->orWhere('last_name', 'like', $term)
                            ->orWhere('email', 'like', $term);
                    });
            });
        }

        $query->orderByDesc('created_at');

        return $query->paginate(perPage: $perPage, page: $page);
    }

    public function find(int $id): Activity
    {
        return Activity::query()->with(['causer', 'subject'])->findOrFail($id);
    }

    /**
     * @return array{most_active_admins: list<array<string, mixed>>, most_modified_applications: list<array<string, mixed>>, top_vendors: list<array<string, mixed>>}
     */
    public function stats(): array
    {
        return [
            'most_active_admins' => $this->mostActiveCausers(),
            'most_modified_applications' => $this->mostModifiedSubjects(Application::class, fn (Application $model): string => $model->name_en),
            'top_vendors' => $this->mostModifiedSubjects(Vendor::class, fn (Vendor $model): string => $model->name),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function mostActiveCausers(): array
    {
        /** @var Collection<int, object{causer_id: int, activity_count: int}> $rows */
        $rows = Activity::query()
            ->selectRaw('causer_id, count(*) as activity_count')
            ->whereNotNull('causer_id')
            ->where('causer_type', User::class)
            ->groupBy('causer_id')
            ->orderByDesc('activity_count')
            ->limit(5)
            ->get();

        $userIds = $rows->pluck('causer_id')->all();
        $users = User::query()->whereIn('id', $userIds)->get()->keyBy('id');

        return $rows->map(static function (object $row) use ($users): array {
            /** @var User|null $user */
            $user = $users->get($row->causer_id);

            return [
                'id' => (int) $row->causer_id,
                'name' => $user?->full_name ?? 'Unknown',
                'count' => (int) $row->activity_count,
            ];
        })->all();
    }

    /**
     * @param  class-string  $subjectType
     * @param  callable(mixed): string  $labelResolver
     * @return list<array<string, mixed>>
     */
    private function mostModifiedSubjects(string $subjectType, callable $labelResolver): array
    {
        /** @var Collection<int, object{subject_id: int, activity_count: int}> $rows */
        $rows = Activity::query()
            ->selectRaw('subject_id, count(*) as activity_count')
            ->where('subject_type', $subjectType)
            ->whereNotNull('subject_id')
            ->groupBy('subject_id')
            ->orderByDesc('activity_count')
            ->limit(5)
            ->get();

        $subjectIds = $rows->pluck('subject_id')->all();
        $subjects = $subjectType::query()->whereIn('id', $subjectIds)->get()->keyBy('id');

        return $rows->map(static function (object $row) use ($subjects, $labelResolver): array {
            $subject = $subjects->get($row->subject_id);

            return [
                'id' => (int) $row->subject_id,
                'name' => $subject !== null ? $labelResolver($subject) : 'Unknown',
                'count' => (int) $row->activity_count,
            ];
        })->all();
    }

    private function resolveSubjectType(string $type): ?string
    {
        $normalized = mb_strtolower(trim($type));

        if (array_key_exists($normalized, self::SUBJECT_TYPE_ALIASES)) {
            return self::SUBJECT_TYPE_ALIASES[$normalized];
        }

        if (class_exists($type)) {
            return $type;
        }

        return null;
    }
}
