import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Home, RefreshCw, ShieldAlert, TriangleAlert, WifiOff } from "lucide-react"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { useOnlineStatus } from "@/hooks/use-online-status"

type ErrorPageProps = {
  code: "403" | "404" | "500"
  title: string
  description: string
  icon: ReactNode
  actionLabel?: string
  actionTo?: string
}

function ErrorPageShell({
  code,
  title,
  description,
  icon,
  actionLabel,
  actionTo = "/",
}: ErrorPageProps) {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        {icon}
      </div>
      <p className="text-sm font-semibold tracking-wide text-brand">{code}</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      <Button asChild className="mt-6">
        <Link to={actionTo}>
          {actionLabel ?? t("common.backToDashboard")}
        </Link>
      </Button>
    </div>
  )
}

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <ErrorPageShell
      code="404"
      title={t("errors.notFoundTitle")}
      description={t("errors.notFoundDescription")}
      icon={<Home className="size-7" />}
    />
  )
}

export function ForbiddenPage() {
  const { t } = useTranslation()

  return (
    <ErrorPageShell
      code="403"
      title={t("errors.forbiddenTitle")}
      description={t("errors.forbiddenDescription")}
      icon={<ShieldAlert className="size-7" />}
    />
  )
}

export function ServerErrorPage() {
  const { t } = useTranslation()

  return (
    <ErrorPageShell
      code="500"
      title={t("errors.serverTitle")}
      description={t("errors.serverDescription")}
      icon={<TriangleAlert className="size-7" />}
      actionLabel={t("common.reloadDashboard")}
    />
  )
}

export function OfflinePage() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <WifiOff className="size-7" />
      </div>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        {t("errors.offlineTitle")}
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {t("errors.offlineDescription")}
      </p>
      <Button
        type="button"
        className="mt-6"
        onClick={() => window.location.reload()}
      >
        <RefreshCw />
        {t("errors.retryConnection")}
      </Button>
    </div>
  )
}

export function NoInternetPage() {
  return <OfflinePage />
}

export function OfflineBanner() {
  const { t } = useTranslation()
  const isOnline = useOnlineStatus()

  if (isOnline) {
    return null
  }

  return (
    <div
      role="status"
      className="flex items-center justify-center gap-2 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive"
    >
      <WifiOff className="size-4" />
      {t("errors.offlineBanner")}
    </div>
  )
}
