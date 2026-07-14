<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\ApplicationController;
use App\Http\Controllers\Api\V1\ApplicationStatusController;
use App\Http\Controllers\Api\V1\AppRoleController;
use App\Http\Controllers\Api\V1\AssignmentController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CriticalityController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\DepartmentController;
use App\Http\Controllers\Api\V1\JobTitleController;
use App\Http\Controllers\Api\V1\LookupController;
use App\Http\Controllers\Api\V1\SupportTypeController;
use App\Http\Controllers\Api\V1\TechnologyController;
use App\Http\Controllers\Api\V1\UserController;
use App\Http\Controllers\Api\V1\VendorController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function (): void {
    Route::post('auth/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function (): void {
        Route::get('auth/me', [AuthController::class, 'me']);
        Route::post('auth/logout', [AuthController::class, 'logout']);

        Route::get('dashboard', [DashboardController::class, 'index']);

        Route::get('lookups/departments', [LookupController::class, 'departments']);
        Route::get('lookups/application-types', [LookupController::class, 'applicationTypes']);
        Route::get('lookups/app-roles', [LookupController::class, 'appRoles']);
        Route::get('lookups/job-titles', [LookupController::class, 'jobTitles']);
        Route::get('lookups/support-types', [LookupController::class, 'supportTypes']);
        Route::get('lookups/criticalities', [LookupController::class, 'criticalities']);
        Route::get('lookups/application-statuses', [LookupController::class, 'applicationStatuses']);
        Route::get('lookups/technologies', [LookupController::class, 'technologies']);

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
        Route::apiResource('app-roles', AppRoleController::class);
    });
});
