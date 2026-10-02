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
  Network,
  Package,
  Building,
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
  {
    to: "/technologies",
    key: "technologies",
    icon: Package,
    permission: "technologies.view",
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
    to: "/infra-employees",
    key: "infraEmployees",
    icon: Users,
    permission: "infra-employees.view",
  },
  {
    to: "/infra-vendors",
    key: "infraVendors",
    icon: Truck,
    permission: "infra-vendors.view",
  },
  {
    to: "/infra-teams-details",
    key: "infraTeamsDetails",
    icon: LayoutGrid,
    permission: "infra-escalation-matrix.view",
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
    to: "/service-desk-employees",
    key: "serviceDeskEmployees",
    icon: Users,
    permission: "service-desk-employees.view",
  },
  {
    to: "/service-desk-vendors",
    key: "serviceDeskVendors",
    icon: Truck,
    permission: "service-desk-vendors.view",
  },
  {
    to: "/service-desk-escalation-matrix",
    key: "serviceDeskEscalationMatrix",
    icon: LayoutGrid,
    permission: "service-desk-escalation-matrix.view",
  },
  {
    to: "/service-desk-licenses",
    key: "sdLicenses",
    icon: KeyRound,
    permission: "service-desk-licenses.view",
  },
]

const networkOpsNavItems: NavItem[] = [
  {
    to: "/network-ops-categories",
    key: "networkOpsCategories",
    icon: Layers,
    permission: "network-ops-categories.view",
  },
  {
    to: "/network-ops-employees",
    key: "networkOpsEmployees",
    icon: Users,
    permission: "network-ops-employees.view",
  },
  {
    to: "/network-ops-vendors",
    key: "networkOpsVendors",
    icon: Truck,
    permission: "network-ops-vendors.view",
  },
  {
    to: "/network-ops-escalation-matrix",
    key: "networkOpsEscalationMatrix",
    icon: LayoutGrid,
    permission: "network-ops-escalation-matrix.view",
  },
  {
    to: "/network-ops-licenses",
    key: "networkOpsLicenses",
    icon: KeyRound,
    permission: "network-ops-licenses.view",
  },
]

const releaseManagementNavItems: NavItem[] = [
  {
    to: "/release-management-categories",
    key: "releaseManagementCategories",
    icon: Layers,
    permission: "release-management-categories.view",
  },
  {
    to: "/release-management-employees",
    key: "releaseManagementEmployees",
    icon: Users,
    permission: "release-management-employees.view",
  },
  {
    to: "/release-management-vendors",
    key: "releaseManagementVendors",
    icon: Truck,
    permission: "release-management-vendors.view",
  },
  {
    to: "/release-management-escalation-matrix",
    key: "releaseManagementEscalationMatrix",
    icon: LayoutGrid,
    permission: "release-management-escalation-matrix.view",
  },
]

const smartFacilitiesNavItems: NavItem[] = [
  {
    to: "/smart-facilities-categories",
    key: "smartFacilitiesCategories",
    icon: Layers,
    permission: "smart-facilities-categories.view",
  },
  {
    to: "/smart-facilities-employees",
    key: "smartFacilitiesEmployees",
    icon: Users,
    permission: "smart-facilities-employees.view",
  },
  {
    to: "/smart-facilities-vendors",
    key: "smartFacilitiesVendors",
    icon: Truck,
    permission: "smart-facilities-vendors.view",
  },
  {
    to: "/smart-facilities-escalation-matrix",
    key: "smartFacilitiesEscalationMatrix",
    icon: LayoutGrid,
    permission: "smart-facilities-escalation-matrix.view",
  },
  {
    to: "/smart-facilities-licenses",
    key: "smartFacilitiesLicenses",
    icon: KeyRound,
    permission: "smart-facilities-licenses.view",
  },
]

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
    icon: ShieldCheck,
    permission: "criticalities.view",
  },
  {
    to: "/application-statuses",
    key: "applicationStatuses",
    icon: Cpu,
    permission: "application-statuses.view",
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

function NavSection({
  label,
  icon,
  items,
  open,
  onToggle,
  isExpanded,
  onNavigate,
}: {
  label: string
  icon: typeof LayoutDashboard
  items: NavItem[]
  open: boolean
  onToggle: () => void
  isExpanded: boolean
  onNavigate: () => void
}) {
  if (items.length === 0) {
    return null
  }

  return (
    <>
      {isExpanded ? (
        <SectionHeader label={label} icon={icon} open={open} onToggle={onToggle} />
      ) : null}
      {(isExpanded ? open : true)
        ? items.map((item) => (
            <SidebarNavItem
              key={item.to}
              item={item}
              isExpanded={isExpanded}
              indent
              onNavigate={onNavigate}
            />
          ))
        : null}
    </>
  )
}

export function AppSidebar() {
  const { t } = useTranslation()
  const { can } = useAuth()
  const { isExpanded, isMobileOpen, closeMobile } = useSidebar()
  const [applicationsOpsOpen, setApplicationsOpsOpen] = useState(false)
  const [operationInfraOpen, setOperationInfraOpen] = useState(false)
  const [serviceDeskOpen, setServiceDeskOpen] = useState(false)
  const [networkOpsOpen, setNetworkOpsOpen] = useState(false)
  const [releaseManagementOpen, setReleaseManagementOpen] = useState(false)
  const [smartFacilitiesOpen, setSmartFacilitiesOpen] = useState(false)
  const [masterDataOpen, setMasterDataOpen] = useState(false)

  const filterItems = (items: NavItem[]) =>
    items.filter((item) => !item.permission || can(item.permission))

  const visibleApplicationsOpsNavItems = filterItems(applicationsOpsNavItems)
  const visibleOperationInfraNavItems = filterItems(operationInfraNavItems)
  const visibleServiceDeskNavItems = filterItems(serviceDeskNavItems)
  const visibleNetworkOpsNavItems = filterItems(networkOpsNavItems)
  const visibleReleaseManagementNavItems = filterItems(releaseManagementNavItems)
  const visibleSmartFacilitiesNavItems = filterItems(smartFacilitiesNavItems)
  const visibleMasterDataNavItems = filterItems(masterDataNavItems)
  const visibleSecondaryNavItems = filterItems(secondaryNavItems)

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

          <NavSection
            label={t("nav.applicationsOps")}
            icon={AppWindow}
            items={visibleApplicationsOpsNavItems}
            open={applicationsOpsOpen}
            onToggle={() => setApplicationsOpsOpen((current) => !current)}
            isExpanded={isExpanded}
            onNavigate={closeMobile}
          />
          <NavSection
            label={t("nav.operationInfra")}
            icon={ServerCog}
            items={visibleOperationInfraNavItems}
            open={operationInfraOpen}
            onToggle={() => setOperationInfraOpen((current) => !current)}
            isExpanded={isExpanded}
            onNavigate={closeMobile}
          />
          <NavSection
            label={t("nav.serviceDesk")}
            icon={LifeBuoy}
            items={visibleServiceDeskNavItems}
            open={serviceDeskOpen}
            onToggle={() => setServiceDeskOpen((current) => !current)}
            isExpanded={isExpanded}
            onNavigate={closeMobile}
          />
          <NavSection
            label={t("nav.networkOps")}
            icon={Network}
            items={visibleNetworkOpsNavItems}
            open={networkOpsOpen}
            onToggle={() => setNetworkOpsOpen((current) => !current)}
            isExpanded={isExpanded}
            onNavigate={closeMobile}
          />
          <NavSection
            label={t("nav.releaseManagement")}
            icon={Package}
            items={visibleReleaseManagementNavItems}
            open={releaseManagementOpen}
            onToggle={() => setReleaseManagementOpen((current) => !current)}
            isExpanded={isExpanded}
            onNavigate={closeMobile}
          />
          <NavSection
            label={t("nav.smartFacilities")}
            icon={Building}
            items={visibleSmartFacilitiesNavItems}
            open={smartFacilitiesOpen}
            onToggle={() => setSmartFacilitiesOpen((current) => !current)}
            isExpanded={isExpanded}
            onNavigate={closeMobile}
          />

          {visibleMasterDataNavItems.length > 0 ||
          visibleSecondaryNavItems.length > 0 ? (
            <div className="mt-2 space-y-1 border-t border-sidebar-border pt-2">
              <NavSection
                label={t("nav.masterData")}
                icon={Database}
                items={visibleMasterDataNavItems}
                open={masterDataOpen}
                onToggle={() => setMasterDataOpen((current) => !current)}
                isExpanded={isExpanded}
                onNavigate={closeMobile}
              />
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
