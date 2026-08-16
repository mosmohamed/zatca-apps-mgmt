<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\ActivityLogController;
use App\Http\Controllers\Api\V1\ApplicationController;
use App\Http\Controllers\Api\V1\ApplicationInfrastructureController;
use App\Http\Controllers\Api\V1\ApplicationStatusController;
use App\Http\Controllers\Api\V1\AppRoleController;
use App\Http\Controllers\Api\V1\AssignmentController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CriticalityController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\DashboardLayoutController;
use App\Http\Controllers\Api\V1\DepartmentController;
use App\Http\Controllers\Api\V1\EntityPreviewController;
use App\Http\Controllers\Api\V1\ExportController;
use App\Http\Controllers\Api\V1\GlobalSearchController;
use App\Http\Controllers\Api\V1\InfraCategoryController;
use App\Http\Controllers\Api\V1\InfraLevelController;
use App\Http\Controllers\Api\V1\InfraTeamAssignmentController;
use App\Http\Controllers\Api\V1\JobTitleController;
use App\Http\Controllers\Api\V1\LicenseController;
use App\Http\Controllers\Api\V1\LookupController;
use App\Http\Controllers\Api\V1\PermissionController;
use App\Http\Controllers\Api\V1\RoleController;
use App\Http\Controllers\Api\V1\ServiceDeskCategoryController;
use App\Http\Controllers\Api\V1\ServiceDeskLevelController;
use App\Http\Controllers\Api\V1\ServiceDeskTeamAssignmentController;
use App\Http\Controllers\Api\V1\SettingsController;
use App\Http\Controllers\Api\V1\SupportTypeController;
use App\Http\Controllers\Api\V1\TechnologyController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\VendorController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::post('auth/login', [AuthController::class, 'login']);

    Route::get('settings/public', [SettingsController::class, 'public']);

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::post('auth/logout', [AuthController::class, 'logout']);

        Route::get('dashboard', [DashboardController::class, 'index']);

        Route::get('dashboard/layout', [DashboardLayoutController::class, 'show']);
        Route::put('dashboard/layout', [DashboardLayoutController::class, 'update']);
        Route::delete('dashboard/layout', [DashboardLayoutController::class, 'destroy']);

        Route::get('search', [GlobalSearchController::class, 'search']);

        Route::get('lookups/departments', [LookupController::class, 'departments']);
        Route::get('lookups/application-types', [LookupController::class, 'applicationTypes']);
        Route::get('lookups/app-roles', [LookupController::class, 'appRoles']);
        Route::get('lookups/job-titles', [LookupController::class, 'jobTitles']);
        Route::get('lookups/support-types', [LookupController::class, 'supportTypes']);
        Route::get('lookups/criticalities', [LookupController::class, 'criticalities']);
        Route::get('lookups/application-statuses', [LookupController::class, 'applicationStatuses']);
        Route::get('lookups/technologies', [LookupController::class, 'technologies']);
        Route::get('lookups/infra-levels', [LookupController::class, 'infraLevels']);
        Route::get('lookups/infra-categories', [LookupController::class, 'infraCategories']);
        Route::get('lookups/service-desk-levels', [LookupController::class, 'serviceDeskLevels']);
        Route::get('lookups/service-desk-categories', [LookupController::class, 'serviceDeskCategories']);

        Route::post('exports/{entity}', [ExportController::class, 'store']);

        Route::get('roles', [RoleController::class, 'index']);
        Route::post('roles', [RoleController::class, 'store']);
        Route::get('roles/{role}', [RoleController::class, 'show']);
        Route::put('roles/{role}', [RoleController::class, 'update']);
        Route::delete('roles/{role}', [RoleController::class, 'destroy']);
        Route::put('roles/{role}/permissions', [RoleController::class, 'updatePermissions']);
        Route::get('roles/{role}/users', [RoleController::class, 'users']);
        Route::put('roles/{role}/users', [RoleController::class, 'syncUsers']);
        Route::post('roles/{role}/users', [RoleController::class, 'attachUser']);
        Route::delete('roles/{role}/users/{user}', [RoleController::class, 'detachUser']);

        Route::get('permissions', [PermissionController::class, 'index']);

        Route::get('activity-logs/stats', [ActivityLogController::class, 'stats']);
        Route::get('activity-logs/{id}', [ActivityLogController::class, 'show']);
        Route::get('activity-logs', [ActivityLogController::class, 'index']);

        Route::get('settings', [SettingsController::class, 'index']);
        Route::put('settings', [SettingsController::class, 'update']);

        Route::get('users/preview-by-name', [EntityPreviewController::class, 'userByName']);
        Route::get('users/{user}/preview', [EntityPreviewController::class, 'user']);
        Route::get('vendors/{vendor}/preview', [EntityPreviewController::class, 'vendor']);
        Route::get('applications/{application}/preview', [EntityPreviewController::class, 'application']);
        Route::get('departments/{department}/preview', [EntityPreviewController::class, 'department']);

        Route::get('vendors/statistics', [VendorController::class, 'statistics']);
        Route::apiResource('vendors', VendorController::class);
        Route::get('departments/statistics', [DepartmentController::class, 'statistics']);
        Route::apiResource('departments', DepartmentController::class);
        Route::get('users/statistics', [UserController::class, 'statistics']);
        Route::apiResource('users', UserController::class);
        Route::get(
            'applications/{application}/infrastructure',
            [ApplicationInfrastructureController::class, 'show'],
        );
        Route::post(
            'applications/{application}/infrastructure/copy-environment',
            [ApplicationInfrastructureController::class, 'copyEnvironment'],
        );
        Route::put(
            'applications/{application}/environments/{environment}',
            [ApplicationInfrastructureController::class, 'update'],
        );
        Route::delete(
            'applications/{application}/environments/{environment}',
            [ApplicationInfrastructureController::class, 'destroy'],
        );
        Route::get('applications/statistics', [ApplicationController::class, 'statistics']);
        Route::apiResource('applications', ApplicationController::class);
        Route::get('assignments/statistics', [AssignmentController::class, 'statistics']);
        Route::get('assignments/applications-summary', [AssignmentController::class, 'applicationsSummary']);
        Route::get('assignments/application/{application}', [AssignmentController::class, 'applicationMatrix']);
        Route::post('assignments/bulk', [AssignmentController::class, 'bulkStore']);
        Route::apiResource('assignments', AssignmentController::class);
        Route::apiResource('job-titles', JobTitleController::class);
        Route::apiResource('support-types', SupportTypeController::class);
        Route::apiResource('criticalities', CriticalityController::class);
        Route::apiResource('application-statuses', ApplicationStatusController::class);
        Route::get('technologies/statistics', [TechnologyController::class, 'statistics']);
        Route::apiResource('technologies', TechnologyController::class);
        Route::get('licenses/statistics', [LicenseController::class, 'statistics']);
        Route::apiResource('licenses', LicenseController::class);
        Route::apiResource('app-roles', AppRoleController::class);

        Route::get('infra-categories/statistics', [InfraCategoryController::class, 'statistics']);
        Route::get('infra-categories/tree', [InfraCategoryController::class, 'tree']);
        Route::apiResource('infra-levels', InfraLevelController::class);
        Route::apiResource('infra-categories', InfraCategoryController::class);
        Route::get('infra-team-assignments/statistics', [InfraTeamAssignmentController::class, 'statistics']);
        Route::get('infra-team-assignments/categories-summary', [InfraTeamAssignmentController::class, 'categoriesSummary']);
        Route::get('infra-team-assignments/category/{infraCategory}', [InfraTeamAssignmentController::class, 'categoryMatrix']);
        Route::get('infra-team-assignments/details', [InfraTeamAssignmentController::class, 'details']);
        Route::get('infra-team-assignments/export', [InfraTeamAssignmentController::class, 'export']);
        Route::get('infra-team-assignments/export/{infraCategory}', [InfraTeamAssignmentController::class, 'exportCategory']);
        Route::apiResource('infra-team-assignments', InfraTeamAssignmentController::class);

        Route::get('service-desk-categories/statistics', [ServiceDeskCategoryController::class, 'statistics']);
        Route::get('service-desk-categories/tree', [ServiceDeskCategoryController::class, 'tree']);
        Route::apiResource('service-desk-levels', ServiceDeskLevelController::class)
            ->parameters(['service-desk-levels' => 'infraLevel']);
        Route::apiResource('service-desk-categories', ServiceDeskCategoryController::class)
            ->parameters(['service-desk-categories' => 'infraCategory']);
        Route::get('service-desk-team-assignments/statistics', [ServiceDeskTeamAssignmentController::class, 'statistics']);
        Route::get('service-desk-team-assignments/categories-summary', [ServiceDeskTeamAssignmentController::class, 'categoriesSummary']);
        Route::get('service-desk-team-assignments/category/{infraCategory}', [ServiceDeskTeamAssignmentController::class, 'categoryMatrix']);
        Route::get('service-desk-team-assignments/details', [ServiceDeskTeamAssignmentController::class, 'details']);
        Route::get('service-desk-team-assignments/export', [ServiceDeskTeamAssignmentController::class, 'export']);
        Route::get('service-desk-team-assignments/export/{infraCategory}', [ServiceDeskTeamAssignmentController::class, 'exportCategory']);
        Route::apiResource('service-desk-team-assignments', ServiceDeskTeamAssignmentController::class)
            ->parameters(['service-desk-team-assignments' => 'infraTeamAssignment']);
    });
});
