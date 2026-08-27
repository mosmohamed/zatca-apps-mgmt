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
  LayoutGrid,
  LifeBuoy,
  Link2,
  Layers,
  MonitorSmartphone,
  ServerCog,
  Settings,
  Shield,
  ShieldCheck,
  Truck,
  UsersRound,
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

const applicationsOpsNavItems: NavItem[] = [
  {
    to: "/applications",
    key: "applications",
    icon: MonitorSmartphone,
    permission: "applications.view",
  },
  {
    to: "/applications-details",
    key: "applicationsDetails",
    icon: AppWindow,
    permission: "applications-details.view",
  },
  {
    to: "/assignments",
    key: "assignments",
    icon: Link2,
    permission: "assignments.view",
  },
  {
    to: "/licenses",
    key: "appsLicenses",
    icon: KeyRound,
    permission: "licenses.view",
  },
]

const operationInfraNavItems: NavItem[] = [
  {
    to: "/infra-categories",
    key: "infraCategories",
    icon: Layers,
    permission: "infra-categories.view",
  },
  {
    to: "/infra-team-assignments",
    key: "infraTeamAssignments",
    icon: UsersRound,
    permission: "infra-team-assignments.view",
  },
  {
    to: "/infra-teams-details",
    key: "infraTeamsDetails",
    icon: LayoutGrid,
    permission: "infra-team-assignments.view",
  },
  {
    to: "/infra-licenses",
    key: "infraLicenses",
    icon: KeyRound,
    permission: "infra-licenses.view",
  },
]

const serviceDeskNavItems: NavItem[] = [
  {
    to: "/service-desk-categories",
    key: "serviceDeskCategories",
    icon: Layers,
    permission: "service-desk-categories.view",
  },
  {
    to: "/service-desk-team-assignments",
    key: "serviceDeskTeamAssignments",
    icon: UsersRound,
    permission: "service-desk-team-assignments.view",
  },
  {
    to: "/service-desk-escalation-matrix",
    key: "serviceDeskEscalationMatrix",
    icon: LayoutGrid,
    permission: "service-desk-team-assignments.view",
  },
  {
    to: "/service-desk-licenses",
    key: "sdLicenses",
    icon: KeyRound,
    permission: "service-desk-licenses.view",
  },
]

const secondaryNavItems: NavItem[] = [
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

function SectionHeader({
  label,
  icon: Icon,
  open,
  onToggle,
}: {
  label: string
  icon: typeof LayoutDashboard
  open: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground"
    >
      <span className="flex items-center gap-3">
        <Icon className="size-4 shrink-0" />
        {label}
      </span>
      <ChevronDown
        className={cn("size-4 transition-transform", open ? "rotate-180" : "")}
      />
    </button>
  )
}

function SidebarNavItem({
  item,
  isExpanded,
  indent,
  onNavigate,
}: {
  item: NavItem
  isExpanded: boolean
  indent: boolean
  onNavigate: () => void
}) {
  const { t } = useTranslation()
  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          indent && isExpanded ? "ms-2" : "",
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
}

export function AppSidebar() {
  const { t } = useTranslation()
  const { can } = useAuth()
  const { isExpanded, isMobileOpen, closeMobile } = useSidebar()
  const [masterDataOpen, setMasterDataOpen] = useState(true)
  const [applicationsOpsOpen, setApplicationsOpsOpen] = useState(true)
  const [operationInfraOpen, setOperationInfraOpen] = useState(true)
  const [serviceDeskOpen, setServiceDeskOpen] = useState(true)

  const visibleMasterDataNavItems = masterDataNavItems.filter(
    (item) => !item.permission || can(item.permission)
  )
  const visibleApplicationsOpsNavItems = applicationsOpsNavItems.filter(
    (item) => !item.permission || can(item.permission)
  )
  const visibleOperationInfraNavItems = operationInfraNavItems.filter(
    (item) => !item.permission || can(item.permission)
  )
  const visibleServiceDeskNavItems = serviceDeskNavItems.filter(
    (item) => !item.permission || can(item.permission)
  )
  const visibleSecondaryNavItems = secondaryNavItems.filter(
    (item) => !item.permission || can(item.permission)
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
          {primaryNavItems.map((item) => (
            <SidebarNavItem
              key={item.to}
              item={item}
              isExpanded={isExpanded}
              indent={false}
              onNavigate={closeMobile}
            />
          ))}

          {visibleMasterDataNavItems.length > 0 && isExpanded ? (
            <SectionHeader
              label={t("nav.masterData")}
              icon={Database}
              open={masterDataOpen}
              onToggle={() => setMasterDataOpen((current) => !current)}
            />
          ) : null}

          {visibleMasterDataNavItems.length > 0 &&
          (isExpanded ? masterDataOpen : true)
            ? visibleMasterDataNavItems.map((item) => (
                <SidebarNavItem
                  key={item.to}
                  item={item}
                  isExpanded={isExpanded}
                  indent
                  onNavigate={closeMobile}
                />
              ))
            : null}

          {visibleApplicationsOpsNavItems.length > 0 && isExpanded ? (
            <SectionHeader
              label={t("nav.applicationsOps")}
              icon={AppWindow}
              open={applicationsOpsOpen}
              onToggle={() => setApplicationsOpsOpen((current) => !current)}
            />
          ) : null}

          {visibleApplicationsOpsNavItems.length > 0 &&
          (isExpanded ? applicationsOpsOpen : true)
            ? visibleApplicationsOpsNavItems.map((item) => (
                <SidebarNavItem
                  key={item.to}
                  item={item}
                  isExpanded={isExpanded}
                  indent
                  onNavigate={closeMobile}
                />
              ))
            : null}

          {visibleOperationInfraNavItems.length > 0 && isExpanded ? (
            <SectionHeader
              label={t("nav.operationInfra")}
              icon={ServerCog}
              open={operationInfraOpen}
              onToggle={() => setOperationInfraOpen((current) => !current)}
            />
          ) : null}

          {visibleOperationInfraNavItems.length > 0 &&
          (isExpanded ? operationInfraOpen : true)
            ? visibleOperationInfraNavItems.map((item) => (
                <SidebarNavItem
                  key={item.to}
                  item={item}
                  isExpanded={isExpanded}
                  indent
                  onNavigate={closeMobile}
                />
              ))
            : null}

          {visibleServiceDeskNavItems.length > 0 && isExpanded ? (
            <SectionHeader
              label={t("nav.serviceDesk")}
              icon={LifeBuoy}
              open={serviceDeskOpen}
              onToggle={() => setServiceDeskOpen((current) => !current)}
            />
          ) : null}

          {visibleServiceDeskNavItems.length > 0 &&
          (isExpanded ? serviceDeskOpen : true)
            ? visibleServiceDeskNavItems.map((item) => (
                <SidebarNavItem
                  key={item.to}
                  item={item}
                  isExpanded={isExpanded}
                  indent
                  onNavigate={closeMobile}
                />
              ))
            : null}

          {visibleSecondaryNavItems.length > 0 ? (
            <div className="mt-2 space-y-1 border-t border-sidebar-border pt-2">
              {visibleSecondaryNavItems.map((item) => (
                <SidebarNavItem
                  key={item.to}
                  item={item}
                  isExpanded={isExpanded}
                  indent={false}
                  onNavigate={closeMobile}
                />
              ))}
            </div>
          ) : null}
        </nav>
      </aside>
    </>
  )
}
