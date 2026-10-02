<?php

declare(strict_types=1);

namespace App\Providers;

use App\Models\Application;
use App\Models\ApplicationAssignment;
use App\Models\ApplicationEnvironment;
use App\Models\ApplicationStatus;
use App\Models\AppRole;
use App\Models\Criticality;
use App\Models\Department;
use App\Models\InfraCategory;
use App\Models\InfraLevel;
use App\Models\InfraLicense;
use App\Models\InfraTeamAssignment;
use App\Models\ServiceDeskCategory;
use App\Models\ServiceDeskLevel;
use App\Models\ServiceDeskLicense;
use App\Models\ServiceDeskTeamAssignment;
use App\Models\NetworkOpsCategory;
use App\Models\NetworkOpsLevel;
use App\Models\NetworkOpsLicense;
use App\Models\NetworkOpsTeamAssignment;
use App\Models\SmartFacilitiesCategory;
use App\Models\SmartFacilitiesLevel;
use App\Models\SmartFacilitiesLicense;
use App\Models\SmartFacilitiesTeamAssignment;
use App\Models\ReleaseManagementCategory;
use App\Models\ReleaseManagementLevel;
use App\Models\ReleaseManagementTeamAssignment;
use App\Models\JobTitle;
use App\Models\License;
use App\Models\Setting;
use App\Models\SupportType;
use App\Models\Technology;
use App\Models\User;
use App\Models\UserDashboardLayout;
use App\Models\Vendor;
use App\Policies\ApplicationAssignmentPolicy;
use App\Policies\ApplicationInfrastructurePolicy;
use App\Policies\ApplicationPolicy;
use App\Policies\ApplicationStatusPolicy;
use App\Policies\AppRolePolicy;
use App\Policies\CriticalityPolicy;
use App\Policies\DepartmentPolicy;
use App\Policies\InfraCategoryPolicy;
use App\Policies\InfraLevelPolicy;
use App\Policies\InfraLicensePolicy;
use App\Policies\InfraTeamAssignmentPolicy;
use App\Policies\ServiceDeskCategoryPolicy;
use App\Policies\ServiceDeskLevelPolicy;
use App\Policies\ServiceDeskLicensePolicy;
use App\Policies\ServiceDeskTeamAssignmentPolicy;
use App\Policies\NetworkOpsCategoryPolicy;
use App\Policies\NetworkOpsLevelPolicy;
use App\Policies\NetworkOpsLicensePolicy;
use App\Policies\NetworkOpsTeamAssignmentPolicy;
use App\Policies\SmartFacilitiesCategoryPolicy;
use App\Policies\SmartFacilitiesLevelPolicy;
use App\Policies\SmartFacilitiesLicensePolicy;
use App\Policies\SmartFacilitiesTeamAssignmentPolicy;
use App\Policies\ReleaseManagementCategoryPolicy;
use App\Policies\ReleaseManagementLevelPolicy;
use App\Policies\ReleaseManagementTeamAssignmentPolicy;
use App\Policies\JobTitlePolicy;
use App\Policies\LicensePolicy;
use App\Policies\SettingPolicy;
use App\Policies\SupportTypePolicy;
use App\Policies\TechnologyPolicy;
use App\Policies\UserDashboardLayoutPolicy;
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
        Gate::policy(License::class, LicensePolicy::class);
        Gate::policy(InfraLicense::class, InfraLicensePolicy::class);
        Gate::policy(ServiceDeskLicense::class, ServiceDeskLicensePolicy::class);
        Gate::policy(Setting::class, SettingPolicy::class);
        Gate::policy(UserDashboardLayout::class, UserDashboardLayoutPolicy::class);
        Gate::policy(ApplicationEnvironment::class, ApplicationInfrastructurePolicy::class);
        Gate::policy(InfraLevel::class, InfraLevelPolicy::class);
        Gate::policy(InfraCategory::class, InfraCategoryPolicy::class);
        Gate::policy(InfraTeamAssignment::class, InfraTeamAssignmentPolicy::class);
        Gate::policy(ServiceDeskLevel::class, ServiceDeskLevelPolicy::class);
        Gate::policy(ServiceDeskCategory::class, ServiceDeskCategoryPolicy::class);
        Gate::policy(ServiceDeskTeamAssignment::class, ServiceDeskTeamAssignmentPolicy::class);
        Gate::policy(NetworkOpsLevel::class, NetworkOpsLevelPolicy::class);
        Gate::policy(NetworkOpsCategory::class, NetworkOpsCategoryPolicy::class);
        Gate::policy(NetworkOpsTeamAssignment::class, NetworkOpsTeamAssignmentPolicy::class);
        Gate::policy(NetworkOpsLicense::class, NetworkOpsLicensePolicy::class);
        Gate::policy(SmartFacilitiesLevel::class, SmartFacilitiesLevelPolicy::class);
        Gate::policy(SmartFacilitiesCategory::class, SmartFacilitiesCategoryPolicy::class);
        Gate::policy(SmartFacilitiesTeamAssignment::class, SmartFacilitiesTeamAssignmentPolicy::class);
        Gate::policy(SmartFacilitiesLicense::class, SmartFacilitiesLicensePolicy::class);
        Gate::policy(ReleaseManagementLevel::class, ReleaseManagementLevelPolicy::class);
        Gate::policy(ReleaseManagementCategory::class, ReleaseManagementCategoryPolicy::class);
        Gate::policy(ReleaseManagementTeamAssignment::class, ReleaseManagementTeamAssignmentPolicy::class);
    }
}
