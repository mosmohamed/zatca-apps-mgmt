import { LogOut, Menu, PanelLeftClose, PanelLeftOpen, Search } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { AppLogo } from "@/components/AppLogo"
import { LanguageSwitcher } from "@/components/LanguageSwitcher"
import { ThemeToggle } from "@/components/ThemeToggle"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useSettings } from "@/features/settings/hooks/use-settings"
import { useTheme } from "@/hooks/use-theme"
import { useSidebar } from "@/layouts/SidebarContext"

type AppHeaderProps = {
  title?: string
  onOpenSearch?: () => void
}

export function AppHeader({ title, onOpenSearch }: AppHeaderProps) {
  const { t, i18n } = useTranslation()
  const { isExpanded, toggleExpanded, toggleMobile } = useSidebar()
  const { user, logout } = useAuth()
  const { settings } = useSettings()
  const { theme } = useTheme()
  const navigate = useNavigate()

  async function handleLogout() {
    const federated = await logout()
    if (!federated) {
      navigate("/login", { replace: true })
    }
  }

  const logoVariant = theme === "dark" ? "onDark" : "default"
  const headerSubtitle = i18n.language.startsWith("ar")
    ? settings.header_subtitle_ar
    : settings.header_subtitle_en

  return (
    <header className="sticky top-0 z-30 relative flex h-16 items-center justify-between gap-2 border-b border-stroke bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:gap-3 md:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 lg:hidden"
          onClick={toggleMobile}
          aria-label={t("common.openSidebar")}
        >
          <Menu />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="hidden shrink-0 lg:inline-flex"
          onClick={toggleExpanded}
          aria-label={
            isExpanded
              ? t("common.collapseSidebar")
              : t("common.expandSidebar")
          }
        >
          {isExpanded ? <PanelLeftClose /> : <PanelLeftOpen />}
        </Button>
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold md:text-lg">
            {title ?? t("nav.dashboard")}
          </h1>
          <p className="hidden truncate text-xs text-muted-foreground sm:block">
            {headerSubtitle}
          </p>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 hidden justify-center lg:flex">
        <AppLogo
          className="pointer-events-auto justify-center"
          imgClassName="h-8 max-w-[8.5rem] shrink-0 sm:h-9 sm:max-w-[10rem]"
          variant={logoVariant}
        />
      </div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
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
          <button
            type="button"
            className="mt-1 text-xs text-muted-foreground underline-offset-2 hover:underline"
            onClick={() => navigate("/account/security")}
          >
            {t("account.securityTitle")}
          </button>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
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
