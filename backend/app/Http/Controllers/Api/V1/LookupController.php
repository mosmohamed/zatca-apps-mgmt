<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\ApplicationStatusResource;
use App\Http\Resources\ApplicationTypeResource;
use App\Http\Resources\AppRoleResource;
use App\Http\Resources\CriticalityResource;
use App\Http\Resources\DepartmentResource;
use App\Http\Resources\InfraCategoryResource;
use App\Http\Resources\InfraLevelResource;
use App\Http\Resources\JobTitleResource;
use App\Http\Resources\ServiceDeskCategoryResource;
use App\Http\Resources\ServiceDeskLevelResource;
use App\Http\Resources\SupportTypeResource;
use App\Http\Resources\TechnologyResource;
use App\Models\ApplicationStatus;
use App\Models\ApplicationType;
use App\Models\AppRole;
use App\Models\Criticality;
use App\Models\Department;
use App\Models\InfraCategory;
use App\Models\InfraLevel;
use App\Models\JobTitle;
use App\Models\ServiceDeskCategory;
use App\Models\ServiceDeskLevel;
use App\Models\SupportType;
use App\Models\Technology;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LookupController extends BaseApiController
{
    public function departments(Request $request): JsonResponse
    {
        $this->authorizeLookup($request, [
            'departments.view',
            'applications.create',
            'applications.update',
        ], allowAuthenticated: true);

        $departments = Department::query()->orderBy('name_en')->get();

        return $this->successResponse(
            DepartmentResource::collection($departments)->resolve(),
            __('messages.lookups.departments'),
        );
    }

    public function applicationTypes(Request $request): JsonResponse
    {
        $this->authorizeLookup($request, [
            'application-types.view',
            'applications.create',
            'applications.update',
        ], allowAuthenticated: true);

        $types = ApplicationType::query()->orderBy('name_en')->get();

        return $this->successResponse(
            ApplicationTypeResource::collection($types)->resolve(),
            __('messages.lookups.application_types'),
        );
    }

    public function appRoles(Request $request): JsonResponse
    {
        $this->authorizeLookup($request, ['app-roles.view', 'assignments.view', 'assignments.create', 'assignments.update']);

        $roles = AppRole::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->get();

        return $this->successResponse(
            AppRoleResource::collection($roles)->resolve(),
            __('messages.lookups.app_roles'),
        );
    }

    public function jobTitles(Request $request): JsonResponse
    {
        $this->authorizeLookup($request, ['job-titles.view', 'users.view', 'users.create', 'users.update']);

        $jobTitles = JobTitle::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name_en')
            ->get();

        return $this->successResponse(
            JobTitleResource::collection($jobTitles)->resolve(),
            __('messages.lookups.job_titles'),
        );
    }

    public function supportTypes(Request $request): JsonResponse
    {
        $this->authorizeLookup($request, [
            'support-types.view',
            'applications.create',
            'applications.update',
        ], allowAuthenticated: true);

        $items = SupportType::query()
            ->where('is_active', true)
            ->orderBy('name_en')
            ->get();

        return $this->successResponse(
            SupportTypeResource::collection($items)->resolve(),
            __('messages.lookups.support_types'),
        );
    }

    public function criticalities(Request $request): JsonResponse
    {
        $this->authorizeLookup($request, [
            'criticalities.view',
            'applications.create',
            'applications.update',
        ], allowAuthenticated: true);

        $items = Criticality::query()
            ->where('is_active', true)
            ->orderBy('name_en')
            ->get();

        return $this->successResponse(
            CriticalityResource::collection($items)->resolve(),
            __('messages.lookups.criticalities'),
        );
    }

    public function applicationStatuses(Request $request): JsonResponse
    {
        $this->authorizeLookup($request, [
            'application-statuses.view',
            'applications.create',
            'applications.update',
        ], allowAuthenticated: true);

        $items = ApplicationStatus::query()
            ->where('is_active', true)
            ->orderBy('name_en')
            ->get();

        return $this->successResponse(
            ApplicationStatusResource::collection($items)->resolve(),
            __('messages.lookups.application_statuses'),
        );
    }

    public function technologies(Request $request): JsonResponse
    {
        $this->authorizeLookup($request, [
            'technologies.view',
            'applications.create',
            'applications.update',
        ], allowAuthenticated: true);

        $items = Technology::query()
            ->where('is_active', true)
            ->orderBy('category')
            ->orderBy('name')
            ->get();

        return $this->successResponse(
            TechnologyResource::collection($items)->resolve(),
            __('messages.lookups.technologies'),
        );
    }

    public function infraLevels(Request $request): JsonResponse
    {
        $this->authorizeLookup($request, [
            'infra-levels.view',
            'infra-team-assignments.view',
            'infra-team-assignments.create',
            'infra-team-assignments.update',
        ]);

        $items = InfraLevel::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name_en')
            ->get();

        return $this->successResponse(
            InfraLevelResource::collection($items)->resolve(),
            __('messages.lookups.infra_levels'),
        );
    }

    public function infraCategories(Request $request): JsonResponse
    {
        $this->authorizeLookup($request, [
            'infra-categories.view',
            'infra-team-assignments.view',
            'infra-team-assignments.create',
            'infra-team-assignments.update',
        ]);

        $items = InfraCategory::query()
            ->with(['parent'])
            ->withCount([
                'children as children_count' => static function ($query): void {
                    $query->where('is_active', true);
                },
            ])
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name_en')
            ->get();

        return $this->successResponse(
            InfraCategoryResource::collection($items)->resolve(),
            __('messages.lookups.infra_categories'),
        );
    }

    public function serviceDeskLevels(Request $request): JsonResponse
    {
        $this->authorizeLookup($request, [
            'service-desk-levels.view',
            'service-desk-team-assignments.view',
            'service-desk-team-assignments.create',
            'service-desk-team-assignments.update',
        ]);

        $items = ServiceDeskLevel::query()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name_en')
            ->get();

        return $this->successResponse(
            ServiceDeskLevelResource::collection($items)->resolve(),
            __('messages.lookups.service_desk_levels'),
        );
    }

    public function serviceDeskCategories(Request $request): JsonResponse
    {
        $this->authorizeLookup($request, [
            'service-desk-categories.view',
            'service-desk-team-assignments.view',
            'service-desk-team-assignments.create',
            'service-desk-team-assignments.update',
        ]);

        $items = ServiceDeskCategory::query()
            ->with(['parent'])
            ->withCount([
                'children as children_count' => static function ($query): void {
                    $query->where('is_active', true);
                },
            ])
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name_en')
            ->get();

        return $this->successResponse(
            ServiceDeskCategoryResource::collection($items)->resolve(),
            __('messages.lookups.service_desk_categories'),
        );
    }

    /**
     * @param  list<string>  $permissions
     */
    private function authorizeLookup(
        Request $request,
        array $permissions,
        bool $allowAuthenticated = false,
    ): void {
        /** @var User|null $user */
        $user = $request->user();

        if ($user === null) {
            throw new AuthorizationException(__('messages.auth.forbidden'));
        }

        if ($allowAuthenticated || $user->canAny($permissions)) {
            return;
        }

        throw new AuthorizationException(__('messages.auth.forbidden'));
    }
}
