import { Suspense, lazy } from "react"
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useParams,
} from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Toaster } from "sonner"

import { AppProviders } from "@/app/providers"
import {
  ForbiddenPage,
  NotFoundPage,
  ServerErrorPage,
} from "@/components/error-pages"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import { GuestRoute } from "@/features/auth/components/GuestRoute"
import { ProtectedRoute } from "@/features/auth/components/ProtectedRoute"
import { RequirePermission } from "@/features/auth/components/RequirePermission"
import { AuthProvider } from "@/features/auth/hooks/use-auth"
import { LoginPage } from "@/features/auth/pages/LoginPage"
import { SettingsProvider } from "@/features/settings/hooks/use-settings"
import { DefaultLayout } from "@/layouts/DefaultLayout"

const DashboardPage = lazy(() =>
  import("@/features/dashboard/pages/DashboardPage").then((module) => ({
    default: module.DashboardPage,
  }))
)
const AssignmentsPage = lazy(() =>
  import("@/features/assignments/pages/AssignmentsPage").then((module) => ({
    default: module.AssignmentsPage,
  }))
)
const ApplicationsDetailsPage = lazy(() =>
  import("@/features/applications/pages/ApplicationsDetailsPage").then(
    (module) => ({
      default: module.ApplicationsDetailsPage,
    })
  )
)
const ApplicationDetailPage = lazy(() =>
  import("@/features/applications/pages/ApplicationDetailPage").then(
    (module) => ({
      default: module.ApplicationDetailPage,
    })
  )
)
const ApplicationEditPage = lazy(() =>
  import("@/features/applications/pages/ApplicationEditPage").then(
    (module) => ({
      default: module.ApplicationEditPage,
    })
  )
)
const ApplicationsPage = lazy(() =>
  import("@/features/applications/pages/ApplicationsPage").then((module) => ({
    default: module.ApplicationsPage,
  }))
)
const VendorsPage = lazy(() =>
  import("@/features/vendors/pages/VendorsPage").then((module) => ({
    default: module.VendorsPage,
  }))
)
const UsersPage = lazy(() =>
  import("@/features/users/pages/UsersPage").then((module) => ({
    default: module.UsersPage,
  }))
)
const DepartmentsPage = lazy(() =>
  import("@/features/departments/pages/DepartmentsPage").then((module) => ({
    default: module.DepartmentsPage,
  }))
)
const JobTitlesPage = lazy(() =>
  import("@/features/job-titles/pages/JobTitlesPage").then((module) => ({
    default: module.JobTitlesPage,
  }))
)
const AppRolesPage = lazy(() =>
  import("@/features/app-roles/pages/AppRolesPage").then((module) => ({
    default: module.AppRolesPage,
  }))
)
const SupportTypesPage = lazy(() =>
  import("@/features/support-types/pages/SupportTypesPage").then((module) => ({
    default: module.SupportTypesPage,
  }))
)
const CriticalitiesPage = lazy(() =>
  import("@/features/criticalities/pages/CriticalitiesPage").then((module) => ({
    default: module.CriticalitiesPage,
  }))
)
const ApplicationStatusesPage = lazy(() =>
  import("@/features/application-statuses/pages/ApplicationStatusesPage").then(
    (module) => ({
      default: module.ApplicationStatusesPage,
    })
  )
)
const TechnologiesPage = lazy(() =>
  import("@/features/technologies/pages/TechnologiesPage").then((module) => ({
    default: module.TechnologiesPage,
  }))
)
const LicensesPage = lazy(() =>
  import("@/features/licenses/pages/LicensesPage").then((module) => ({
    default: module.LicensesPage,
  }))
)
const LicenseDetailPage = lazy(() =>
  import("@/features/licenses/pages/LicenseDetailPage").then((module) => ({
    default: module.LicenseDetailPage,
  }))
)
const RolesPage = lazy(() =>
  import("@/features/roles/pages/RolesPage").then((module) => ({
    default: module.RolesPage,
  }))
)
const InfraCategoriesPage = lazy(() =>
  import("@/features/operation-infra/pages/InfraCategoriesPage").then(
    (module) => ({
      default: module.InfraCategoriesPage,
    })
  )
)
const TeamAssignmentsPage = lazy(() =>
  import("@/features/operation-infra/pages/TeamAssignmentsPage").then(
    (module) => ({
      default: module.TeamAssignmentsPage,
    })
  )
)
const InfraTeamsDetailsPage = lazy(() =>
  import("@/features/operation-infra/pages/InfraTeamsDetailsPage").then(
    (module) => ({
      default: module.InfraTeamsDetailsPage,
    })
  )
)
const InfraTeamDetailPage = lazy(() =>
  import("@/features/operation-infra/pages/InfraTeamDetailPage").then(
    (module) => ({
      default: module.InfraTeamDetailPage,
    })
  )
)
const ServiceDeskCategoriesPage = lazy(() =>
  import("@/features/service-desk/pages/ServiceDeskCategoriesPage").then(
    (module) => ({
      default: module.ServiceDeskCategoriesPage,
    })
  )
)
const ServiceDeskTeamAssignmentsPage = lazy(() =>
  import("@/features/service-desk/pages/ServiceDeskTeamAssignmentsPage").then(
    (module) => ({
      default: module.ServiceDeskTeamAssignmentsPage,
    })
  )
)
const ServiceDeskEscalationMatrixPage = lazy(() =>
  import("@/features/service-desk/pages/ServiceDeskEscalationMatrixPage").then(
    (module) => ({
      default: module.ServiceDeskEscalationMatrixPage,
    })
  )
)
const ServiceDeskEscalationMatrixDetailPage = lazy(() =>
  import(
    "@/features/service-desk/pages/ServiceDeskEscalationMatrixDetailPage"
  ).then((module) => ({
    default: module.ServiceDeskEscalationMatrixDetailPage,
  }))
)
const AreaScopedUsersPage = lazy(() =>
  import("@/features/users/pages/AreaScopedUsersPage").then((module) => ({
    default: module.AreaScopedUsersPage,
  }))
)
const AreaScopedVendorsPage = lazy(() =>
  import("@/features/vendors/pages/AreaScopedVendorsPage").then((module) => ({
    default: module.AreaScopedVendorsPage,
  }))
)
const NetworkOpsCategoriesPage = lazy(() =>
  import("@/features/network-ops/pages/NetworkOpsCategoriesPage").then(
    (module) => ({
      default: module.NetworkOpsCategoriesPage,
    })
  )
)
const NetworkOpsTeamAssignmentsPage = lazy(() =>
  import("@/features/network-ops/pages/NetworkOpsTeamAssignmentsPage").then(
    (module) => ({
      default: module.NetworkOpsTeamAssignmentsPage,
    })
  )
)
const NetworkOpsEscalationMatrixPage = lazy(() =>
  import("@/features/network-ops/pages/NetworkOpsEscalationMatrixPage").then(
    (module) => ({
      default: module.NetworkOpsEscalationMatrixPage,
    })
  )
)
const NetworkOpsEscalationMatrixDetailPage = lazy(() =>
  import(
    "@/features/network-ops/pages/NetworkOpsEscalationMatrixDetailPage"
  ).then((module) => ({
    default: module.NetworkOpsEscalationMatrixDetailPage,
  }))
)
const SmartFacilitiesCategoriesPage = lazy(() =>
  import(
    "@/features/smart-facilities/pages/SmartFacilitiesCategoriesPage"
  ).then((module) => ({
    default: module.SmartFacilitiesCategoriesPage,
  }))
)
const SmartFacilitiesTeamAssignmentsPage = lazy(() =>
  import(
    "@/features/smart-facilities/pages/SmartFacilitiesTeamAssignmentsPage"
  ).then((module) => ({
    default: module.SmartFacilitiesTeamAssignmentsPage,
  }))
)
const SmartFacilitiesEscalationMatrixPage = lazy(() =>
  import(
    "@/features/smart-facilities/pages/SmartFacilitiesEscalationMatrixPage"
  ).then((module) => ({
    default: module.SmartFacilitiesEscalationMatrixPage,
  }))
)
const SmartFacilitiesEscalationMatrixDetailPage = lazy(() =>
  import(
    "@/features/smart-facilities/pages/SmartFacilitiesEscalationMatrixDetailPage"
  ).then((module) => ({
    default: module.SmartFacilitiesEscalationMatrixDetailPage,
  }))
)
const ReleaseManagementCategoriesPage = lazy(() =>
  import(
    "@/features/release-management/pages/ReleaseManagementCategoriesPage"
  ).then((module) => ({
    default: module.ReleaseManagementCategoriesPage,
  }))
)
const ReleaseManagementTeamAssignmentsPage = lazy(() =>
  import(
    "@/features/release-management/pages/ReleaseManagementTeamAssignmentsPage"
  ).then((module) => ({
    default: module.ReleaseManagementTeamAssignmentsPage,
  }))
)
const ReleaseManagementEscalationMatrixPage = lazy(() =>
  import(
    "@/features/release-management/pages/ReleaseManagementEscalationMatrixPage"
  ).then((module) => ({
    default: module.ReleaseManagementEscalationMatrixPage,
  }))
)
const ReleaseManagementEscalationMatrixDetailPage = lazy(() =>
  import(
    "@/features/release-management/pages/ReleaseManagementEscalationMatrixDetailPage"
  ).then((module) => ({
    default: module.ReleaseManagementEscalationMatrixDetailPage,
  }))
)
const ActivityLogPage = lazy(() =>
  import("@/features/activity-log/pages/ActivityLogPage").then((module) => ({
    default: module.ActivityLogPage,
  }))
)
const SettingsPage = lazy(() =>
  import("@/features/settings/pages/SettingsPage").then((module) => ({
    default: module.SettingsPage,
  }))
)

/** Keeps bookmarks to the previous detail URL working. */
function LegacyApplicationDetailRedirect() {
  const { id } = useParams()

  return <Navigate to={`/applications/${id ?? ""}`} replace />
}

function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-muted-foreground">
      Loading...
    </div>
  )
}

function AppRoutes() {
  const { t, i18n } = useTranslation()
  const toasterPosition = i18n.language === "ar" ? "top-left" : "top-right"

  return (
    <>
      <ErrorBoundary fallbackTitle={t("errors.appError")}>
        <BrowserRouter>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              <Route
                path="/login"
                element={
                  <GuestRoute>
                    <LoginPage />
                  </GuestRoute>
                }
              />

              <Route element={<ProtectedRoute />}>
                <Route element={<DefaultLayout />}>
                  <Route index element={<DashboardPage />} />

                  <Route
                    element={
                      <RequirePermission permission="assignments.view" />
                    }
                  >
                    <Route path="assignments" element={<AssignmentsPage />} />
                  </Route>

                  <Route
                    element={
                      <RequirePermission permission="applications-details.view" />
                    }
                  >
                    <Route
                      path="applications-details"
                      element={<ApplicationsDetailsPage />}
                    />
                    <Route
                      path="applications-details/:id"
                      element={<LegacyApplicationDetailRedirect />}
                    />
                  </Route>

                  <Route
                    element={
                      <RequirePermission permission="applications.view" />
                    }
                  >
                    <Route path="applications" element={<ApplicationsPage />} />
                    <Route
                      path="applications/:id"
                      element={<ApplicationDetailPage />}
                    />
                  </Route>

                  <Route
                    element={
                      <RequirePermission permission="applications.update" />
                    }
                  >
                    <Route
                      path="applications/:id/edit"
                      element={<ApplicationEditPage />}
                    />
                  </Route>

                  <Route
                    element={<RequirePermission permission="vendors.view" />}
                  >
                    <Route path="vendors" element={<VendorsPage />} />
                  </Route>

                  <Route
                    element={<RequirePermission permission="users.view" />}
                  >
                    <Route path="users" element={<UsersPage />} />
                  </Route>

                  <Route
                    element={
                      <RequirePermission permission="departments.view" />
                    }
                  >
                    <Route path="departments" element={<DepartmentsPage />} />
                  </Route>

                  <Route
                    element={<RequirePermission permission="job-titles.view" />}
                  >
                    <Route path="job-titles" element={<JobTitlesPage />} />
                  </Route>

                  <Route
                    element={<RequirePermission permission="app-roles.view" />}
                  >
                    <Route path="app-roles" element={<AppRolesPage />} />
                  </Route>

                  <Route
                    element={
                      <RequirePermission permission="support-types.view" />
                    }
                  >
                    <Route
                      path="support-types"
                      element={<SupportTypesPage />}
                    />
                  </Route>

                  <Route
                    element={
                      <RequirePermission permission="criticalities.view" />
                    }
                  >
                    <Route
                      path="criticalities"
                      element={<CriticalitiesPage />}
                    />
                  </Route>

                  <Route
                    element={
                      <RequirePermission permission="application-statuses.view" />
                    }
                  >
                    <Route
                      path="application-statuses"
                      element={<ApplicationStatusesPage />}
                    />
                  </Route>

                  <Route
                    element={
                      <RequirePermission permission="technologies.view" />
                    }
                  >
                    <Route
                      path="technologies"
                      element={<TechnologiesPage />}
                    />
                  </Route>

                  <Route
                    element={
                      <RequirePermission permission="infra-categories.view" />
                    }
                  >
                    <Route
                      path="infra-categories"
                      element={<InfraCategoriesPage />}
                    />
                  </Route>

                  <Route
                    element={
                      <RequirePermission permission="infra-team-assignments.view" />
                    }
                  >
                    <Route
                      path="infra-team-assignments"
                      element={<TeamAssignmentsPage />}
                    />
                  </Route>

                  <Route
                    element={
                      <RequirePermission permission="infra-escalation-matrix.view" />
                    }
                  >
                    <Route
                      path="infra-teams-details"
                      element={<InfraTeamsDetailsPage />}
                    />
                    <Route
                      path="infra-teams-details/:id"
                      element={<InfraTeamDetailPage />}
                    />
                  </Route>

                  <Route
                    element={
                      <RequirePermission permission="infra-employees.view" />
                    }
                  >
                    <Route
                      path="infra-employees"
                      element={
                        <AreaScopedUsersPage
                          area="infra"
                          viewPermission="infra-employees.view"
                          titleKey="nav.infraEmployees"
                        />
                      }
                    />
                  </Route>

                  <Route
                    element={
                      <RequirePermission permission="infra-vendors.view" />
                    }
                  >
                    <Route
                      path="infra-vendors"
                      element={
                        <AreaScopedVendorsPage
                          area="infra"
                          viewPermission="infra-vendors.view"
                          titleKey="nav.infraVendors"
                        />
                      }
                    />
                  </Route>

                  <Route
                    element={
                      <RequirePermission permission="service-desk-categories.view" />
                    }
                  >
                    <Route
                      path="service-desk-categories"
                      element={<ServiceDeskCategoriesPage />}
                    />
                  </Route>

                  <Route
                    element={
                      <RequirePermission permission="service-desk-team-assignments.view" />
                    }
                  >
                    <Route
                      path="service-desk-team-assignments"
                      element={<ServiceDeskTeamAssignmentsPage />}
                    />
                  </Route>

                  <Route
                    element={
                      <RequirePermission permission="service-desk-escalation-matrix.view" />
                    }
                  >
                    <Route
                      path="service-desk-escalation-matrix"
                      element={<ServiceDeskEscalationMatrixPage />}
                    />
                    <Route
                      path="service-desk-escalation-matrix/:id"
                      element={<ServiceDeskEscalationMatrixDetailPage />}
                    />
                  </Route>

                  <Route
                    element={
                      <RequirePermission permission="service-desk-employees.view" />
                    }
                  >
                    <Route
                      path="service-desk-employees"
                      element={
                        <AreaScopedUsersPage
                          area="service_desk"
                          viewPermission="service-desk-employees.view"
                          titleKey="nav.serviceDeskEmployees"
                        />
                      }
                    />
                  </Route>

                  <Route
                    element={
                      <RequirePermission permission="service-desk-vendors.view" />
                    }
                  >
                    <Route
                      path="service-desk-vendors"
                      element={
                        <AreaScopedVendorsPage
                          area="service_desk"
                          viewPermission="service-desk-vendors.view"
                          titleKey="nav.serviceDeskVendors"
                        />
                      }
                    />
                  </Route>

                  <Route
                    element={
                      <RequirePermission permission="network-ops-categories.view" />
                    }
                  >
                    <Route
                      path="network-ops-categories"
                      element={<NetworkOpsCategoriesPage />}
                    />
                  </Route>

                  <Route
                    element={
                      <RequirePermission permission="network-ops-team-assignments.view" />
                    }
                  >
                    <Route
                      path="network-ops-team-assignments"
                      element={<NetworkOpsTeamAssignmentsPage />}
                    />
                  </Route>

                  <Route
                    element={
                      <RequirePermission permission="network-ops-escalation-matrix.view" />
                    }
                  >
                    <Route
                      path="network-ops-escalation-matrix"
                      element={<NetworkOpsEscalationMatrixPage />}
                    />
                    <Route
                      path="network-ops-escalation-matrix/:id"
                      element={<NetworkOpsEscalationMatrixDetailPage />}
                    />
                  </Route>

                  <Route
                    element={
                      <RequirePermission permission="network-ops-employees.view" />
                    }
                  >
                    <Route
                      path="network-ops-employees"
                      element={
                        <AreaScopedUsersPage
                          area="network_ops"
                          viewPermission="network-ops-employees.view"
                          titleKey="nav.networkOpsEmployees"
                        />
                      }
                    />
                  </Route>

                  <Route
                    element={
                      <RequirePermission permission="network-ops-vendors.view" />
                    }
                  >
                    <Route
                      path="network-ops-vendors"
                      element={
                        <AreaScopedVendorsPage
                          area="network_ops"
                          viewPermission="network-ops-vendors.view"
                          titleKey="nav.networkOpsVendors"
                        />
                      }
                    />
                  </Route>

                  <Route
                    element={
                      <RequirePermission permission="smart-facilities-categories.view" />
                    }
                  >
                    <Route
                      path="smart-facilities-categories"
                      element={<SmartFacilitiesCategoriesPage />}
                    />
                  </Route>

                  <Route
                    element={
                      <RequirePermission permission="smart-facilities-team-assignments.view" />
                    }
                  >
                    <Route
                      path="smart-facilities-team-assignments"
                      element={<SmartFacilitiesTeamAssignmentsPage />}
                    />
                  </Route>

                  <Route
                    element={
                      <RequirePermission permission="smart-facilities-escalation-matrix.view" />
                    }
                  >
                    <Route
                      path="smart-facilities-escalation-matrix"
                      element={<SmartFacilitiesEscalationMatrixPage />}
                    />
                    <Route
                      path="smart-facilities-escalation-matrix/:id"
                      element={
                        <SmartFacilitiesEscalationMatrixDetailPage />
                      }
                    />
                  </Route>

                  <Route
                    element={
                      <RequirePermission permission="smart-facilities-employees.view" />
                    }
                  >
                    <Route
                      path="smart-facilities-employees"
                      element={
                        <AreaScopedUsersPage
                          area="smart_facilities"
                          viewPermission="smart-facilities-employees.view"
                          titleKey="nav.smartFacilitiesEmployees"
                        />
                      }
                    />
                  </Route>

                  <Route
                    element={
                      <RequirePermission permission="smart-facilities-vendors.view" />
                    }
                  >
                    <Route
                      path="smart-facilities-vendors"
                      element={
                        <AreaScopedVendorsPage
                          area="smart_facilities"
                          viewPermission="smart-facilities-vendors.view"
                          titleKey="nav.smartFacilitiesVendors"
                        />
                      }
                    />
                  </Route>

                  <Route
                    element={
                      <RequirePermission permission="release-management-categories.view" />
                    }
                  >
                    <Route
                      path="release-management-categories"
                      element={<ReleaseManagementCategoriesPage />}
                    />
                  </Route>

                  <Route
                    element={
                      <RequirePermission permission="release-management-team-assignments.view" />
                    }
                  >
                    <Route
                      path="release-management-team-assignments"
                      element={<ReleaseManagementTeamAssignmentsPage />}
                    />
                  </Route>

                  <Route
                    element={
                      <RequirePermission permission="release-management-escalation-matrix.view" />
                    }
                  >
                    <Route
                      path="release-management-escalation-matrix"
                      element={<ReleaseManagementEscalationMatrixPage />}
                    />
                    <Route
                      path="release-management-escalation-matrix/:id"
                      element={
                        <ReleaseManagementEscalationMatrixDetailPage />
                      }
                    />
                  </Route>

                  <Route
                    element={
                      <RequirePermission permission="release-management-employees.view" />
                    }
                  >
                    <Route
                      path="release-management-employees"
                      element={
                        <AreaScopedUsersPage
                          area="release_management"
                          viewPermission="release-management-employees.view"
                          titleKey="nav.releaseManagementEmployees"
                        />
                      }
                    />
                  </Route>

                  <Route
                    element={
                      <RequirePermission permission="release-management-vendors.view" />
                    }
                  >
                    <Route
                      path="release-management-vendors"
                      element={
                        <AreaScopedVendorsPage
                          area="release_management"
                          viewPermission="release-management-vendors.view"
                          titleKey="nav.releaseManagementVendors"
                        />
                      }
                    />
                  </Route>

                  <Route
                    element={<RequirePermission permission="licenses.view" />}
                  >
                    <Route
                      path="licenses"
                      element={<LicensesPage moduleId="apps" />}
                    />
                    <Route
                      path="licenses/:id"
                      element={<LicenseDetailPage moduleId="apps" />}
                    />
                  </Route>

                  <Route
                    element={
                      <RequirePermission permission="infra-licenses.view" />
                    }
                  >
                    <Route
                      path="infra-licenses"
                      element={<LicensesPage moduleId="infra" />}
                    />
                    <Route
                      path="infra-licenses/:id"
                      element={<LicenseDetailPage moduleId="infra" />}
                    />
                  </Route>

                  <Route
                    element={
                      <RequirePermission permission="service-desk-licenses.view" />
                    }
                  >
                    <Route
                      path="service-desk-licenses"
                      element={<LicensesPage moduleId="service-desk" />}
                    />
                    <Route
                      path="service-desk-licenses/:id"
                      element={
                        <LicenseDetailPage moduleId="service-desk" />
                      }
                    />
                  </Route>

                  <Route
                    element={
                      <RequirePermission permission="network-ops-licenses.view" />
                    }
                  >
                    <Route
                      path="network-ops-licenses"
                      element={<LicensesPage moduleId="network-ops" />}
                    />
                    <Route
                      path="network-ops-licenses/:id"
                      element={
                        <LicenseDetailPage moduleId="network-ops" />
                      }
                    />
                  </Route>

                  <Route
                    element={
                      <RequirePermission permission="smart-facilities-licenses.view" />
                    }
                  >
                    <Route
                      path="smart-facilities-licenses"
                      element={<LicensesPage moduleId="smart-facilities" />}
                    />
                    <Route
                      path="smart-facilities-licenses/:id"
                      element={
                        <LicenseDetailPage moduleId="smart-facilities" />
                      }
                    />
                  </Route>

                  <Route
                    element={<RequirePermission permission="roles.view" />}
                  >
                    <Route path="roles" element={<RolesPage />} />
                  </Route>

                  <Route
                    element={
                      <RequirePermission permission="activity-log.view" />
                    }
                  >
                    <Route path="activity-log" element={<ActivityLogPage />} />
                  </Route>

                  <Route
                    element={<RequirePermission permission="settings.view" />}
                  >
                    <Route path="settings" element={<SettingsPage />} />
                  </Route>

                  <Route path="403" element={<ForbiddenPage />} />
                  <Route path="500" element={<ServerErrorPage />} />
                  <Route path="404" element={<NotFoundPage />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ErrorBoundary>
      <Toaster richColors closeButton position={toasterPosition} />
    </>
  )
}

export function AppRouter() {
  return (
    <AppProviders>
      <AuthProvider>
        <SettingsProvider>
          <AppRoutes />
        </SettingsProvider>
      </AuthProvider>
    </AppProviders>
  )
}
