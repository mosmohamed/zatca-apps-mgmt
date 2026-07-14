import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Plus, Trash2 } from "lucide-react"

import { EmptyState } from "@/components/EmptyState"
import { LoadingSkeleton } from "@/components/LoadingSkeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ApplicationStatusFormDialog } from "@/features/application-statuses/components/ApplicationStatusFormDialog"
import {
  useApplicationStatuses,
  useDeleteApplicationStatus,
} from "@/features/application-statuses/hooks/use-application-statuses"
import type { ApplicationStatus } from "@/features/application-statuses/types/application-status"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { cn } from "@/lib/utils"
import { formatDateTime } from "@/utils/format"

type SortColumn = "name_en" | "name_ar" | "code" | "is_active" | "created_at"

function SortIcon({ column, sort }: { column: SortColumn; sort: string }) {
  const active = sort === column || sort === `-${column}`
  if (!active) {
    return <ArrowUpDown className="size-3.5 opacity-50" />
  }
  return sort.startsWith("-") ? (
    <ArrowDown className="size-3.5" />
  ) : (
    <ArrowUp className="size-3.5" />
  )
}

export function ApplicationStatusesPage() {
  const { t } = useTranslation()
  const { isSuperAdmin } = useAuth()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState("name_en")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ApplicationStatus | null>(null)

  const debouncedSearch = useDebouncedValue(search, 350)
  const listParams = useMemo(
    () => ({ page, per_page: 15, search: debouncedSearch, sort }),
    [page, debouncedSearch, sort]
  )

  const applicationStatusesQuery = useApplicationStatuses(listParams)
  const deleteMutation = useDeleteApplicationStatus()
  const items = applicationStatusesQuery.data?.items ?? []
  const pagination = applicationStatusesQuery.data?.pagination

  function toggleSort(column: SortColumn) {
    setPage(1)
    setSort((current) => {
      if (current === column) return `-${column}`
      if (current === `-${column}`) return column
      return column
    })
  }

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  async function handleDelete(applicationStatus: ApplicationStatus) {
    const confirmed = window.confirm(
      t("applicationStatuses.deleteConfirm", {
        name: applicationStatus.name_en,
      })
    )
    if (!confirmed) return
    await deleteMutation.mutateAsync(applicationStatus.id)
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            {t("applicationStatuses.title")}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t("applicationStatuses.description")}
          </p>
        </div>
        {isSuperAdmin ? (
          <Button type="button" onClick={openCreate}>
            <Plus />
            {t("applicationStatuses.new")}
          </Button>
        ) : null}
      </div>

      <div className="rounded-xl border border-stroke bg-card p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder={t("applicationStatuses.searchPlaceholder")}
            className="sm:max-w-sm"
          />
          <p className="text-xs text-muted-foreground">
            {pagination
              ? t("common.pagination", {
                  total: pagination.total,
                  current: pagination.current_page,
                  last: pagination.last_page,
                })
              : t("common.loading")}
          </p>
        </div>

        {applicationStatusesQuery.isLoading ? (
          <LoadingSkeleton variant="table" rows={6} />
        ) : items.length === 0 ? (
          <EmptyState
            title={t("applicationStatuses.emptyTitle")}
            description={
              debouncedSearch
                ? t("common.tryDifferentSearch")
                : t("applicationStatuses.emptyCreate")
            }
            actionLabel={
              isSuperAdmin ? t("applicationStatuses.create") : undefined
            }
            onAction={isSuperAdmin ? openCreate : undefined}
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort("name_en")}
                    >
                      {t("applicationStatuses.columns.nameEn")}
                      <SortIcon column="name_en" sort={sort} />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort("name_ar")}
                    >
                      {t("applicationStatuses.columns.nameAr")}
                      <SortIcon column="name_ar" sort={sort} />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort("code")}
                    >
                      {t("applicationStatuses.columns.code")}
                      <SortIcon column="code" sort={sort} />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort("is_active")}
                    >
                      {t("applicationStatuses.columns.isActive")}
                      <SortIcon column="is_active" sort={sort} />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort("created_at")}
                    >
                      {t("applicationStatuses.columns.created")}
                      <SortIcon column="created_at" sort={sort} />
                    </button>
                  </TableHead>
                  {isSuperAdmin ? (
                    <TableHead className="text-end">{t("common.actions")}</TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((applicationStatus) => (
                  <TableRow key={applicationStatus.id}>
                    <TableCell className="font-medium">
                      {applicationStatus.name_en}
                    </TableCell>
                    <TableCell>{applicationStatus.name_ar}</TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        {applicationStatus.code}
                      </code>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                          applicationStatus.is_active
                            ? "bg-emerald-500/10 text-emerald-700"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {applicationStatus.is_active
                          ? t("common.active")
                          : t("common.inactive")}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(applicationStatus.created_at)}
                    </TableCell>
                    {isSuperAdmin ? (
                      <TableCell className="text-end">
                        <div className="inline-flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              setEditing(applicationStatus)
                              setDialogOpen(true)
                            }}
                            aria-label={`${t("common.edit")} ${applicationStatus.name_en}`}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => void handleDelete(applicationStatus)}
                            disabled={deleteMutation.isPending}
                            aria-label={`${t("common.delete")} ${applicationStatus.name_en}`}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {pagination && pagination.last_page > 1 ? (
              <div className="mt-4 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pagination.current_page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  {t("common.previous")}
                </Button>
                <span className="text-xs text-muted-foreground">
                  {t("common.pageOf", {
                    current: pagination.current_page,
                    last: pagination.last_page,
                  })}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={pagination.current_page >= pagination.last_page}
                  onClick={() =>
                    setPage((current) =>
                      Math.min(pagination.last_page, current + 1)
                    )
                  }
                >
                  {t("common.next")}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </div>

      {isSuperAdmin ? (
        <ApplicationStatusFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          applicationStatus={editing}
        />
      ) : null}
    </section>
  )
}
