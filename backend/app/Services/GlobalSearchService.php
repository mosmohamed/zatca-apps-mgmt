<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Application;
use App\Models\Department;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

class GlobalSearchService
{
    private const int MIN_QUERY_LENGTH = 2;

    private const int LIMIT = 8;

    /**
     * @return array{
     *     applications: list<array{id: int, title: string, subtitle: string, url: string}>,
     *     users: list<array{id: int, title: string, subtitle: string, url: string}>,
     *     vendors: list<array{id: int, title: string, subtitle: string, url: string}>,
     *     departments: list<array{id: int, title: string, subtitle: string, url: string}>,
     * }
     */
    public function search(string $query, ?User $actor = null): array
    {
        $term = trim($query);
        $actor ??= Auth::user();

        if (mb_strlen($term) < self::MIN_QUERY_LENGTH) {
            return $this->emptyResults();
        }

        return [
            'applications' => $actor instanceof User
                ? $this->searchApplications($term)
                : [],
            'users' => $this->can($actor, 'users.view')
                ? $this->searchUsers($term)
                : [],
            'vendors' => $this->can($actor, 'vendors.view')
                ? $this->searchVendors($term)
                : [],
            'departments' => $this->can($actor, 'departments.view')
                ? $this->searchDepartments($term)
                : [],
        ];
    }

    private function can(?User $actor, string $permission): bool
    {
        return $actor instanceof User && $actor->can($permission);
    }

    /**
     * @return list<array{id: int, title: string, subtitle: string, url: string}>
     */
    private function searchApplications(string $term): array
    {
        $like = '%'.$term.'%';

        return Application::query()
            ->where(static function (Builder $builder) use ($like): void {
                $builder
                    ->where('name_en', 'like', $like)
                    ->orWhere('name_ar', 'like', $like)
                    ->orWhere('code', 'like', $like)
                    ->orWhere('ha_model', 'like', $like);
            })
            ->orderBy('name_en')
            ->limit(self::LIMIT)
            ->get(['id', 'name_en', 'code', 'ha_model'])
            ->map(static function (Application $application): array {
                $haModel = $application->ha_model?->value;

                return [
                    'id' => $application->id,
                    'title' => $application->name_en,
                    'subtitle' => $haModel !== null
                        ? $application->code.' · '.$haModel
                        : $application->code,
                    'url' => '/applications/'.$application->id,
                ];
            })
            ->all();
    }

    /**
     * @return list<array{id: int, title: string, subtitle: string, url: string}>
     */
    private function searchUsers(string $term): array
    {
        $like = '%'.$term.'%';

        return User::query()
            ->where(static function (Builder $builder) use ($like): void {
                $builder
                    ->where('first_name', 'like', $like)
                    ->orWhere('last_name', 'like', $like)
                    ->orWhere('email', 'like', $like);
            })
            ->orderBy('first_name')
            ->limit(self::LIMIT)
            ->get(['id', 'first_name', 'last_name', 'email'])
            ->map(static fn (User $user): array => [
                'id' => $user->id,
                'title' => $user->full_name,
                'subtitle' => (string) $user->email,
                'url' => '/users?id='.$user->id,
            ])
            ->all();
    }

    /**
     * @return list<array{id: int, title: string, subtitle: string, url: string}>
     */
    private function searchVendors(string $term): array
    {
        $like = '%'.$term.'%';

        return Vendor::query()
            ->where(static function (Builder $builder) use ($like): void {
                $builder
                    ->where('name', 'like', $like)
                    ->orWhere('email', 'like', $like);
            })
            ->orderBy('name')
            ->limit(self::LIMIT)
            ->get(['id', 'name', 'email'])
            ->map(static fn (Vendor $vendor): array => [
                'id' => $vendor->id,
                'title' => $vendor->name,
                'subtitle' => (string) ($vendor->email ?? '-'),
                'url' => '/vendors?id='.$vendor->id,
            ])
            ->all();
    }

    /**
     * @return list<array{id: int, title: string, subtitle: string, url: string}>
     */
    private function searchDepartments(string $term): array
    {
        $like = '%'.$term.'%';

        return Department::query()
            ->where(static function (Builder $builder) use ($like): void {
                $builder
                    ->where('name_en', 'like', $like)
                    ->orWhere('name_ar', 'like', $like);
            })
            ->orderBy('name_en')
            ->limit(self::LIMIT)
            ->get(['id', 'name_en', 'name_ar'])
            ->map(static fn (Department $department): array => [
                'id' => $department->id,
                'title' => $department->name_en,
                'subtitle' => $department->name_ar,
                'url' => '/departments?id='.$department->id,
            ])
            ->all();
    }

    /**
     * @return array{applications: list<never>, users: list<never>, vendors: list<never>, departments: list<never>}
     */
    private function emptyResults(): array
    {
        return [
            'applications' => [],
            'users' => [],
            'vendors' => [],
            'departments' => [],
        ];
    }
}
