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
use Illuminate\Http\JsonResponse;

class LookupController extends BaseApiController
{
    public function departments(): JsonResponse
    {
        $departments = Department::query()->orderBy('name_en')->get();

        return $this->successResponse(
            DepartmentResource::collection($departments)->resolve(),
            __('messages.lookups.departments'),
        );
    }

    public function applicationTypes(): JsonResponse
    {
        $types = ApplicationType::query()->orderBy('name_en')->get();

        return $this->successResponse(
            ApplicationTypeResource::collection($types)->resolve(),
            __('messages.lookups.application_types'),
        );
    }

    public function appRoles(): JsonResponse
    {
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

    public function jobTitles(): JsonResponse
    {
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

    public function supportTypes(): JsonResponse
    {
        $items = SupportType::query()
            ->where('is_active', true)
            ->orderBy('name_en')
            ->get();

        return $this->successResponse(
            SupportTypeResource::collection($items)->resolve(),
            __('messages.lookups.support_types'),
        );
    }

    public function criticalities(): JsonResponse
    {
        $items = Criticality::query()
            ->where('is_active', true)
            ->orderBy('name_en')
            ->get();

        return $this->successResponse(
            CriticalityResource::collection($items)->resolve(),
            __('messages.lookups.criticalities'),
        );
    }

    public function applicationStatuses(): JsonResponse
    {
        $items = ApplicationStatus::query()
            ->where('is_active', true)
            ->orderBy('name_en')
            ->get();

        return $this->successResponse(
            ApplicationStatusResource::collection($items)->resolve(),
            __('messages.lookups.application_statuses'),
        );
    }

    public function technologies(): JsonResponse
    {
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
}
