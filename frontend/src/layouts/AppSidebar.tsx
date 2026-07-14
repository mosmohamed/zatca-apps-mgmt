import { useState } from "react"
import { NavLink } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  AppWindow,
  Briefcase,
  Building2,
  ChevronDown,
  Cpu,
  Database,
  LayoutDashboard,
  Link2,
  MonitorSmartphone,
  Shield,
  Truck,
  Users,
} from "lucide-react"

import { AppLogo } from "@/components/AppLogo"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/layouts/SidebarContext"

const primaryNavItems = [
  { to: "/", key: "dashboard" as const, icon: LayoutDashboard, end: true },
  {
    to: "/applications-details",
    key: "applicationsDetails" as const,
    icon: AppWindow,
  },
  { to: "/assignments", key: "assignments" as const, icon: Link2 },
]

const masterDataNavItems = [
  { to: "/departments", key: "departments" as const, icon: Building2 },
  { to: "/vendors", key: "vendors" as const, icon: Truck },
  { to: "/applications", key: "applications" as const, icon: MonitorSmartphone },
  { to: "/users", key: "users" as const, icon: Users },
  { to: "/job-titles", key: "jobTitles" as const, icon: Briefcase },
  { to: "/app-roles", key: "appRoles" as const, icon: Shield },
  { to: "/support-types", key: "supportTypes" as const, icon: Database },
  { to: "/criticalities", key: "criticalities" as const, icon: Database },
  {
    to: "/application-statuses",
    key: "applicationStatuses" as const,
    icon: Database,
  },
  { to: "/technologies", key: "technologies" as const, icon: Cpu },
]

export function AppSidebar() {
  const { t } = useTranslation()
  const { isExpanded, isMobileOpen, closeMobile } = useSidebar()
  const [masterDataOpen, setMasterDataOpen] = useState(true)

  return (
    <>
      {isMobileOpen ? (
        <button
          type="button"
          aria-label={t("common.closeSidebarOverlay")}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={closeMobile}
        />
      ) : null}

      <aside
        className={cn(
          "fixed inset-y-0 start-0 z-50 flex h-screen flex-col bg-sidebar text-sidebar-foreground transition-all duration-300",
          isExpanded ? "w-72" : "w-[5.25rem]",
          isMobileOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0 rtl:translate-x-full lg:rtl:translate-x-0"
        )}
      >
        <div className="flex h-16 items-center border-b border-sidebar-border px-4">
          {isExpanded ? (
            <AppLogo
              className="w-full"
              imgClassName="h-8 max-w-[7.5rem] shrink-0"
              showWordmark
              variant="onDark"
            />
          ) : (
            <AppLogo
              className="mx-auto justify-center"
              imgClassName="h-8 w-10 object-left object-contain"
              variant="onDark"
            />
          )}
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {primaryNavItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={closeMobile}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
                  )
                }
              >
                <Icon className="size-4 shrink-0" />
                {isExpanded ? <span>{t(`nav.${item.key}`)}</span> : null}
              </NavLink>
            )
          })}

          {isExpanded ? (
            <button
              type="button"
              onClick={() => setMasterDataOpen((current) => !current)}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
            >
              <span className="flex items-center gap-3">
                <Database className="size-4 shrink-0" />
                {t("nav.masterData")}
              </span>
              <ChevronDown
                className={cn(
                  "size-4 transition-transform",
                  masterDataOpen ? "rotate-180" : ""
                )}
              />
            </button>
          ) : null}

          {(isExpanded ? masterDataOpen : true)
            ? masterDataNavItems.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={closeMobile}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                        isExpanded ? "ms-2" : "",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
                      )
                    }
                  >
                    <Icon className="size-4 shrink-0" />
                    {isExpanded ? <span>{t(`nav.${item.key}`)}</span> : null}
                  </NavLink>
                )
              })
            : null}
        </nav>
      </aside>
    </>
  )
}
