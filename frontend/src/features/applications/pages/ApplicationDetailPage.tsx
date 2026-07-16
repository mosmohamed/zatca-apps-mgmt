import { Link, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  ArrowLeft,
  Building2,
  ExternalLink,
  Layers3,
  Link2,
  Shield,
  Truck,
  Users,
} from "lucide-react"

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useApplication } from "@/features/applications/hooks/use-applications"
import { useApplicationAssignmentDetails } from "@/features/assignments/hooks/use-assignments"
import { cn } from "@/lib/utils"
import { formatDateTime } from "@/utils/format"

const METRIC_STYLES = [
  {
    iconWrap: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
    panel: "from-sky-500/10 to-transparent",
  },
  {
    iconWrap: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    panel: "from-amber-500/10 to-transparent",
  },
  {
    iconWrap: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    panel: "from-emerald-500/10 to-transparent",
  },
  {
    iconWrap: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
    panel: "from-violet-500/10 to-transparent",
  },
] as const

export function ApplicationDetailPage() {
  const { t, i18n } = useTranslation()
  const params = useParams()
  const applicationId = Number(params.id)
  const isArabic = i18n.language.startsWith("ar")

  const applicationQuery = useApplication(applicationId)
  const matrixQuery = useApplicationAssignmentDetails(
    Number.isFinite(applicationId) ? applicationId : null
  )

  if (!Number.isFinite(applicationId) || applicationId <= 0) {
    return (
      <EmptyState
        title={t("applicationsDetails.invalidId")}
        description={t("applicationsDetails.invalidIdDescription")}
      />
    )
  }

  if (applicationQuery.isLoading || matrixQuery.isLoading) {
    return <LoadingSkeleton rows={8} />
  }

  const application = applicationQuery.data
  const matrix = matrixQuery.data

  if (!application) {
    return (
      <EmptyState
        title={t("applicationsDetails.notFoundTitle")}
        description={t("applicationsDetails.notFoundDescription")}
      />
    )
  }

  const displayName = isArabic ? application.name_ar : application.name_en
  const departmentName = application.department
    ? isArabic
      ? application.department.name_ar
      : application.department.name_en
    : "—"
  const statusName = application.status
    ? isArabic
      ? application.status.name_ar
      : application.status.name_en
    : "—"
  const criticalityName = application.criticality
    ? isArabic
      ? application.criticality.name_ar
      : application.criticality.name_en
    : "—"
  const supportTypeName = application.support_type
    ? isArabic
      ? application.support_type.name_ar
      : application.support_type.name_en
    : "—"
  const typeName = application.application_type
    ? isArabic
      ? application.application_type.name_ar
      : application.application_type.name_en
    : "—"

  const assignments = (matrix?.assignments ?? []).filter(
    (assignment) => assignment.ended_at === null
  )
  const vendorCount = new Set(
    assignments
      .map((assignment) => assignment.user?.vendor?.id)
      .filter((id): id is number => typeof id === "number")
  ).size

  return (
    <section className="space-y-5 animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
      <div className="relative overflow-hidden rounded-2xl border border-stroke/80 bg-gradient-to-br from-sky-50 via-card to-violet-50/70 p-5 shadow-sm dark:from-sky-950/35 dark:via-card dark:to-violet-950/25 sm:p-6">
        <div className="pointer-events-none absolute inset-y-0 start-0 w-1 bg-gradient-to-b from-sky-500 via-teal-500 to-violet-500" />
        <div className="pointer-events-none absolute -end-8 -top-8 size-36 rounded-full bg-sky-400/20 blur-2xl" />

        <Button asChild variant="ghost" size="sm" className="-ms-2 mb-3 w-fit">
          <Link to="/applications-details">
            <ArrowLeft className="rtl:rotate-180" />
            {t("applicationsDetails.backToList")}
          </Link>
        </Button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-semibold tracking-tight">
                {displayName}
              </h2>
              <Badge className="rounded-full">{statusName}</Badge>
              <Badge variant="outline" className="rounded-full">
                {criticalityName}
              </Badge>
            </div>
            <p className="mt-1.5 font-mono text-sm text-muted-foreground">
              {application.code}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {typeName} · {departmentName}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {application.documentation_url ? (
              <Button asChild variant="outline" size="sm">
                <a
                  href={application.documentation_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLink />
                  {t("applicationsDetails.documentation")}
                </a>
              </Button>
            ) : null}
            {application.repository_url ? (
              <Button asChild variant="outline" size="sm">
                <a
                  href={application.repository_url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Link2 />
                  {t("applicationsDetails.repository")}
                </a>
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Users}
          label={t("applicationsDetails.metrics.activeUsers")}
          value={String(assignments.length)}
          styleIndex={0}
        />
        <MetricCard
          icon={Truck}
          label={t("applicationsDetails.metrics.activeVendors")}
          value={String(vendorCount)}
          styleIndex={1}
        />
        <MetricCard
          icon={Building2}
          label={t("applicationsDetails.metrics.department")}
          value={departmentName}
          styleIndex={2}
        />
        <MetricCard
          icon={Layers3}
          label={t("applicationsDetails.metrics.technologies")}
          value={String(application.technologies?.length ?? 0)}
          styleIndex={3}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="overflow-hidden border-stroke/80 shadow-sm xl:col-span-2">
          <CardHeader className="border-b border-stroke/60 bg-muted/20">
            <CardTitle>{t("applicationsDetails.overviewTitle")}</CardTitle>
            <CardDescription>
              {t("applicationsDetails.overviewDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            <dl className="grid gap-3 sm:grid-cols-2">
              <DetailItem
                label={t("applicationsDetails.fields.type")}
                value={typeName}
              />
              <DetailItem
                label={t("applicationsDetails.fields.supportType")}
                value={supportTypeName}
              />
              <DetailItem
                label={t("applicationsDetails.fields.haModel")}
                value={
                  application.ha_model
                    ? t(`applications.haModels.${application.ha_model}`, {
                        defaultValue: application.ha_model,
                      })
                    : "—"
                }
              />
              <DetailItem
                label={t("applicationsDetails.fields.businessOwner")}
                value={application.business_owner || "—"}
              />
              <DetailItem
                label={t("applicationsDetails.fields.technicalOwner")}
                value={application.technical_owner || "—"}
              />
              {application.documentation_url ? (
                <DetailItem
                  label={t("applicationsDetails.fields.documentationUrl")}
                  value={application.documentation_url}
                  href={application.documentation_url}
                />
              ) : null}
              {application.repository_url ? (
                <DetailItem
                  label={t("applicationsDetails.fields.repositoryUrl")}
                  value={application.repository_url}
                  href={application.repository_url}
                />
              ) : null}
              <DetailItem
                label={t("applicationsDetails.fields.updatedAt")}
                value={
                  application.updated_at
                    ? formatDateTime(application.updated_at)
                    : "—"
                }
              />
              <DetailItem
                label={t("applicationsDetails.fields.createdAt")}
                value={
                  application.created_at
                    ? formatDateTime(application.created_at)
                    : "—"
                }
              />
            </dl>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-stroke/80 shadow-sm">
          <CardHeader className="border-b border-stroke/60 bg-muted/20">
            <CardTitle>{t("applicationsDetails.techTitle")}</CardTitle>
            <CardDescription>
              {t("applicationsDetails.techDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-5">
            {(application.technologies?.length ?? 0) === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t("applicationsDetails.noTechnologies")}
              </p>
            ) : (
              <ul className="space-y-2">
                {application.technologies?.map((technology) => (
                  <li
                    key={technology.id}
                    className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/25 px-3 py-2.5 transition-colors hover:bg-muted/45"
                  >
                    <span className="text-sm font-medium">{technology.name}</span>
                    <Badge variant="outline" className="rounded-full">
                      {technology.category}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border-stroke/80 shadow-sm">
        <CardHeader className="border-b border-stroke/60 bg-muted/20">
          <CardTitle className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-violet-500/15 text-violet-700 dark:text-violet-300">
              <Shield className="size-4" />
            </span>
            {t("applicationsDetails.teamTitle")}
          </CardTitle>
          <CardDescription>
            {t("applicationsDetails.teamDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-5">
          {assignments.length === 0 ? (
            <EmptyState
              title={t("applicationsDetails.noTeamTitle")}
              description={t("applicationsDetails.noTeamDescription")}
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-stroke/80">
              <Table className="min-w-[720px] table-fixed">
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[28%] whitespace-nowrap">
                      {t("applicationsDetails.teamColumns.member")}
                    </TableHead>
                    <TableHead className="w-[18%] whitespace-nowrap">
                      {t("applicationsDetails.teamColumns.role")}
                    </TableHead>
                    <TableHead className="w-[20%] whitespace-nowrap">
                      {t("applicationsDetails.teamColumns.vendor")}
                    </TableHead>
                    <TableHead className="w-[14%] whitespace-nowrap">
                      {t("applicationsDetails.teamColumns.primary")}
                    </TableHead>
                    <TableHead className="w-[20%] whitespace-nowrap">
                      {t("applicationsDetails.teamColumns.assignedAt")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="align-middle">
                        <div className="min-w-0 space-y-0.5">
                          <p className="truncate font-medium leading-none">
                            {assignment.user?.full_name ?? "—"}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {assignment.user?.email ?? "—"}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="align-middle">
                        <Badge
                          variant="secondary"
                          className="max-w-full truncate rounded-full"
                        >
                          {assignment.app_role?.name ?? "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="align-middle truncate">
                        {assignment.user?.vendor?.name ??
                          t("applicationsDetails.internal")}
                      </TableCell>
                      <TableCell className="align-middle">
                        {assignment.is_primary ? (
                          <Badge className="rounded-full">
                            {t("common.yes")}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">
                            {t("common.no")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="align-middle whitespace-nowrap text-muted-foreground">
                        {assignment.assigned_at
                          ? formatDateTime(assignment.assigned_at)
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  styleIndex,
}: {
  icon: typeof Users
  label: string
  value: string
  styleIndex: number
}) {
  const styles = METRIC_STYLES[styleIndex % METRIC_STYLES.length]

  return (
    <div
      className={cn(
        "rounded-2xl border border-stroke/80 bg-gradient-to-br p-4 shadow-sm",
        "transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md",
        styles.panel
      )}
    >
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-lg",
            styles.iconWrap
          )}
        >
          <Icon className="size-4" />
        </span>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="mt-3 truncate text-xl font-semibold tracking-tight">
        {value}
      </p>
    </div>
  )
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
    <div className="rounded-xl border border-border/50 bg-muted/30 px-3.5 py-3 transition-colors hover:bg-muted/45">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1.5 text-sm font-medium break-words">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-primary underline-offset-4 hover:underline"
          >
            <span className="truncate">{value}</span>
            <ExternalLink className="size-3.5 shrink-0" />
          </a>
        ) : (
          value
        )}
      </dd>
    </div>
  )
}
