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

                  {/* Application main data is available to every authenticated user. */}
                  <Route
                    path="applications-details"
                    element={<ApplicationsDetailsPage />}
                  />
                  <Route
                    path="applications-details/:id"
                    element={<LegacyApplicationDetailRedirect />}
                  />
                  <Route path="applications" element={<ApplicationsPage />} />
                  <Route
                    path="applications/:id"
                    element={<ApplicationDetailPage />}
                  />

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
                    element={<RequirePermission permission="licenses.view" />}
                  >
                    <Route path="licenses" element={<LicensesPage />} />
                    <Route
                      path="licenses/:id"
                      element={<LicenseDetailPage />}
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
