import { Outlet, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { ErrorBoundary } from "@/components/ErrorBoundary"
import { cn } from "@/lib/utils"
import { AppHeader } from "@/layouts/AppHeader"
import { AppSidebar } from "@/layouts/AppSidebar"
import { SidebarProvider, useSidebar } from "@/layouts/SidebarContext"

const pageTitleKeys: Record<string, string> = {
  "/": "nav.dashboard",
  "/applications": "nav.applications",
  "/applications-details": "nav.applicationsDetails",
  "/vendors": "nav.vendors",
  "/users": "nav.users",
  "/assignments": "nav.assignments",
  "/departments": "nav.departments",
  "/job-titles": "nav.jobTitles",
  "/app-roles": "nav.appRoles",
  "/support-types": "nav.supportTypes",
  "/criticalities": "nav.criticalities",
  "/application-statuses": "nav.applicationStatuses",
  "/technologies": "nav.technologies",
  "/403": "nav.forbidden",
  "/404": "nav.notFound",
  "/500": "nav.serverError",
}

function resolveTitleKey(pathname: string): string {
  if (pathname.startsWith("/applications-details/")) {
    return "nav.applicationDetail"
  }

  return pageTitleKeys[pathname] ?? "app.fallbackTitle"
}

function DefaultLayoutShell() {
  const { t } = useTranslation()
  const { isExpanded } = useSidebar()
  const { pathname } = useLocation()
  const title = t(resolveTitleKey(pathname))

  return (
    <div className="min-h-screen bg-body">
      <AppSidebar />
      <div
        className={cn(
          "min-h-screen transition-[margin] duration-300",
          isExpanded ? "lg:ms-72" : "lg:ms-[5.25rem]"
        )}
      >
        <AppHeader title={title} />
        <main className="px-4 py-6 md:px-6">
          <ErrorBoundary fallbackTitle={t("errors.pageCrashed")}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}

export function DefaultLayout() {
  return (
    <SidebarProvider>
      <DefaultLayoutShell />
    </SidebarProvider>
  )
}
