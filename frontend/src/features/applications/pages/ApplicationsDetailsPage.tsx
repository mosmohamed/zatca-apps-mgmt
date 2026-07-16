import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Filter, RotateCcw, Search } from "lucide-react"

import { EmptyState } from "@/components/EmptyState"
import { LoadingSkeleton } from "@/components/LoadingSkeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ApplicationDetailsCard } from "@/features/applications/components/ApplicationDetailsCard"
import { HA_MODELS } from "@/features/applications/types/application"
import {
  useApplicationStatusesLookup,
  useApplicationTypesLookup,
  useApplications,
  useDepartmentsLookup,
} from "@/features/applications/hooks/use-applications"
import { useApplicationAssignmentsSummary } from "@/features/assignments/hooks/use-assignments"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { cn } from "@/lib/utils"

const ALL = "all"

type StaffingFilter = "all" | "staffed" | "unstaffed"

export function ApplicationsDetailsPage() {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language.startsWith("ar")

  const [search, setSearch] = useState("")
  const [statusId, setStatusId] = useState(ALL)
  const [departmentId, setDepartmentId] = useState(ALL)
  const [typeId, setTypeId] = useState(ALL)
  const [haModel, setHaModel] = useState(ALL)
  const [staffing, setStaffing] = useState<StaffingFilter>("all")

  const debouncedSearch = useDebouncedValue(search, 200)

  const applicationsQuery = useApplications({
    page: 1,
    per_page: 100,
    sort: "name_en",
  })
  const summaryQuery = useApplicationAssignmentsSummary({
    page: 1,
    per_page: 100,
    sort: "name_en",
  })
  const statusesQuery = useApplicationStatusesLookup()
  const departmentsQuery = useDepartmentsLookup()
  const typesQuery = useApplicationTypesLookup()

  const userCountByAppId = useMemo(() => {
    const map = new Map<number, number>()
    for (const item of summaryQuery.data?.items ?? []) {
      map.set(item.id, item.active_users_count)
    }
    return map
  }, [summaryQuery.data?.items])

  const cards = useMemo(() => {
    const apps = applicationsQuery.data?.items ?? []
    const query = debouncedSearch.trim().toLowerCase()

    return apps
      .filter((app) => {
        if (statusId !== ALL && String(app.status_id) !== statusId) {
          return false
        }
        if (departmentId !== ALL && String(app.department_id) !== departmentId) {
          return false
        }
        if (typeId !== ALL && String(app.application_type_id) !== typeId) {
          return false
        }
        if (haModel !== ALL && app.ha_model !== haModel) {
          return false
        }

        const users = userCountByAppId.get(app.id) ?? 0
        if (staffing === "staffed" && users === 0) {
          return false
        }
        if (staffing === "unstaffed" && users > 0) {
          return false
        }

        if (!query) {
          return true
        }

        const haystack = [
          app.name_en,
          app.name_ar,
          app.code,
          app.ha_model,
          app.business_owner,
          app.technical_owner,
          app.department?.name_en,
          app.department?.name_ar,
          app.status?.name_en,
          app.status?.name_ar,
          app.application_type?.name_en,
          app.application_type?.name_ar,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()

        return haystack.includes(query)
      })
      .map((app, index) => {
        const displayName = isArabic ? app.name_ar : app.name_en
        return {
          id: app.id,
          displayName,
          code: app.code,
          statusName: app.status
            ? isArabic
              ? app.status.name_ar
              : app.status.name_en
            : "—",
          departmentName: app.department
            ? isArabic
              ? app.department.name_ar
              : app.department.name_en
            : t("applicationsDetails.unknownDepartment"),
          typeName: app.application_type
            ? isArabic
              ? app.application_type.name_ar
              : app.application_type.name_en
            : t("applicationsDetails.unknownType"),
          haModelName: app.ha_model
            ? t(`applications.haModels.${app.ha_model}`, {
                defaultValue: app.ha_model,
              })
            : null,
          techCount: app.technologies?.length ?? 0,
          activeUsers: userCountByAppId.get(app.id) ?? 0,
          accentIndex: index,
        }
      })
  }, [
    applicationsQuery.data?.items,
    debouncedSearch,
    departmentId,
    haModel,
    isArabic,
    staffing,
    statusId,
    t,
    typeId,
    userCountByAppId,
  ])

  const isLoading = applicationsQuery.isLoading || summaryQuery.isLoading
  const hasActiveFilters =
    statusId !== ALL ||
    departmentId !== ALL ||
    typeId !== ALL ||
    haModel !== ALL ||
    staffing !== "all" ||
    search.trim() !== ""

  function resetFilters() {
    setSearch("")
    setStatusId(ALL)
    setDepartmentId(ALL)
    setTypeId(ALL)
    setHaModel(ALL)
    setStaffing("all")
  }

  const totalApps = applicationsQuery.data?.items.length ?? 0

  return (
    <section className="space-y-5 animate-in fade-in-0 duration-300">
      <div className="relative overflow-hidden rounded-2xl border border-stroke/80 bg-gradient-to-br from-sky-50/80 via-card to-violet-50/60 p-5 shadow-sm dark:from-sky-950/30 dark:via-card dark:to-violet-950/20">
        <div className="pointer-events-none absolute -end-10 -top-10 size-32 rounded-full bg-sky-400/20 blur-2xl" />
        <div className="relative flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              {t("applicationsDetails.title")}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {t("applicationsDetails.description")}
            </p>
          </div>
          <p className="text-xs font-medium text-muted-foreground">
            {t("applicationsDetails.showingCount", {
              shown: cards.length,
              total: totalApps,
            })}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-stroke/80 bg-card/80 p-3 shadow-sm backdrop-blur-sm sm:p-4">
        <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <Filter className="size-3.5" />
          {t("applicationsDetails.filters.title")}
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-7">
          <div className="relative xl:col-span-2">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("applicationsDetails.filters.searchPlaceholder")}
              className="h-9 ps-9"
            />
          </div>

          <Select value={statusId} onValueChange={setStatusId}>
            <SelectTrigger className="h-9 w-full min-w-0">
              <SelectValue
                placeholder={t("applicationsDetails.filters.status")}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>
                {t("applicationsDetails.filters.allStatuses")}
              </SelectItem>
              {(statusesQuery.data ?? []).map((status) => (
                <SelectItem key={status.id} value={String(status.id)}>
                  {isArabic ? status.name_ar : status.name_en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={departmentId} onValueChange={setDepartmentId}>
            <SelectTrigger className="h-9 w-full min-w-0">
              <SelectValue
                placeholder={t("applicationsDetails.filters.department")}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>
                {t("applicationsDetails.filters.allDepartments")}
              </SelectItem>
              {(departmentsQuery.data ?? []).map((department) => (
                <SelectItem key={department.id} value={String(department.id)}>
                  {isArabic ? department.name_ar : department.name_en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={typeId} onValueChange={setTypeId}>
            <SelectTrigger className="h-9 w-full min-w-0">
              <SelectValue
                placeholder={t("applicationsDetails.filters.category")}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>
                {t("applicationsDetails.filters.allCategories")}
              </SelectItem>
              {(typesQuery.data ?? []).map((type) => (
                <SelectItem key={type.id} value={String(type.id)}>
                  {isArabic ? type.name_ar : type.name_en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={haModel} onValueChange={setHaModel}>
            <SelectTrigger className="h-9 w-full min-w-0">
              <SelectValue
                placeholder={t("applicationsDetails.filters.haModel")}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>
                {t("applicationsDetails.filters.allHaModels")}
              </SelectItem>
              {HA_MODELS.map((model) => (
                <SelectItem key={model} value={model}>
                  {t(`applications.haModels.${model}`, { defaultValue: model })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={staffing}
            onValueChange={(value) => setStaffing(value as StaffingFilter)}
          >
            <SelectTrigger className="h-9 w-full min-w-0">
              <SelectValue
                placeholder={t("applicationsDetails.filters.staffing")}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t("applicationsDetails.filters.allStaffing")}
              </SelectItem>
              <SelectItem value="staffed">
                {t("applicationsDetails.filters.staffed")}
              </SelectItem>
              <SelectItem value="unstaffed">
                {t("applicationsDetails.filters.unstaffed")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasActiveFilters ? (
          <div className="mt-3 flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-muted-foreground"
            >
              <RotateCcw className="size-3.5" />
              {t("applicationsDetails.filters.reset")}
            </Button>
          </div>
        ) : null}
      </div>

      {isLoading ? <LoadingSkeleton variant="cards" /> : null}

      {!isLoading && cards.length === 0 ? (
        <EmptyState
          title={t("applicationsDetails.emptyTitle")}
          description={
            hasActiveFilters
              ? t("applicationsDetails.emptyFilteredDescription")
              : t("applicationsDetails.emptyDescription")
          }
          actionLabel={
            hasActiveFilters
              ? t("applicationsDetails.filters.reset")
              : undefined
          }
          onAction={hasActiveFilters ? resetFilters : undefined}
        />
      ) : null}

      <div
        className={cn(
          "grid gap-4 sm:grid-cols-2 xl:grid-cols-3",
          isLoading ? "hidden" : ""
        )}
      >
        {cards.map((card, index) => (
          <ApplicationDetailsCard
            key={card.id}
            card={card}
            style={{
              animationDelay: `${Math.min(index * 35, 420)}ms`,
              animationFillMode: "both",
            }}
          />
        ))}
      </div>
    </section>
  )
}
