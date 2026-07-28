<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Application;
use App\Models\Department;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Database\Eloquent\Builder;

/**
 * Loads the minimal relation set required by the compact hover-preview
 * payloads. Every relation and aggregate consumed by the preview resources is
 * eager-loaded here so previews never trigger lazy loading.
 */
class EntityPreviewService
{
    public function findUserByDisplayName(string $name): ?User
    {
        $normalized = trim((string) preg_replace('/\s+/u', ' ', $name));

        if ($normalized === '') {
            return null;
        }

        $needle = mb_strtolower($normalized, 'UTF-8');

        /** @var User|null $user */
        $user = User::query()
            ->whereRaw(
                'LOWER(CONCAT(TRIM(first_name), \' \', TRIM(last_name))) = ?',
                [$needle]
            )
            ->first();

        return $user;
    }

    public function user(User $user): User
    {
        $user->loadMissing(['vendor', 'jobTitle', 'roles']);

        $user->loadCount([
            'assignments as active_assignments_count' => static fn (Builder $query): Builder => $query->whereNull('ended_at'),
        ]);

        return $user;
    }

    public function vendor(Vendor $vendor): Vendor
    {
        $vendor->loadCount([
            'users as users_count',
            'users as active_users_count' => static fn (Builder $query): Builder => $query->where('is_active', true),
        ]);

        return $vendor;
    }

    public function application(Application $application): Application
    {
        $application->loadMissing([
            'department',
            'applicationType',
            'status',
            'criticality',
            'supportType',
            'businessOwners.jobTitle',
            'businessOwners.vendor',
            'technicalOwners.jobTitle',
            'technicalOwners.vendor',
        ]);

        $application->loadCount([
            'assignments as active_assignments_count' => static fn (Builder $query): Builder => $query->whereNull('ended_at'),
            'technologies as technologies_count',
        ]);

        return $application;
    }

    public function department(Department $department): Department
    {
        $department->loadCount(['applications as applications_count']);

        return $department;
    }
}
