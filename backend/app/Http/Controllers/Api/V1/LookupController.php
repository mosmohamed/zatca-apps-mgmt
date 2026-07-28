<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\AppRoleResource;
use App\Http\Resources\ApplicationStatusResource;
use App\Http\Resources\ApplicationTypeResource;
use App\Http\Resources\CriticalityResource;
use App\Http\Resources\DepartmentResource;
use App\Http\Resources\JobTitleResource;
use App\Http\Resources\SupportTypeResource;
use App\Http\Resources\TechnologyResource;
use App\Models\AppRole;
use App\Models\ApplicationStatus;
use App\Models\ApplicationType;
use App\Models\Criticality;
use App\Models\Department;
use App\Models\JobTitle;
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
