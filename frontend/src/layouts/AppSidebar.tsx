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
  History,
  KeyRound,
  LayoutDashboard,
  Link2,
  MonitorSmartphone,
  Settings,
  Shield,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react"

import { AppLogo } from "@/components/AppLogo"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { cn } from "@/lib/utils"
import { useSidebar } from "@/layouts/SidebarContext"

const primaryNavItems = [
  { to: "/", key: "dashboard" as const, icon: LayoutDashboard, end: true },
]

type NavItem = {
  to: string
  key: string
  icon: typeof LayoutDashboard
  end?: boolean
  permission?: string
}

const masterDataNavItems: NavItem[] = [
  {
    to: "/applications-details",
    key: "applicationsDetails",
    icon: AppWindow,
  },
  {
    to: "/assignments",
    key: "assignments",
    icon: Link2,
    permission: "assignments.view",
  },
  {
    to: "/departments",
    key: "departments",
    icon: Building2,
    permission: "departments.view",
  },
  {
    to: "/vendors",
    key: "vendors",
    icon: Truck,
    permission: "vendors.view",
  },
  {
    to: "/applications",
    key: "applications",
    icon: MonitorSmartphone,
  },
  {
    to: "/users",
    key: "users",
    icon: Users,
    permission: "users.view",
  },
  {
    to: "/job-titles",
    key: "jobTitles",
    icon: Briefcase,
    permission: "job-titles.view",
  },
  {
    to: "/app-roles",
    key: "appRoles",
    icon: Shield,
    permission: "app-roles.view",
  },
  {
    to: "/support-types",
    key: "supportTypes",
    icon: Database,
    permission: "support-types.view",
  },
  {
    to: "/criticalities",
    key: "criticalities",
    icon: Database,
    permission: "criticalities.view",
  },
  {
    to: "/application-statuses",
    key: "applicationStatuses",
    icon: Database,
    permission: "application-statuses.view",
  },
  {
    to: "/technologies",
    key: "technologies",
    icon: Cpu,
    permission: "technologies.view",
  },
  {
    to: "/roles",
    key: "roles",
    icon: ShieldCheck,
    permission: "roles.view",
  },
]

const secondaryNavItems: NavItem[] = [
  {
    to: "/licenses",
    key: "licenses",
    icon: KeyRound,
    permission: "licenses.view",
  },
  {
    to: "/activity-log",
    key: "activityLog",
    icon: History,
    permission: "activity-log.view",
  },
  {
    to: "/settings",
    key: "settings",
    icon: Settings,
    permission: "settings.view",
  },
]

export function AppSidebar() {
  const { t } = useTranslation()
  const { can } = useAuth()
  const { isExpanded, isMobileOpen, closeMobile } = useSidebar()
  const [masterDataOpen, setMasterDataOpen] = useState(true)

  const visibleMasterDataNavItems = masterDataNavItems.filter(
    (item) => !item.permission || can(item.permission)
  )
  const visibleSecondaryNavItems = secondaryNavItems.filter(
    (item) => !item.permission || can(item.permission)
  )

  // Licenses should sit below Master Data and above activity-log/settings.
  const licensesItem = visibleSecondaryNavItems.find(
    (item) => item.key === "licenses"
  )
  const trailingSecondaryNavItems = visibleSecondaryNavItems.filter(
    (item) => item.key !== "licenses"
  )

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
          "fixed inset-y-0 start-0 z-50 flex h-screen flex-col overflow-hidden bg-sidebar text-sidebar-foreground transition-all duration-300",
          isExpanded ? "w-72" : "w-[5.25rem]",
          isMobileOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0 rtl:translate-x-full lg:rtl:translate-x-0"
        )}
      >
        <div
          className={cn(
            "flex shrink-0 flex-col items-center justify-center border-b border-sidebar-border",
            isExpanded ? "gap-2 px-4 py-5" : "px-2 py-4"
          )}
        >
          <AppLogo
            variant="onDark"
            className="justify-center"
            imgClassName={cn(
              "shrink-0 object-contain",
              isExpanded
                ? "h-10 max-h-10 w-auto max-w-[13rem]"
                : "h-8 max-h-8 w-auto max-w-[2.75rem]"
            )}
          />
          {isExpanded ? (
            <p className="text-center text-sm font-semibold tracking-[0.18em] text-white">
              CENTRIX
            </p>
          ) : null}
        </div>

        <nav className="sidebar-nav-scroll min-h-0 flex-1 space-y-1 overflow-x-hidden overflow-y-auto px-3 py-4">
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

          {visibleMasterDataNavItems.length > 0 && isExpanded ? (
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

          {visibleMasterDataNavItems.length > 0 &&
          (isExpanded ? masterDataOpen : true)
            ? visibleMasterDataNavItems.map((item) => {
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

          {licensesItem ? (
            (() => {
              const Icon = licensesItem.icon
              return (
                <NavLink
                  to={licensesItem.to}
                  onClick={closeMobile}
                  className={({ isActive }) =>
                    cn(
                      "mt-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
                    )
                  }
                >
                  <Icon className="size-4 shrink-0" />
                  {isExpanded ? (
                    <span>{t(`nav.${licensesItem.key}`)}</span>
                  ) : null}
                </NavLink>
              )
            })()
          ) : null}

          {trailingSecondaryNavItems.length > 0 ? (
            <div className="mt-2 space-y-1 border-t border-sidebar-border pt-2">
              {trailingSecondaryNavItems.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
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
            </div>
          ) : null}
        </nav>
      </aside>
    </>
  )
}
