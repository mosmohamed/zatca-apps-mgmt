<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Application;
use App\Models\ApplicationAssignment;
use App\Models\Department;
use App\Models\License;
use App\Models\Technology;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Support\Facades\DB;
use Spatie\Activitylog\Models\Activity;

class DashboardService
{
    /**
     * @return array{
     *     totals: array{
     *         applications: int,
     *         active_users: int,
     *         vendors: int,
     *         technologies: int,
     *         licenses: int,
     *         assignments: int,
     *         open_assignments: int
     *     },
     *     charts: array{
     *         applications_by_status: list<array{name_en: string, name_ar: string, count: int}>,
     *         assignments_by_app_role: list<array{name: string, name_en: string, name_ar: string, count: int}>,
     *         technologies_usage: list<array{name: string, name_en: string, name_ar: string, count: int}>,
     *         employees_per_application: list<array{name_en: string, name_ar: string, count: int}>,
     *         applications_by_department: list<array{name_en: string, name_ar: string, count: int}>,
     *         license_usage: list<array{key: string, name_en: string, name_ar: string, count: int}>,
     *         license_status_distribution: list<array{key: string, name_en: string, name_ar: string, count: int}>,
     *         licenses_by_environment: list<array{key: string, name_en: string, name_ar: string, count: int}>
     *     },
     *     recent_activity: list<array<string, mixed>>
     * }
     */
    public function index(): array
    {
        $applicationsByStatus = Application::query()
            ->select(
                'application_statuses.name_en',
                'application_statuses.name_ar',
                DB::raw('COUNT(*) as count'),
            )
            ->join('application_statuses', 'applications.status_id', '=', 'application_statuses.id')
            ->groupBy('application_statuses.id', 'application_statuses.name_en', 'application_statuses.name_ar')
            ->orderBy('application_statuses.name_en')
            ->get()
            ->map(static fn ($row): array => [
                'name_en' => (string) $row->name_en,
                'name_ar' => (string) $row->name_ar,
                'count' => (int) $row->count,
            ])
            ->values()
            ->all();

        $assignmentsByRole = ApplicationAssignment::query()
            ->select('app_roles.name', DB::raw('COUNT(*) as count'))
            ->join('app_roles', 'application_assignments.app_role_id', '=', 'app_roles.id')
            ->whereNull('application_assignments.ended_at')
            ->groupBy('app_roles.name')
            ->orderBy('app_roles.name')
            ->get()
            ->map(static fn ($row): array => [
                'name' => (string) $row->name,
                'name_en' => (string) $row->name,
                'name_ar' => (string) $row->name,
                'count' => (int) $row->count,
            ])
            ->values()
            ->all();

        $technologiesUsage = DB::table('application_technology')
            ->join('technologies', 'application_technology.technology_id', '=', 'technologies.id')
            ->join('applications', 'application_technology.application_id', '=', 'applications.id')
            ->whereNull('technologies.deleted_at')
            ->whereNull('applications.deleted_at')
            ->where('technologies.is_active', true)
            ->groupBy('technologies.id', 'technologies.name')
            ->orderByDesc(DB::raw('COUNT(DISTINCT application_technology.application_id)'))
            ->orderBy('technologies.name')
            ->limit(10)
            ->get([
                'technologies.name',
                DB::raw('COUNT(DISTINCT application_technology.application_id) as count'),
            ])
            ->map(static fn ($row): array => [
                'name' => (string) $row->name,
                'name_en' => (string) $row->name,
                'name_ar' => (string) $row->name,
                'count' => (int) $row->count,
            ])
            ->values()
            ->all();

        $employeesPerApplication = Application::query()
            ->select(
                'applications.id',
                'applications.name_en',
                'applications.name_ar',
                DB::raw('COUNT(DISTINCT application_assignments.user_id) as count'),
            )
            ->leftJoin('application_assignments', static function ($join): void {
                $join->on('application_assignments.application_id', '=', 'applications.id')
                    ->whereNull('application_assignments.ended_at');
            })
            ->groupBy('applications.id', 'applications.name_en', 'applications.name_ar')
            ->havingRaw('COUNT(DISTINCT application_assignments.user_id) > 0')
            ->orderByDesc('count')
            ->orderBy('applications.name_en')
            ->limit(10)
            ->get()
            ->map(static fn ($row): array => [
                'name_en' => (string) $row->name_en,
                'name_ar' => (string) $row->name_ar,
                'count' => (int) $row->count,
            ])
            ->values()
            ->all();

        $applicationsByDepartment = Department::query()
            ->select(
                'departments.name_en',
                'departments.name_ar',
                DB::raw('COUNT(applications.id) as count'),
            )
            ->leftJoin('applications', static function ($join): void {
                $join->on('applications.department_id', '=', 'departments.id')
                    ->whereNull('applications.deleted_at');
            })
            ->groupBy('departments.id', 'departments.name_en', 'departments.name_ar')
            ->orderByDesc('count')
            ->orderBy('departments.name_en')
            ->limit(12)
            ->get()
            ->map(static fn ($row): array => [
                'name_en' => (string) $row->name_en,
                'name_ar' => (string) $row->name_ar,
                'count' => (int) $row->count,
            ])
            ->values()
            ->all();

        $licenseTotals = License::query()
            ->selectRaw('COALESCE(SUM(licensed), 0) as total_licensed')
            ->selectRaw('COALESCE(SUM(used), 0) as total_used')
            ->selectRaw('COALESCE(SUM(available), 0) as total_available')
            ->first();

        $licenseUsage = [
            [
                'key' => 'licensed',
                'name_en' => 'Licensed',
                'name_ar' => 'مرخص',
                'count' => (int) ($licenseTotals?->total_licensed ?? 0),
            ],
            [
                'key' => 'used',
                'name_en' => 'Used',
                'name_ar' => 'مستخدم',
                'count' => (int) ($licenseTotals?->total_used ?? 0),
            ],
            [
                'key' => 'available',
                'name_en' => 'Available',
                'name_ar' => 'متاح',
                'count' => (int) ($licenseTotals?->total_available ?? 0),
            ],
        ];

        $today = now()->toDateString();
        $within30 = now()->addDays(30)->toDateString();

        $expiredCount = License::query()
            ->whereNotNull('end_date')
            ->whereDate('end_date', '<', $today)
            ->count();
        $expiringSoonCount = License::query()
            ->whereNotNull('end_date')
            ->whereDate('end_date', '>=', $today)
            ->whereDate('end_date', '<=', $within30)
            ->count();
        $activeCount = License::query()
            ->where(static function ($query) use ($within30): void {
                $query
                    ->whereNull('end_date')
                    ->orWhereDate('end_date', '>', $within30);
            })
            ->count();

        $licenseStatusDistribution = [
            [
                'key' => 'active',
                'name_en' => 'Active',
                'name_ar' => 'نشط',
                'count' => $activeCount,
            ],
            [
                'key' => 'expiring_soon',
                'name_en' => 'Expiring Soon',
                'name_ar' => 'ينتهي قريباً',
                'count' => $expiringSoonCount,
            ],
            [
                'key' => 'expired',
                'name_en' => 'Expired',
                'name_ar' => 'منتهي',
                'count' => $expiredCount,
            ],
        ];

        $licensesByEnvironment = License::query()
            ->select('environment', DB::raw('COUNT(*) as count'))
            ->groupBy('environment')
            ->orderBy('environment')
            ->get()
            ->map(static function ($row): array {
                $environment = (string) $row->environment;

                return [
                    'key' => $environment,
                    'name_en' => $environment,
                    'name_ar' => $environment,
                    'count' => (int) $row->count,
                ];
            })
            ->values()
            ->all();

        $recentActivity = Activity::query()
            ->with(['causer', 'subject'])
            ->latest('created_at')
            ->limit(20)
            ->get()
            ->map(static function (Activity $activity): array {
                $causer = $activity->causer;
                $subject = $activity->subject;

                return [
                    'id' => $activity->id,
                    'description' => $activity->description,
                    'event' => $activity->event,
                    'log_name' => $activity->log_name,
                    'created_at' => $activity->created_at?->toIso8601String(),
                    'causer' => $causer !== null ? [
                        'id' => $causer->getKey(),
                        'type' => $causer->getMorphClass(),
                        'name' => method_exists($causer, 'getAttribute') && $causer->getAttribute('full_name')
                            ? (string) $causer->getAttribute('full_name')
                            : (method_exists($causer, 'getAttribute') ? (string) ($causer->getAttribute('email') ?? $causer->getKey()) : (string) $causer->getKey()),
                    ] : null,
                    'subject' => $subject !== null ? [
                        'id' => $subject->getKey(),
                        'type' => $subject->getMorphClass(),
                    ] : null,
                ];
            })
            ->all();

        return [
            'totals' => [
                'applications' => Application::query()->count(),
                'active_users' => User::query()->where('is_active', true)->count(),
                'vendors' => Vendor::query()->count(),
                'technologies' => Technology::query()->where('is_active', true)->count(),
                'licenses' => License::query()->count(),
                'assignments' => ApplicationAssignment::query()->count(),
                'open_assignments' => ApplicationAssignment::query()->open()->count(),
            ],
            'charts' => [
                'applications_by_status' => $applicationsByStatus,
                'assignments_by_app_role' => $assignmentsByRole,
                'technologies_usage' => $technologiesUsage,
                'employees_per_application' => $employeesPerApplication,
                'applications_by_department' => $applicationsByDepartment,
                'license_usage' => $licenseUsage,
                'license_status_distribution' => $licenseStatusDistribution,
                'licenses_by_environment' => $licensesByEnvironment,
            ],
            'recent_activity' => $recentActivity,
        ];
    }
}
