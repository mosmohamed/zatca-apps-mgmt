import { LogOut, Menu, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { ThemeToggle } from "@/components/ThemeToggle"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useSidebar } from "@/layouts/SidebarContext"

type AppHeaderProps = {
  title?: string
  onOpenSearch?: () => void
}

export function AppHeader({ title, onOpenSearch }: AppHeaderProps) {
  const { t } = useTranslation()
  const { isExpanded, toggleExpanded, toggleMobile } = useSidebar()
  const { user, logout, isSuperAdmin } = useAuth()
  const navigate = useNavigate()

  async function handleLogout() {
    await logout()
    navigate("/login", { replace: true })
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-stroke bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-6">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={toggleMobile}
          aria-label={t("common.openSidebar")}
        >
          <Menu />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:inline-flex"
          onClick={toggleExpanded}
          aria-label={
            isExpanded
              ? t("common.collapseSidebar")
              : t("common.expandSidebar")
          }
        >
          {isExpanded ? <PanelLeftClose /> : <PanelLeftOpen />}
        </Button>
        <div>
          <h1 className="text-base font-semibold md:text-lg">
            {title ?? t("nav.dashboard")}
          </h1>
          <p className="hidden text-xs text-muted-foreground sm:block">
            {t("app.subtitle")}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {onOpenSearch ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="hidden items-center gap-2 text-muted-foreground sm:inline-flex"
            onClick={onOpenSearch}
            aria-label={t("search.open")}
          >
            <Search />
            <span>{t("search.placeholder")}</span>
            <kbd className="ms-2 rounded border border-stroke bg-muted px-1.5 py-0.5 text-[0.65rem] font-medium">
              Ctrl K
            </kbd>
          </Button>
        ) : null}
        {onOpenSearch ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={onOpenSearch}
            aria-label={t("search.open")}
          >
            <Search />
          </Button>
        ) : null}
        <ThemeToggle />
        <LanguageSwitcher />
        <div className="hidden text-end sm:block">
          <p className="text-sm font-medium leading-none">
            {user?.full_name ?? t("common.user")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {isSuperAdmin ? t("common.superAdmin") : t("common.employee")}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void handleLogout()}
          aria-label={t("common.signOut")}
        >
          <LogOut />
          <span className="hidden sm:inline">{t("common.signOut")}</span>
        </Button>
      </div>
    </header>
  )
}
