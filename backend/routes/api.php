<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\ActivityLogController;
use App\Http\Controllers\Api\V1\ApplicationController;
use App\Http\Controllers\Api\V1\ApplicationStatusController;
use App\Http\Controllers\Api\V1\AppRoleController;
use App\Http\Controllers\Api\V1\AssignmentController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CriticalityController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\DepartmentController;
use App\Http\Controllers\Api\V1\ExportController;
use App\Http\Controllers\Api\V1\GlobalSearchController;
use App\Http\Controllers\Api\V1\JobTitleController;
use App\Http\Controllers\Api\V1\LicenseController;
use App\Http\Controllers\Api\V1\LookupController;
use App\Http\Controllers\Api\V1\PermissionController;
use App\Http\Controllers\Api\V1\RoleController;
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

        Route::get('search', [GlobalSearchController::class, 'search']);

        Route::get('lookups/departments', [LookupController::class, 'departments']);
        Route::get('lookups/application-types', [LookupController::class, 'applicationTypes']);
        Route::get('lookups/app-roles', [LookupController::class, 'appRoles']);
        Route::get('lookups/job-titles', [LookupController::class, 'jobTitles']);
        Route::get('lookups/support-types', [LookupController::class, 'supportTypes']);
        Route::get('lookups/criticalities', [LookupController::class, 'criticalities']);
        Route::get('lookups/application-statuses', [LookupController::class, 'applicationStatuses']);
        Route::get('lookups/technologies', [LookupController::class, 'technologies']);

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

        Route::apiResource('vendors', VendorController::class);
        Route::apiResource('departments', DepartmentController::class);
        Route::apiResource('users', UserController::class);
        Route::apiResource('applications', ApplicationController::class);
        Route::get('assignments/applications-summary', [AssignmentController::class, 'applicationsSummary']);
        Route::get('assignments/application/{application}', [AssignmentController::class, 'applicationMatrix']);
        Route::post('assignments/bulk', [AssignmentController::class, 'bulkStore']);
        Route::apiResource('assignments', AssignmentController::class);
        Route::apiResource('job-titles', JobTitleController::class);
        Route::apiResource('support-types', SupportTypeController::class);
        Route::apiResource('criticalities', CriticalityController::class);
        Route::apiResource('application-statuses', ApplicationStatusController::class);
        Route::apiResource('technologies', TechnologyController::class);
        Route::get('licenses/statistics', [LicenseController::class, 'statistics']);
        Route::apiResource('licenses', LicenseController::class);
        Route::apiResource('app-roles', AppRoleController::class);
    });
});
