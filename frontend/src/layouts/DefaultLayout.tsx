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
  "/vendors": "nav.vendors",
  "/users": "nav.users",
  "/assignments": "nav.assignments",
  "/departments": "nav.departments",
  "/403": "nav.forbidden",
  "/404": "nav.notFound",
  "/500": "nav.serverError",
}

function DefaultLayoutShell() {
  const { t } = useTranslation()
  const { isExpanded } = useSidebar()
  const { pathname } = useLocation()
  const titleKey = pageTitleKeys[pathname]
  const title = titleKey ? t(titleKey) : t("app.fallbackTitle")

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
