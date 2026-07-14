import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
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
import { AuthProvider } from "@/features/auth/hooks/use-auth"
import { LoginPage } from "@/features/auth/pages/LoginPage"
import { ApplicationStatusesPage } from "@/features/application-statuses/pages/ApplicationStatusesPage"
import { ApplicationsPage } from "@/features/applications/pages/ApplicationsPage"
import { AppRolesPage } from "@/features/app-roles/pages/AppRolesPage"
import { AssignmentsPage } from "@/features/assignments/pages/AssignmentsPage"
import { CriticalitiesPage } from "@/features/criticalities/pages/CriticalitiesPage"
import { DashboardPage } from "@/features/dashboard/pages/DashboardPage"
import { DepartmentsPage } from "@/features/departments/pages/DepartmentsPage"
import { JobTitlesPage } from "@/features/job-titles/pages/JobTitlesPage"
import { SupportTypesPage } from "@/features/support-types/pages/SupportTypesPage"
import { TechnologiesPage } from "@/features/technologies/pages/TechnologiesPage"
import { UsersPage } from "@/features/users/pages/UsersPage"
import { VendorsPage } from "@/features/vendors/pages/VendorsPage"
import { DefaultLayout } from "@/layouts/DefaultLayout"

function AppRoutes() {
  const { t, i18n } = useTranslation()
  const toasterPosition = i18n.language === "ar" ? "top-left" : "top-right"

  return (
    <>
      <ErrorBoundary fallbackTitle={t("errors.appError")}>
        <BrowserRouter>
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
                <Route path="assignments" element={<AssignmentsPage />} />
                <Route path="applications" element={<ApplicationsPage />} />
                <Route path="vendors" element={<VendorsPage />} />
                <Route path="users" element={<UsersPage />} />
                <Route path="departments" element={<DepartmentsPage />} />
                <Route path="job-titles" element={<JobTitlesPage />} />
                <Route path="app-roles" element={<AppRolesPage />} />
                <Route path="support-types" element={<SupportTypesPage />} />
                <Route path="criticalities" element={<CriticalitiesPage />} />
                <Route
                  path="application-statuses"
                  element={<ApplicationStatusesPage />}
                />
                <Route path="technologies" element={<TechnologiesPage />} />
                <Route path="403" element={<ForbiddenPage />} />
                <Route path="500" element={<ServerErrorPage />} />
                <Route path="404" element={<NotFoundPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
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
        <AppRoutes />
      </AuthProvider>
    </AppProviders>
  )
}
