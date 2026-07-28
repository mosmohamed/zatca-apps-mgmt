import { LogOut, Menu, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { ThemeToggle } from "@/components/ThemeToggle"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useSettings } from "@/features/settings/hooks/use-settings"
import { useSidebar } from "@/layouts/SidebarContext"

type AppHeaderProps = {
  title?: string
  onOpenSearch?: () => void
}

/**
 * Shared app chrome header (logo lives in the sidebar).
 */
export function AppHeader({ title, onOpenSearch }: AppHeaderProps) {
  const { t, i18n } = useTranslation()
  const { isExpanded, toggleExpanded, toggleMobile } = useSidebar()
  const { user, logout, isSuperAdmin } = useAuth()
  const { settings } = useSettings()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate("/login", { replace: true })
  }

  const headerSubtitle = i18n.language.startsWith("ar")
    ? settings.header_subtitle_ar
    : settings.header_subtitle_en

  return (
    <header className="sticky top-0 z-30 grid h-16 max-w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 overflow-hidden border-b border-stroke bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:gap-x-3 sm:px-4 md:px-6 lg:gap-x-4">
      <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="size-9 shrink-0 lg:hidden"
          onClick={toggleMobile}
          aria-label={t("common.openSidebar")}
        >
          <Menu />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="hidden size-9 shrink-0 lg:inline-flex"
          onClick={toggleExpanded}
          aria-label={
            isExpanded
              ? t("common.collapseSidebar")
              : t("common.expandSidebar")
          }
        >
          {isExpanded ? <PanelLeftClose /> : <PanelLeftOpen />}
        </Button>
        <div className="min-w-0 flex-1 overflow-hidden">
          <h1 className="truncate text-sm font-semibold leading-tight sm:text-base md:text-lg">
            {title ?? t("nav.dashboard")}
          </h1>
          <p className="mt-0.5 hidden truncate text-xs leading-tight text-muted-foreground md:block">
            {headerSubtitle}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-1 sm:gap-1.5 md:gap-2 lg:gap-3">
        {onOpenSearch ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="hidden max-w-[14rem] items-center gap-2 truncate text-muted-foreground lg:inline-flex"
              onClick={onOpenSearch}
              aria-label={t("search.open")}
            >
              <Search className="size-4 shrink-0" />
              <span className="truncate">{t("search.placeholder")}</span>
              <kbd className="ms-1 hidden rounded border border-stroke bg-muted px-1.5 py-0.5 text-[0.65rem] font-medium xl:inline">
                Ctrl K
              </kbd>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-9 lg:hidden"
              onClick={onOpenSearch}
              aria-label={t("search.open")}
            >
              <Search />
            </Button>
          </>
        ) : null}
        <ThemeToggle />
        <LanguageSwitcher className="shrink-0" />
        <div className="hidden min-w-0 max-w-[10rem] text-end lg:block">
          <p className="truncate text-sm font-medium leading-none">
            {user?.full_name ?? t("common.user")}
          </p>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            {isSuperAdmin ? t("common.superAdmin") : t("common.employee")}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="size-9 shrink-0 px-0 sm:h-8 sm:w-auto sm:px-2.5"
          onClick={() => void handleLogout()}
          aria-label={t("common.signOut")}
        >
          <LogOut className="size-4" />
          <span className="hidden sm:inline">{t("common.signOut")}</span>
        </Button>
      </div>
    </header>
  )
}
