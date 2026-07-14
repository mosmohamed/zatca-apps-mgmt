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
import { ApplicationFormDialog } from "@/features/applications/components/ApplicationFormDialog"
import {
  useApplications,
  useDeleteApplication,
} from "@/features/applications/hooks/use-applications"
import type { Application } from "@/features/applications/types/application"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { cn } from "@/lib/utils"

type SortColumn = "name_en" | "code" | "created_at"

function SortIcon({
  column,
  sort,
}: {
  column: SortColumn
  sort: string
}) {
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

export function ApplicationsPage() {
  const { t } = useTranslation()
  const { isSuperAdmin } = useAuth()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [perPage] = useState(15)
  const [sort, setSort] = useState("-created_at")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Application | null>(null)

  const debouncedSearch = useDebouncedValue(search, 350)

  const listParams = useMemo(
    () => ({
      page,
      per_page: perPage,
      search: debouncedSearch,
      sort,
    }),
    [page, perPage, debouncedSearch, sort]
  )

  const applicationsQuery = useApplications(listParams)
  const deleteMutation = useDeleteApplication()

  const items = applicationsQuery.data?.items ?? []
  const pagination = applicationsQuery.data?.pagination

  function toggleSort(column: SortColumn) {
    setPage(1)
    setSort((current) => {
      if (current === column) {
        return `-${column}`
      }
      if (current === `-${column}`) {
        return column
      }
      return column
    })
  }

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(application: Application) {
    setEditing(application)
    setDialogOpen(true)
  }

  async function handleDelete(application: Application) {
    const confirmed = window.confirm(
      t("applications.deleteConfirm", { name: application.name_en })
    )
    if (!confirmed) {
      return
    }
    await deleteMutation.mutateAsync(application.id)
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("applications.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("applications.description")}
          </p>
        </div>
        {isSuperAdmin ? (
          <Button type="button" onClick={openCreate}>
            <Plus />
            {t("applications.new")}
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
            placeholder={t("applications.searchPlaceholder")}
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

        {applicationsQuery.isLoading ? (
          <LoadingSkeleton variant="table" rows={8} />
        ) : items.length === 0 ? (
          <EmptyState
            title={t("applications.emptyTitle")}
            description={
              debouncedSearch
                ? t("common.tryDifferentSearch")
                : t("applications.emptyCreate")
            }
            actionLabel={isSuperAdmin ? t("applications.create") : undefined}
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
                      {t("applications.columns.name")}
                      <SortIcon column="name_en" sort={sort} />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort("code")}
                    >
                      {t("applications.columns.code")}
                      <SortIcon column="code" sort={sort} />
                    </button>
                  </TableHead>
                  <TableHead>{t("applications.columns.department")}</TableHead>
                  <TableHead>{t("applications.columns.type")}</TableHead>
                  <TableHead>{t("applications.columns.status")}</TableHead>
                  <TableHead>{t("applications.columns.criticality")}</TableHead>
                  {isSuperAdmin ? (
                    <TableHead className="text-end">{t("common.actions")}</TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((application) => (
                  <TableRow key={application.id}>
                    <TableCell>
                      <div className="font-medium">{application.name_en}</div>
                      <div className="text-xs text-muted-foreground">
                        {application.name_ar}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {application.code}
                    </TableCell>
                    <TableCell>
                      {application.department?.name_en ?? "—"}
                    </TableCell>
                    <TableCell>
                      {application.application_type?.name_en ?? "—"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                          application.status?.name_en === "Active" &&
                            "bg-emerald-500/10 text-emerald-700",
                          application.status?.name_en === "Maintenance" &&
                            "bg-amber-500/10 text-amber-700",
                          application.status?.name_en === "Retired" &&
                            "bg-slate-500/10 text-slate-700",
                          application.status?.name_en === "Archived" &&
                            "bg-muted text-muted-foreground"
                        )}
                      >
                        {application.status?.name_en ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {application.criticality?.name_en ?? "—"}
                    </TableCell>
                    {isSuperAdmin ? (
                      <TableCell className="text-end">
                        <div className="inline-flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => openEdit(application)}
                            aria-label={`${t("common.edit")} ${application.name_en}`}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => void handleDelete(application)}
                            disabled={deleteMutation.isPending}
                            aria-label={`${t("common.delete")} ${application.name_en}`}
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
                  disabled={
                    pagination.current_page >= pagination.last_page
                  }
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
        <ApplicationFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          application={editing}
        />
      ) : null}
    </section>
  )
}
