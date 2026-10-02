import { useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ArrowLeft, ExternalLink, Pencil } from "lucide-react"

import { EmptyState } from "@/components/EmptyState"
import { LoadingSkeleton } from "@/components/LoadingSkeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { LicenseFormDialog } from "@/features/licenses/components/LicenseFormDialog"
import {
  LICENSE_MODULES,
  licensePermission,
  type LicenseModuleId,
} from "@/features/licenses/config/license-modules"
import { useLicense } from "@/features/licenses/hooks/use-licenses"
import type { LicenseStatus } from "@/features/licenses/types/license"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { cn } from "@/lib/utils"
import { formatDate, formatDateTime } from "@/utils/format"

function isUrlLike(value: string): boolean {
  return /^https?:\/\//i.test(value.trim())
}

function statusBadgeClass(status: string): string {
  switch (status) {
    case "active":
      return "border-transparent bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    case "expiring_soon":
      return "border-transparent bg-amber-500/10 text-amber-700 dark:text-amber-300"
    case "expired":
      return "border-transparent bg-red-500/10 text-red-700 dark:text-red-300"
    default:
      return ""
  }
}

function DetailItem({
  label,
  value,
  href,
}: {
  label: string
  value: string
  href?: string
}) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium break-words">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline"
          >
            {value}
            <ExternalLink className="size-3.5 shrink-0" />
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  )
}

type LicenseDetailPageProps = {
  moduleId?: LicenseModuleId
}

export function LicenseDetailPage({
  moduleId = "apps",
}: LicenseDetailPageProps) {
  const { t } = useTranslation()
  const { can } = useAuth()
  const params = useParams()
  const licenseId = Number(params.id)
  const module = LICENSE_MODULES[moduleId]
  const canUpdate = can(licensePermission(module, "update"))
  const [editOpen, setEditOpen] = useState(false)

  const licenseQuery = useLicense(licenseId, moduleId)

  if (!Number.isFinite(licenseId) || licenseId <= 0) {
    return (
      <EmptyState
        title={t("licenses.detail.invalidId")}
        description={t("licenses.detail.invalidIdDescription")}
      />
    )
  }

  if (licenseQuery.isLoading) {
    return <LoadingSkeleton rows={8} />
  }

  const license = licenseQuery.data

  if (!license) {
    return (
      <EmptyState
        title={t("licenses.detail.notFoundTitle")}
        description={t("licenses.detail.notFoundDescription")}
      />
    )
  }

  const proof = license.proof_of_entitlement?.trim() || null
  const daysRemaining =
    license.days_remaining === null || license.days_remaining === undefined
      ? "—"
      : String(license.days_remaining)

  return (
    <section className="space-y-5 animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
      <div className="relative overflow-hidden rounded-2xl border border-stroke/80 bg-gradient-to-br from-sky-50 via-card to-teal-50/70 p-5 shadow-sm dark:from-sky-950/35 dark:via-card dark:to-teal-950/25 sm:p-6">
        <div className="pointer-events-none absolute inset-y-0 start-0 w-1 bg-gradient-to-b from-sky-500 via-teal-500 to-emerald-500" />

        <Button asChild variant="ghost" size="sm" className="-ms-2 mb-3 w-fit">
          <Link to={module.listPath}>
            <ArrowLeft className="rtl:rotate-180" />
            {t("licenses.detail.backToList")}
          </Link>
        </Button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-semibold tracking-tight">
                {license.name}
              </h2>
              <Badge className={cn(statusBadgeClass(license.status))}>
                {t(`licenses.status.${license.status as LicenseStatus}`, {
                  defaultValue: license.status,
                })}
              </Badge>
            </div>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {license.publisher} · {license.product}
            </p>
          </div>

          {canUpdate ? (
            <Button type="button" size="sm" onClick={() => setEditOpen(true)}>
              <Pencil />
              {t("common.edit")}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="overflow-hidden border-stroke/80 shadow-sm">
          <CardHeader className="border-b border-stroke/60 bg-muted/20">
            <CardTitle>{t("licenses.detail.generalTitle")}</CardTitle>
            <CardDescription>
              {t("licenses.detail.generalDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <dl className="grid gap-3 sm:grid-cols-2">
              <DetailItem
                label={t("licenses.columns.publisher")}
                value={license.publisher}
              />
              <DetailItem
                label={t("licenses.columns.name")}
                value={license.name}
              />
              <DetailItem
                label={t(module.productKey)}
                value={license.product}
              />
              <DetailItem
                label={t("licenses.columns.version")}
                value={license.version || "—"}
              />
              <DetailItem
                label={t("licenses.columns.environment")}
                value={license.environment || "—"}
              />
              <DetailItem
                label={t("licenses.detail.createdAt")}
                value={formatDateTime(license.created_at)}
              />
              <DetailItem
                label={t("licenses.detail.updatedAt")}
                value={formatDateTime(license.updated_at)}
              />
            </dl>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-stroke/80 shadow-sm">
          <CardHeader className="border-b border-stroke/60 bg-muted/20">
            <CardTitle>{t("licenses.detail.licenseInfoTitle")}</CardTitle>
            <CardDescription>
              {t("licenses.detail.licenseInfoDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <dl className="grid gap-3 sm:grid-cols-2">
              <DetailItem
                label={t(module.licensedKey)}
                value={String(license.licensed)}
              />
              <DetailItem
                label={t("licenses.columns.used")}
                value={String(license.used)}
              />
              <DetailItem
                label={t("licenses.columns.available")}
                value={String(license.available)}
              />
            </dl>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-stroke/80 shadow-sm">
          <CardHeader className="border-b border-stroke/60 bg-muted/20">
            <CardTitle>{t("licenses.detail.validityTitle")}</CardTitle>
            <CardDescription>
              {t("licenses.detail.validityDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <dl className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1 sm:col-span-2">
                <dt className="text-xs font-medium text-muted-foreground">
                  {t("licenses.columns.status")}
                </dt>
                <dd>
                  <Badge className={cn(statusBadgeClass(license.status))}>
                    {t(`licenses.status.${license.status as LicenseStatus}`, {
                      defaultValue: license.status,
                    })}
                  </Badge>
                </dd>
              </div>
              <DetailItem
                label={t("licenses.columns.startDate")}
                value={formatDate(license.start_date)}
              />
              <DetailItem
                label={t("licenses.columns.endDate")}
                value={formatDate(license.end_date)}
              />
              <DetailItem
                label={t("licenses.columns.daysRemaining")}
                value={daysRemaining}
              />
            </dl>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-stroke/80 shadow-sm">
          <CardHeader className="border-b border-stroke/60 bg-muted/20">
            <CardTitle>
              {t("licenses.detail.proofOfEntitlementTitle")}
            </CardTitle>
            <CardDescription>
              {t("licenses.detail.proofOfEntitlementDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            {proof ? (
              isUrlLike(proof) ? (
                <a
                  href={proof}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
                >
                  {proof}
                  <ExternalLink className="size-3.5 shrink-0" />
                </a>
              ) : (
                <p className="text-sm font-medium break-words">{proof}</p>
              )
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-stroke/80 shadow-sm">
        <CardHeader className="border-b border-stroke/60 bg-muted/20">
          <CardTitle>{t("licenses.detail.descriptionTitle")}</CardTitle>
          <CardDescription>
            {t("licenses.detail.descriptionSection")}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          <p className="whitespace-pre-wrap text-sm">
            {license.description?.trim()
              ? license.description
              : t("licenses.detail.noDescription")}
          </p>
        </CardContent>
      </Card>

      {canUpdate ? (
        <LicenseFormDialog
          open={editOpen}
          onOpenChange={setEditOpen}
          license={license}
          moduleId={moduleId}
        />
      ) : null}
    </section>
  )
}
