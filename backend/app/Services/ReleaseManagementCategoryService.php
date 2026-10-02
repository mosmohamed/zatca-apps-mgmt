<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\ReleaseManagementCategory;
use App\Traits\SearchTrait;
use App\Traits\SortTrait;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ReleaseManagementCategoryService
{
    use SearchTrait;
    use SortTrait;

    /**
     * @param  array{search?: string|null, sort?: string|null, per_page?: int|null, page?: int|null, category_type?: string|null, active_status?: string|null, roots_only?: bool|null, parent_id?: int|null, active_only?: bool|null}  $filters
     * @return LengthAwarePaginator<int, ReleaseManagementCategory>
     */
    public function list(array $filters = []): LengthAwarePaginator
    {
        $perPage = max(1, min((int) ($filters['per_page'] ?? 50), 100));
        $page = max(1, (int) ($filters['page'] ?? 1));
        $categoryType = $filters['category_type'] ?? null;

        // Default "all" view: paginate parent categories with nested children so the
        // UI can render a clear parent → subcategory hierarchy.
        if ($categoryType === null || $categoryType === '') {
            return $this->listHierarchical($filters, $perPage, $page);
        }

        $query = ReleaseManagementCategory::query()
            ->with(['parent'])
            ->withCount(['teamAssignments', 'children']);

        if ($categoryType === 'parent') {
            $query->whereNull('parent_id');
        } elseif ($categoryType === 'subcategory') {
            $query->whereNotNull('parent_id');
        }

        if (($filters['active_status'] ?? null) === 'active') {
            $query->where('is_active', true);
        } elseif (($filters['active_status'] ?? null) === 'inactive') {
            $query->where('is_active', false);
        }

        if (! empty($filters['roots_only'])) {
            $query->whereNull('parent_id');
        }

        if (array_key_exists('parent_id', $filters) && $filters['parent_id'] !== null && $filters['parent_id'] !== '') {
            $query->where('parent_id', (int) $filters['parent_id']);
        }

        if (! empty($filters['active_only'])) {
            $query->where('is_active', true);
        }

        $this->applyColumnSearch($query, $filters['search'] ?? null, ['name_en', 'name_ar', 'code', 'description']);
        $this->applyColumnSort(
            $query,
            $filters['sort'] ?? null,
            ['name_en', 'name_ar', 'code', 'sort_order', 'is_active', 'created_at'],
            'sort_order',
        );

        return $query->paginate(perPage: $perPage, page: $page);
    }

    /**
     * @param  array{search?: string|null, sort?: string|null, active_status?: string|null, active_only?: bool|null}  $filters
     * @return LengthAwarePaginator<int, ReleaseManagementCategory>
     */
    private function listHierarchical(array $filters, int $perPage, int $page): LengthAwarePaginator
    {
        $search = is_string($filters['search'] ?? null) ? trim((string) $filters['search']) : '';

        $childrenQuery = function ($query) use ($filters): void {
            $query
                ->withCount('teamAssignments')
                ->orderBy('sort_order')
                ->orderBy('name_en');

            if (($filters['active_status'] ?? null) === 'active') {
                $query->where('is_active', true);
            } elseif (($filters['active_status'] ?? null) === 'inactive') {
                $query->where('is_active', false);
            }

            if (! empty($filters['active_only'])) {
                $query->where('is_active', true);
            }
        };

        $query = ReleaseManagementCategory::query()
            ->whereNull('parent_id')
            ->with(['children' => $childrenQuery])
            ->withCount(['teamAssignments', 'children']);

        if (($filters['active_status'] ?? null) === 'active') {
            $query->where('is_active', true);
        } elseif (($filters['active_status'] ?? null) === 'inactive') {
            $query->where('is_active', false);
        }

        if (! empty($filters['active_only'])) {
            $query->where('is_active', true);
        }

        if ($search !== '') {
            $like = '%'.$search.'%';
            $query->where(static function ($builder) use ($like): void {
                $builder
                    ->where('name_en', 'like', $like)
                    ->orWhere('name_ar', 'like', $like)
                    ->orWhere('code', 'like', $like)
                    ->orWhere('description', 'like', $like)
                    ->orWhereHas('children', static function ($children) use ($like): void {
                        $children
                            ->where('name_en', 'like', $like)
                            ->orWhere('name_ar', 'like', $like)
                            ->orWhere('code', 'like', $like)
                            ->orWhere('description', 'like', $like);
                    });
            });
        }

        $this->applyColumnSort(
            $query,
            $filters['sort'] ?? null,
            ['name_en', 'name_ar', 'code', 'sort_order', 'is_active', 'created_at'],
            'sort_order',
        );

        $paginator = $query->paginate(perPage: $perPage, page: $page);

        if ($search !== '') {
            $needle = mb_strtolower($search);
            $paginator->getCollection()->transform(
                static function (ReleaseManagementCategory $parent) use ($needle): ReleaseManagementCategory {
                    $parentMatches = str_contains(mb_strtolower((string) $parent->name_en), $needle)
                        || str_contains(mb_strtolower((string) $parent->name_ar), $needle)
                        || str_contains(mb_strtolower((string) $parent->code), $needle)
                        || str_contains(mb_strtolower((string) ($parent->description ?? '')), $needle);

                    if (! $parentMatches) {
                        $parent->setRelation(
                            'children',
                            $parent->children
                                ->filter(static function (ReleaseManagementCategory $child) use ($needle): bool {
                                    return str_contains(mb_strtolower((string) $child->name_en), $needle)
                                        || str_contains(mb_strtolower((string) $child->name_ar), $needle)
                                        || str_contains(mb_strtolower((string) $child->code), $needle)
                                        || str_contains(mb_strtolower((string) ($child->description ?? '')), $needle);
                                })
                                ->values(),
                        );
                    }

                    return $parent;
                },
            );
        }

        return $paginator;
    }

    /**
     * @return array{total: int, parents: int, subcategories: int, without_assignments: int}
     */
    public function statistics(): array
    {
        return [
            'total' => ReleaseManagementCategory::query()->count(),
            'parents' => ReleaseManagementCategory::query()->whereNull('parent_id')->count(),
            'subcategories' => ReleaseManagementCategory::query()->whereNotNull('parent_id')->count(),
            'without_assignments' => ReleaseManagementCategory::query()
                ->whereDoesntHave('children')
                ->whereDoesntHave('teamAssignments')
                ->count(),
        ];
    }

    /**
     * Tree of root categories with children, used by management and details pages.
     *
     * @return Collection<int, ReleaseManagementCategory>
     */
    public function tree(bool $activeOnly = false): Collection
    {
        $childrenQuery = static function ($query) use ($activeOnly): void {
            $query->orderBy('sort_order')->orderBy('name_en');
            if ($activeOnly) {
                $query->where('is_active', true);
            }
        };

        $query = ReleaseManagementCategory::query()
            ->whereNull('parent_id')
            ->with(['children' => $childrenQuery])
            ->orderBy('sort_order')
            ->orderBy('name_en');

        if ($activeOnly) {
            $query->where('is_active', true);
        }

        return $query->get();
    }

    public function find(int $id): ReleaseManagementCategory
    {
        return ReleaseManagementCategory::query()
            ->with(['parent', 'children'])
            ->findOrFail($id);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function create(array $data): ReleaseManagementCategory
    {
        return DB::transaction(function () use ($data): ReleaseManagementCategory {
            $this->assertValidParent($data['parent_id'] ?? null);

            return ReleaseManagementCategory::query()->create($data);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function update(ReleaseManagementCategory $category, array $data): ReleaseManagementCategory
    {
        return DB::transaction(function () use ($category, $data): ReleaseManagementCategory {
            if (array_key_exists('parent_id', $data)) {
                $parentId = $data['parent_id'];
                if ($parentId !== null && (int) $parentId === (int) $category->id) {
                    throw ValidationException::withMessages([
                        'parent_id' => [__('messages.validation.exists', ['attribute' => 'parent_id'])],
                    ]);
                }
                $this->assertValidParent($parentId, $category->id);
            }

            $category->update($data);

            return $category->refresh()->load(['parent', 'children']);
        });
    }

    public function delete(ReleaseManagementCategory $category): void
    {
        DB::transaction(static function () use ($category): void {
            $category->delete();
        });
    }

    private function assertValidParent(mixed $parentId, ?int $excludeId = null): void
    {
        if ($parentId === null || $parentId === '') {
            return;
        }

        $parent = ReleaseManagementCategory::query()->find((int) $parentId);
        if ($parent === null) {
            throw ValidationException::withMessages([
                'parent_id' => [__('messages.validation.exists', ['attribute' => 'parent_id'])],
            ]);
        }

        // Only one nesting level: subcategory cannot be a parent.
        if ($parent->parent_id !== null) {
            throw ValidationException::withMessages([
                'parent_id' => [__('messages.release_management_categories.parent_must_be_root')],
            ]);
        }

        if ($excludeId !== null && (int) $parent->id === $excludeId) {
            throw ValidationException::withMessages([
                'parent_id' => [__('messages.validation.exists', ['attribute' => 'parent_id'])],
            ]);
        }
    }
}
