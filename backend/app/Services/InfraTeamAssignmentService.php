<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\InfraCategory;
use App\Models\InfraLevel;
use App\Models\InfraTeamAssignment;
use App\Traits\SearchTrait;
use App\Traits\SortTrait;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class InfraTeamAssignmentService
{
    use SearchTrait;
    use SortTrait;

    /**
     * @param  array{search?: string|null, sort?: string|null, per_page?: int|null, page?: int|null, infra_category_id?: int|null, infra_level_id?: int|null, user_id?: int|null}  $filters
     * @return LengthAwarePaginator<int, InfraTeamAssignment>
     */
    public function list(array $filters = []): LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 25), 100));
        $page = max(1, (int) ($filters['page'] ?? 1));

        $query = InfraTeamAssignment::query()
            ->with([
                'category.parent',
                'level',
                'user.jobTitle',
                'user.vendor',
            ]);

        if (! empty($filters['infra_category_id'])) {
            $query->where('infra_category_id', (int) $filters['infra_category_id']);
        }

        if (! empty($filters['infra_level_id'])) {
            $query->where('infra_level_id', (int) $filters['infra_level_id']);
        }

        if (! empty($filters['user_id'])) {
            $query->where('user_id', (int) $filters['user_id']);
        }

        $search = $filters['search'] ?? null;
        if (is_string($search) && trim($search) !== '') {
            $term = '%'.trim($search).'%';
            $query->where(function ($builder) use ($term): void {
                $builder
                    ->whereHas('user', function ($userQuery) use ($term): void {
                        $userQuery
                            ->where('first_name', 'like', $term)
                            ->orWhere('last_name', 'like', $term)
                            ->orWhere('email', 'like', $term);
                    })
                    ->orWhereHas('category', function ($categoryQuery) use ($term): void {
                        $categoryQuery
                            ->where('name_en', 'like', $term)
                            ->orWhere('name_ar', 'like', $term)
                            ->orWhere('code', 'like', $term);
                    })
                    ->orWhereHas('level', function ($levelQuery) use ($term): void {
                        $levelQuery
                            ->where('name_en', 'like', $term)
                            ->orWhere('name_ar', 'like', $term)
                            ->orWhere('code', 'like', $term);
                    });
            });
        }

        $this->applyColumnSort(
            $query,
            $filters['sort'] ?? null,
            ['sort_order', 'created_at', 'infra_category_id', 'infra_level_id', 'user_id'],
            'sort_order',
        );

        return $query->paginate(perPage: $perPage, page: $page);
    }

    public function find(int $id): InfraTeamAssignment
    {
        return InfraTeamAssignment::query()
            ->with(['category.parent', 'level', 'user.jobTitle', 'user.vendor'])
            ->findOrFail($id);
    }

    /**
     * @param  array{
     *     infra_category_id: int,
     *     users: list<array{user_id: int, infra_level_id: int, sort_order?: int}>
     * }  $data
     * @return EloquentCollection<int, InfraTeamAssignment>
     */
    public function createMany(array $data): EloquentCollection
    {
        return DB::transaction(function () use ($data): EloquentCollection {
            $assignmentIds = [];
            $seen = [];

            foreach ($data['users'] as $index => $userRow) {
                $userId = (int) $userRow['user_id'];
                $levelId = (int) $userRow['infra_level_id'];
                $key = $userId.':'.$levelId;

                if (isset($seen[$key])) {
                    continue;
                }
                $seen[$key] = true;

                $assignment = InfraTeamAssignment::query()->firstOrCreate(
                    [
                        'infra_category_id' => $data['infra_category_id'],
                        'user_id' => $userId,
                        'infra_level_id' => $levelId,
                    ],
                    [
                        'sort_order' => $userRow['sort_order'] ?? $index,
                    ],
                );

                $assignmentIds[] = (int) $assignment->id;
            }

            return InfraTeamAssignment::query()
                ->with(['category.parent', 'level', 'user.jobTitle', 'user.vendor'])
                ->whereIn('id', $assignmentIds)
                ->orderBy('sort_order')
                ->get();
        });
    }

    /**
     * Leaf streams (subcategories, or roots without children) with assignment counts.
     *
     * @param  array{search?: string|null, sort?: string|null, per_page?: int|null, page?: int|null}  $filters
     * @return LengthAwarePaginator<int, InfraCategory>
     */
    public function categoriesSummary(array $filters = []): LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 15), 100));
        $page = max(1, (int) ($filters['page'] ?? 1));

        $query = InfraCategory::query()
            ->with('parent')
            ->withCount('teamAssignments as assignments_count')
            ->where('is_active', true)
            ->where(static function ($builder): void {
                $builder
                    ->whereNotNull('parent_id')
                    ->orWhereDoesntHave('children', static function ($children): void {
                        $children->where('is_active', true);
                    });
            });

        $this->applyColumnSearch(
            $query,
            $filters['search'] ?? null,
            ['name_en', 'name_ar', 'code'],
        );

        $this->applyColumnSort(
            $query,
            $filters['sort'] ?? null,
            ['name_en', 'name_ar', 'code', 'assignments_count', 'sort_order', 'created_at'],
            '-assignments_count',
        );

        return $query->paginate(perPage: $perPage, page: $page);
    }

    public function categoryMatrix(int $categoryId): InfraCategory
    {
        return InfraCategory::query()
            ->with([
                'parent',
                'teamAssignments' => static function ($query): void {
                    $query
                        ->with(['user.vendor', 'user.jobTitle', 'level'])
                        ->orderBy('sort_order')
                        ->orderBy('id');
                },
            ])
            ->withCount('teamAssignments as assignments_count')
            ->findOrFail($categoryId);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(InfraTeamAssignment $assignment, array $data): InfraTeamAssignment
    {
        return DB::transaction(function () use ($assignment, $data): InfraTeamAssignment {
            $assignment->update($data);

            return $this->find((int) $assignment->id);
        });
    }

    public function delete(InfraTeamAssignment $assignment): void
    {
        DB::transaction(static function () use ($assignment): void {
            $assignment->delete();
        });
    }

    /**
     * @return array{
     *     total: int,
     *     unique_users: int,
     *     assigned_categories: int,
     *     unassigned_categories: int
     * }
     */
    public function statistics(): array
    {
        return [
            'total' => InfraTeamAssignment::query()->count(),
            'unique_users' => InfraTeamAssignment::query()->distinct()->count('user_id'),
            'assigned_categories' => InfraTeamAssignment::query()->distinct()->count('infra_category_id'),
            'unassigned_categories' => InfraCategory::query()
                ->where('is_active', true)
                ->whereDoesntHave('children', static function ($query): void {
                    $query->where('is_active', true);
                })
                ->whereDoesntHave('teamAssignments')
                ->count(),
        ];
    }

    /**
     * Card payload for Infra Teams Details: leaf streams (subs or root without children)
     * with assignments grouped by active levels.
     *
     * @return list<array<string, mixed>>
     */
    public function detailsCards(): array
    {
        $levels = InfraLevel::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name_en')
            ->get();

        $roots = InfraCategory::query()
            ->whereNull('parent_id')
            ->where('is_active', true)
            ->with([
                'children' => static function ($query): void {
                    $query->where('is_active', true)
                        ->orderBy('sort_order')
                        ->orderBy('name_en');
                },
            ])
            ->orderBy('sort_order')
            ->orderBy('name_en')
            ->get();

        $streamIds = [];
        foreach ($roots as $root) {
            if ($root->children->isNotEmpty()) {
                foreach ($root->children as $child) {
                    $streamIds[] = (int) $child->id;
                }
            } else {
                $streamIds[] = (int) $root->id;
            }
        }

        $assignments = InfraTeamAssignment::query()
            ->with(['user.jobTitle', 'level', 'category.parent'])
            ->whereIn('infra_category_id', $streamIds)
            ->whereHas('level', static function ($query): void {
                $query->where('is_active', true);
            })
            ->orderBy('sort_order')
            ->get()
            ->groupBy('infra_category_id');

        $cards = [];

        foreach ($roots as $root) {
            $streams = $root->children->isNotEmpty() ? $root->children : collect([$root]);

            foreach ($streams as $stream) {
                /** @var Collection<int, InfraTeamAssignment> $streamAssignments */
                $streamAssignments = $assignments->get($stream->id, collect());

                $levelsPayload = [];
                foreach ($levels as $level) {
                    $levelAssignments = $streamAssignments
                        ->where('infra_level_id', $level->id)
                        ->values();

                    $levelsPayload[] = [
                        'id' => $level->id,
                        'code' => $level->code,
                        'name_en' => $level->name_en,
                        'name_ar' => $level->name_ar,
                        'note_en' => $level->note_en,
                        'note_ar' => $level->note_ar,
                        'sort_order' => $level->sort_order,
                        'members' => $levelAssignments->map(static function (InfraTeamAssignment $assignment): array {
                            $user = $assignment->user;

                            return [
                                'assignment_id' => $assignment->id,
                                'user_id' => $assignment->user_id,
                                'full_name' => trim(($user?->first_name ?? '').' '.($user?->last_name ?? '')),
                                'email' => $user?->email,
                                'phone' => $user?->phone,
                                'job_title' => $user?->jobTitle?->name_en,
                            ];
                        })->all(),
                    ];
                }

                $hasParent = $stream->parent_id !== null;
                $titleEn = $hasParent
                    ? $root->name_en.' - '.$stream->name_en
                    : $stream->name_en;
                $titleAr = $hasParent
                    ? $root->name_ar.' - '.$stream->name_ar
                    : $stream->name_ar;

                $cards[] = [
                    'id' => $stream->id,
                    'code' => $stream->code,
                    'name_en' => $stream->name_en,
                    'name_ar' => $stream->name_ar,
                    'title_en' => $titleEn,
                    'title_ar' => $titleAr,
                    'parent' => $hasParent ? [
                        'id' => $root->id,
                        'name_en' => $root->name_en,
                        'name_ar' => $root->name_ar,
                        'code' => $root->code,
                    ] : null,
                    'members_count' => $streamAssignments->count(),
                    'levels' => $levelsPayload,
                ];
            }
        }

        return $cards;
    }
}
