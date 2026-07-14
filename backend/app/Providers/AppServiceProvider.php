<?php

declare(strict_types=1);

namespace App\Providers;

use App\Models\AppRole;
use App\Models\Application;
use App\Models\ApplicationAssignment;
use App\Models\ApplicationStatus;
use App\Models\Criticality;
use App\Models\Department;
use App\Models\JobTitle;
use App\Models\Setting;
use App\Models\SupportType;
use App\Models\Technology;
use App\Models\User;
use App\Models\Vendor;
use App\Policies\AppRolePolicy;
use App\Policies\ApplicationAssignmentPolicy;
use App\Policies\ApplicationPolicy;
use App\Policies\ApplicationStatusPolicy;
use App\Policies\CriticalityPolicy;
use App\Policies\DepartmentPolicy;
use App\Policies\JobTitlePolicy;
use App\Policies\SettingPolicy;
use App\Policies\SupportTypePolicy;
use App\Policies\TechnologyPolicy;
use App\Policies\UserPolicy;
use App\Policies\VendorPolicy;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Model::shouldBeStrict(! $this->app->isProduction());
        Model::preventLazyLoading(! $this->app->isProduction());

        Gate::policy(Application::class, ApplicationPolicy::class);
        Gate::policy(Vendor::class, VendorPolicy::class);
        Gate::policy(User::class, UserPolicy::class);
        Gate::policy(ApplicationAssignment::class, ApplicationAssignmentPolicy::class);
        Gate::policy(Department::class, DepartmentPolicy::class);
        Gate::policy(JobTitle::class, JobTitlePolicy::class);
        Gate::policy(SupportType::class, SupportTypePolicy::class);
        Gate::policy(Criticality::class, CriticalityPolicy::class);
        Gate::policy(ApplicationStatus::class, ApplicationStatusPolicy::class);
        Gate::policy(AppRole::class, AppRolePolicy::class);
        Gate::policy(Technology::class, TechnologyPolicy::class);
        Gate::policy(Setting::class, SettingPolicy::class);
    }
}
