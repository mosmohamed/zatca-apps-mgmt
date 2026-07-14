import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Eye, RotateCcw } from "lucide-react"

import {
  EnterpriseDataTable,
  type EnterpriseDataTableColumn,
} from "@/components/EnterpriseDataTable"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ActivityLogDetailsDialog } from "@/features/activity-log/components/ActivityLogDetailsDialog"
import { ActivityStatsCards } from "@/features/activity-log/components/ActivityStatsCards"
import { useActivityLog } from "@/features/activity-log/hooks/use-activity-log"
import type { ActivityLogEntry } from "@/features/activity-log/types/activity-log"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { formatDateTime } from "@/utils/format"

const SUBJECT_TYPES = [
  "Application",
  "Vendor",
  "User",
  "Technology",
  "Department",
  "Assignment",
] as const

export function ActivityLogPage() {
  const { t } = useTranslation()
  const [causer, setCauser] = useState("")
  const [subjectType, setSubjectType] = useState<string>("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [page, setPage] = useState(1)
  const [activeEntry, setActiveEntry] = useState<ActivityLogEntry | null>(null)

  const debouncedCauser = useDebouncedValue(causer, 350)

  const filters = useMemo(
    () => ({
      page,
      per_page: 15,
      causer: debouncedCauser,
      subject_type: subjectType,
      date_from: dateFrom,
      date_to: dateTo,
    }),
    [page, debouncedCauser, subjectType, dateFrom, dateTo]
  )

  const activityLogQuery = useActivityLog(filters)
  const items = activityLogQuery.data?.items ?? []
  const pagination = activityLogQuery.data?.pagination

  function resetFilters() {
    setCauser("")
    setSubjectType("")
    setDateFrom("")
    setDateTo("")
    setPage(1)
  }

  const columns = useMemo<EnterpriseDataTableColumn<ActivityLogEntry>[]>(
    () => [
      {
        id: "description",
        header: t("activityLog.columns.description"),
        cell: (row) => (
          <div>
            <p className="font-medium">{row.description}</p>
            {row.subject?.label ? (
              <p className="text-xs text-muted-foreground">{row.subject.label}</p>
            ) : null}
          </div>
        ),
      },
      {
        id: "causer",
        header: t("activityLog.columns.causer"),
        cell: (row) => row.causer?.name ?? t("activityLog.systemCauser"),
      },
      {
        id: "event",
        header: t("activityLog.columns.event"),
        cell: (row) => row.event ?? "—",
      },
      {
        id: "created_at",
        header: t("activityLog.columns.date"),
        cell: (row) => (
          <span className="text-muted-foreground">
            {formatDateTime(row.created_at)}
          </span>
        ),
      },
      {
        id: "actions",
        header: <span className="block text-end">{t("common.actions")}</span>,
        headerClassName: "text-end",
        className: "text-end",
        alwaysVisible: true,
        cell: (row) => (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setActiveEntry(row)}
            aria-label={t("activityLog.viewDetails")}
          >
            <Eye />
          </Button>
        ),
      },
    ],
    [t]
  )

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{t("activityLog.title")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("activityLog.description")}
        </p>
      </div>

      <ActivityStatsCards />

      <div className="rounded-xl border border-stroke bg-card p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="activity-log-causer">
              {t("activityLog.filters.causer")}
            </Label>
            <Input
              id="activity-log-causer"
              value={causer}
              onChange={(event) => {
                setCauser(event.target.value)
                setPage(1)
              }}
              placeholder={t("activityLog.filters.causerPlaceholder")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="activity-log-subject-type">
              {t("activityLog.filters.subjectType")}
            </Label>
            <Select
              value={subjectType || "all"}
              onValueChange={(value) => {
                setSubjectType(value === "all" ? "" : value)
                setPage(1)
              }}
            >
              <SelectTrigger id="activity-log-subject-type" className="w-full">
                <SelectValue placeholder={t("activityLog.filters.allSubjects")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("activityLog.filters.allSubjects")}
                </SelectItem>
                {SUBJECT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {t(`activityLog.subjectTypes.${type}`, { defaultValue: type })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="activity-log-date-from">
              {t("activityLog.filters.dateFrom")}
            </Label>
            <Input
              id="activity-log-date-from"
              type="date"
              value={dateFrom}
              onChange={(event) => {
                setDateFrom(event.target.value)
                setPage(1)
              }}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="activity-log-date-to">
              {t("activityLog.filters.dateTo")}
            </Label>
            <Input
              id="activity-log-date-to"
              type="date"
              value={dateTo}
              onChange={(event) => {
                setDateTo(event.target.value)
                setPage(1)
              }}
            />
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
            <RotateCcw />
            {t("activityLog.filters.reset")}
          </Button>
        </div>
      </div>

      <EnterpriseDataTable
        columns={columns}
        data={items}
        rowKey={(row) => row.id}
        loading={activityLogQuery.isLoading}
        pagination={pagination}
        onPageChange={setPage}
        emptyTitle={t("activityLog.emptyTitle")}
        emptyDescription={t("activityLog.emptyDescription")}
      />

      <ActivityLogDetailsDialog
        entry={activeEntry}
        onOpenChange={(open) => {
          if (!open) setActiveEntry(null)
        }}
      />
    </section>
  )
}
