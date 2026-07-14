import { useEffect, useState } from "react"
import { Outlet, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { ErrorBoundary } from "@/components/ErrorBoundary"
import { OfflineBanner } from "@/components/error-pages"
import { GlobalSearchDialog } from "@/features/search/components/GlobalSearchDialog"
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
  "/roles": "nav.roles",
  "/activity-log": "nav.activityLog",
  "/settings": "nav.settings",
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
  const isOnline = useOnlineStatus()
  const [searchOpen, setSearchOpen] = useState(false)

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
