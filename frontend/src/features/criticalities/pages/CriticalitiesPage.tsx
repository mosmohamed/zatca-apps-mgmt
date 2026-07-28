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
import { CriticalityFormDialog } from "@/features/criticalities/components/CriticalityFormDialog"
import {
  useCriticalities,
  useDeleteCriticality,
} from "@/features/criticalities/hooks/use-criticalities"
import type { Criticality } from "@/features/criticalities/types/criticality"
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

export function CriticalitiesPage() {
  const { t } = useTranslation()
  const { can } = useAuth()
  const canCreate = can("criticalities.create")
  const canUpdate = can("criticalities.update")
  const canDelete = can("criticalities.delete")
  const canManage = canCreate || canUpdate || canDelete
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState("name_en")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Criticality | null>(null)

  const debouncedSearch = useDebouncedValue(search, 350)
  const listParams = useMemo(
    () => ({ page, per_page: 15, search: debouncedSearch, sort }),
    [page, debouncedSearch, sort]
  )

  const criticalitiesQuery = useCriticalities(listParams)
  const deleteMutation = useDeleteCriticality()
  const items = criticalitiesQuery.data?.items ?? []
  const pagination = criticalitiesQuery.data?.pagination

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

  async function handleDelete(criticality: Criticality) {
    const confirmed = window.confirm(
      t("criticalities.deleteConfirm", { name: criticality.name_en })
    )
    if (!confirmed) return
    await deleteMutation.mutateAsync(criticality.id)
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("criticalities.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("criticalities.description")}
          </p>
        </div>
        {canCreate ? (
          <Button type="button" onClick={openCreate}>
            <Plus />
            {t("criticalities.new")}
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
            placeholder={t("criticalities.searchPlaceholder")}
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

        {criticalitiesQuery.isLoading ? (
          <LoadingSkeleton variant="table" rows={6} />
        ) : items.length === 0 ? (
          <EmptyState
            title={t("criticalities.emptyTitle")}
            description={
              debouncedSearch
                ? t("common.tryDifferentSearch")
                : t("criticalities.emptyCreate")
            }
            actionLabel={canCreate ? t("criticalities.create") : undefined}
            onAction={canCreate ? openCreate : undefined}
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
                      {t("criticalities.columns.nameEn")}
                      <SortIcon column="name_en" sort={sort} />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort("name_ar")}
                    >
                      {t("criticalities.columns.nameAr")}
                      <SortIcon column="name_ar" sort={sort} />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort("code")}
                    >
                      {t("criticalities.columns.code")}
                      <SortIcon column="code" sort={sort} />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort("is_active")}
                    >
                      {t("criticalities.columns.isActive")}
                      <SortIcon column="is_active" sort={sort} />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort("created_at")}
                    >
                      {t("criticalities.columns.created")}
                      <SortIcon column="created_at" sort={sort} />
                    </button>
                  </TableHead>
                  {canManage ? (
                    <TableHead className="text-end">{t("common.actions")}</TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((criticality) => (
                  <TableRow key={criticality.id}>
                    <TableCell className="font-medium">
                      {criticality.name_en}
                    </TableCell>
                    <TableCell>{criticality.name_ar}</TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                        {criticality.code}
                      </code>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                          criticality.is_active
                            ? "bg-emerald-500/10 text-emerald-700"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {criticality.is_active
                          ? t("common.active")
                          : t("common.inactive")}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(criticality.created_at)}
                    </TableCell>
                    {canManage ? (
                      <TableCell className="text-end">
                        <div className="inline-flex gap-1">
                          {canUpdate ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              setEditing(criticality)
                              setDialogOpen(true)
                            }}
                            aria-label={`${t("common.edit")} ${criticality.name_en}`}
                          >
                            <Pencil />
                          </Button>
                          ) : null}
                          {canDelete ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => void handleDelete(criticality)}
                            disabled={deleteMutation.isPending}
                            aria-label={`${t("common.delete")} ${criticality.name_en}`}
                          >
                            <Trash2 />
                          </Button>
                          ) : null}
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

      {canManage ? (
        <CriticalityFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          criticality={editing}
        />
      ) : null}
    </section>
  )
}
