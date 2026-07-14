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
import { JobTitleFormDialog } from "@/features/job-titles/components/JobTitleFormDialog"
import {
  useDeleteJobTitle,
  useJobTitles,
} from "@/features/job-titles/hooks/use-job-titles"
import type { JobTitle } from "@/features/job-titles/types/job-title"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { cn } from "@/lib/utils"
import { formatDateTime } from "@/utils/format"

type SortColumn = "name_en" | "name_ar" | "sort_order" | "is_active" | "created_at"

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

export function JobTitlesPage() {
  const { t } = useTranslation()
  const { isSuperAdmin } = useAuth()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState("sort_order")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<JobTitle | null>(null)

  const debouncedSearch = useDebouncedValue(search, 350)
  const listParams = useMemo(
    () => ({ page, per_page: 15, search: debouncedSearch, sort }),
    [page, debouncedSearch, sort]
  )

  const jobTitlesQuery = useJobTitles(listParams)
  const deleteMutation = useDeleteJobTitle()
  const items = jobTitlesQuery.data?.items ?? []
  const pagination = jobTitlesQuery.data?.pagination

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

  async function handleDelete(jobTitle: JobTitle) {
    const confirmed = window.confirm(
      t("jobTitles.deleteConfirm", { name: jobTitle.name_en })
    )
    if (!confirmed) return
    await deleteMutation.mutateAsync(jobTitle.id)
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("jobTitles.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("jobTitles.description")}
          </p>
        </div>
        {isSuperAdmin ? (
          <Button type="button" onClick={openCreate}>
            <Plus />
            {t("jobTitles.new")}
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
            placeholder={t("jobTitles.searchPlaceholder")}
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

        {jobTitlesQuery.isLoading ? (
          <LoadingSkeleton variant="table" rows={6} />
        ) : items.length === 0 ? (
          <EmptyState
            title={t("jobTitles.emptyTitle")}
            description={
              debouncedSearch
                ? t("common.tryDifferentSearch")
                : t("jobTitles.emptyCreate")
            }
            actionLabel={isSuperAdmin ? t("jobTitles.create") : undefined}
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
                      {t("jobTitles.columns.nameEn")}
                      <SortIcon column="name_en" sort={sort} />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort("name_ar")}
                    >
                      {t("jobTitles.columns.nameAr")}
                      <SortIcon column="name_ar" sort={sort} />
                    </button>
                  </TableHead>
                  <TableHead>{t("jobTitles.columns.description")}</TableHead>
                  <TableHead>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort("sort_order")}
                    >
                      {t("jobTitles.columns.sortOrder")}
                      <SortIcon column="sort_order" sort={sort} />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort("is_active")}
                    >
                      {t("jobTitles.columns.isActive")}
                      <SortIcon column="is_active" sort={sort} />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort("created_at")}
                    >
                      {t("jobTitles.columns.created")}
                      <SortIcon column="created_at" sort={sort} />
                    </button>
                  </TableHead>
                  {isSuperAdmin ? (
                    <TableHead className="text-end">{t("common.actions")}</TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((jobTitle) => (
                  <TableRow key={jobTitle.id}>
                    <TableCell className="font-medium">
                      {jobTitle.name_en}
                    </TableCell>
                    <TableCell>{jobTitle.name_ar}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {jobTitle.description ?? "—"}
                    </TableCell>
                    <TableCell>{jobTitle.sort_order}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                          jobTitle.is_active
                            ? "bg-emerald-500/10 text-emerald-700"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {jobTitle.is_active
                          ? t("common.active")
                          : t("common.inactive")}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(jobTitle.created_at)}
                    </TableCell>
                    {isSuperAdmin ? (
                      <TableCell className="text-end">
                        <div className="inline-flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              setEditing(jobTitle)
                              setDialogOpen(true)
                            }}
                            aria-label={`${t("common.edit")} ${jobTitle.name_en}`}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => void handleDelete(jobTitle)}
                            disabled={deleteMutation.isPending}
                            aria-label={`${t("common.delete")} ${jobTitle.name_en}`}
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
        <JobTitleFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          jobTitle={editing}
        />
      ) : null}
    </section>
  )
}
