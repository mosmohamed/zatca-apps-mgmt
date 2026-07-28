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
import { DepartmentFormDialog } from "@/features/departments/components/DepartmentFormDialog"
import {
  useDeleteDepartment,
  useDepartments,
} from "@/features/departments/hooks/use-departments"
import type { Department } from "@/features/departments/types/department"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { formatDateTime } from "@/utils/format"

type SortColumn = "name_en" | "name_ar" | "created_at"

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

export function DepartmentsPage() {
  const { t } = useTranslation()
  const { can } = useAuth()
  const canCreate = can("departments.create")
  const canUpdate = can("departments.update")
  const canDelete = can("departments.delete")
  const canManage = canCreate || canUpdate || canDelete
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState("name_en")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Department | null>(null)

  const debouncedSearch = useDebouncedValue(search, 350)
  const listParams = useMemo(
    () => ({ page, per_page: 15, search: debouncedSearch, sort }),
    [page, debouncedSearch, sort]
  )

  const departmentsQuery = useDepartments(listParams)
  const deleteMutation = useDeleteDepartment()
  const items = departmentsQuery.data?.items ?? []
  const pagination = departmentsQuery.data?.pagination

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

  async function handleDelete(department: Department) {
    const confirmed = window.confirm(
      t("departments.deleteConfirm", { name: department.name_en })
    )
    if (!confirmed) return
    await deleteMutation.mutateAsync(department.id)
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("departments.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("departments.description")}
          </p>
        </div>
        {canCreate ? (
          <Button type="button" onClick={openCreate}>
            <Plus />
            {t("departments.new")}
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
            placeholder={t("departments.searchPlaceholder")}
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

        {departmentsQuery.isLoading ? (
          <LoadingSkeleton variant="table" rows={6} />
        ) : items.length === 0 ? (
          <EmptyState
            title={t("departments.emptyTitle")}
            description={
              debouncedSearch
                ? t("common.tryDifferentSearch")
                : t("departments.emptyCreate")
            }
            actionLabel={canCreate ? t("departments.create") : undefined}
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
                      {t("departments.columns.nameEn")}
                      <SortIcon column="name_en" sort={sort} />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort("name_ar")}
                    >
                      {t("departments.columns.nameAr")}
                      <SortIcon column="name_ar" sort={sort} />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort("created_at")}
                    >
                      {t("departments.columns.created")}
                      <SortIcon column="created_at" sort={sort} />
                    </button>
                  </TableHead>
                  {canManage ? (
                    <TableHead className="text-end">{t("common.actions")}</TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((department) => (
                  <TableRow key={department.id}>
                    <TableCell className="font-medium">
                      {department.name_en}
                    </TableCell>
                    <TableCell>{department.name_ar}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(department.created_at)}
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
                              setEditing(department)
                              setDialogOpen(true)
                            }}
                            aria-label={`${t("common.edit")} ${department.name_en}`}
                          >
                            <Pencil />
                          </Button>
                          ) : null}
                          {canDelete ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => void handleDelete(department)}
                            disabled={deleteMutation.isPending}
                            aria-label={`${t("common.delete")} ${department.name_en}`}
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
        <DepartmentFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          department={editing}
        />
      ) : null}
    </section>
  )
}
