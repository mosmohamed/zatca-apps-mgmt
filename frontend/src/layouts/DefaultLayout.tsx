import { useEffect, useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { ErrorBoundary } from "@/components/ErrorBoundary"
import { OfflineBanner } from "@/components/error-pages"
import { GlobalSearchDialog } from "@/features/search/components/GlobalSearchDialog"
import { useSettings } from "@/features/settings/hooks/use-settings"
import { useOnlineStatus } from "@/hooks/use-online-status"
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
  "/infra-categories": "nav.infraCategories",
  "/infra-team-assignments": "nav.infraTeamAssignments",
  "/infra-teams-details": "nav.infraTeamsDetails",
  "/service-desk-categories": "nav.serviceDeskCategories",
  "/service-desk-team-assignments": "nav.serviceDeskTeamAssignments",
  "/service-desk-escalation-matrix": "nav.serviceDeskEscalationMatrix",
  "/licenses": "nav.licenses",
  "/roles": "nav.roles",
  "/activity-log": "nav.activityLog",
  "/settings": "nav.settings",
  "/403": "nav.forbidden",
  "/404": "nav.notFound",
  "/500": "nav.serverError",
}

function resolveTitleKey(pathname: string): string {
  if (pathname.endsWith("/edit") && pathname.startsWith("/applications/")) {
    return "nav.applicationEdit"
  }

  if (
    pathname.startsWith("/applications-details/") ||
    pathname.startsWith("/applications/")
  ) {
    return "nav.applicationDetail"
  }

  if (pathname.startsWith("/licenses/") && pathname !== "/licenses") {
    return "nav.licenseDetail"
  }

  if (
    pathname.startsWith("/infra-teams-details/") &&
    pathname !== "/infra-teams-details"
  ) {
    return "nav.infraTeamsDetails"
  }

  if (
    pathname.startsWith("/service-desk-escalation-matrix/") &&
    pathname !== "/service-desk-escalation-matrix"
  ) {
    return "nav.serviceDeskEscalationMatrix"
  }

  return pageTitleKeys[pathname] ?? "app.fallbackTitle"
}

function DefaultLayoutShell() {
  const { t } = useTranslation()
  const { isExpanded } = useSidebar()
  const { pathname } = useLocation()
  const { settings } = useSettings()
  const title = t(resolveTitleKey(pathname))
  const isOnline = useOnlineStatus()
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    document.title = `${title} · ${settings.company_name}`
  }, [title, settings.company_name])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const isSearchShortcut =
        (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k"

      if (isSearchShortcut) {
        event.preventDefault()
        setSearchOpen((current) => !current)
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <div className="min-h-screen bg-body">
      <AppSidebar />
      <div
        className={cn(
          "min-h-screen transition-[margin] duration-300",
          isExpanded ? "lg:ms-72" : "lg:ms-[5.25rem]"
        )}
      >
        <AppHeader title={title} onOpenSearch={() => setSearchOpen(true)} />
        {!isOnline ? <OfflineBanner /> : null}
        <main className="px-4 py-6 md:px-6">
          <ErrorBoundary fallbackTitle={t("errors.pageCrashed")}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
      <GlobalSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
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
