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
import { AppRoleFormDialog } from "@/features/app-roles/components/AppRoleFormDialog"
import {
  useAppRoles,
  useDeleteAppRole,
} from "@/features/app-roles/hooks/use-app-roles"
import type { AppRole } from "@/features/app-roles/types/app-role"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { cn } from "@/lib/utils"
import { formatDateTime } from "@/utils/format"

type SortColumn = "name" | "sort_order" | "is_active" | "created_at"

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

export function AppRolesPage() {
  const { t } = useTranslation()
  const { can } = useAuth()
  const canCreate = can("app-roles.create")
  const canUpdate = can("app-roles.update")
  const canDelete = can("app-roles.delete")
  const canManage = canCreate || canUpdate || canDelete
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState("sort_order")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<AppRole | null>(null)

  const debouncedSearch = useDebouncedValue(search, 350)
  const listParams = useMemo(
    () => ({ page, per_page: 15, search: debouncedSearch, sort }),
    [page, debouncedSearch, sort]
  )

  const appRolesQuery = useAppRoles(listParams)
  const deleteMutation = useDeleteAppRole()
  const items = appRolesQuery.data?.items ?? []
  const pagination = appRolesQuery.data?.pagination

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

  async function handleDelete(appRole: AppRole) {
    const confirmed = window.confirm(
      t("appRoles.deleteConfirm", { name: appRole.name })
    )
    if (!confirmed) return
    await deleteMutation.mutateAsync(appRole.id)
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("appRoles.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("appRoles.description")}
          </p>
        </div>
        {canCreate ? (
          <Button type="button" onClick={openCreate}>
            <Plus />
            {t("appRoles.new")}
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
            placeholder={t("appRoles.searchPlaceholder")}
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

        {appRolesQuery.isLoading ? (
          <LoadingSkeleton variant="table" rows={6} />
        ) : items.length === 0 ? (
          <EmptyState
            title={t("appRoles.emptyTitle")}
            description={
              debouncedSearch
                ? t("common.tryDifferentSearch")
                : t("appRoles.emptyCreate")
            }
            actionLabel={canCreate ? t("appRoles.create") : undefined}
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
                      onClick={() => toggleSort("name")}
                    >
                      {t("appRoles.columns.name")}
                      <SortIcon column="name" sort={sort} />
                    </button>
                  </TableHead>
                  <TableHead>{t("appRoles.columns.description")}</TableHead>
                  <TableHead>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort("sort_order")}
                    >
                      {t("appRoles.columns.sortOrder")}
                      <SortIcon column="sort_order" sort={sort} />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort("is_active")}
                    >
                      {t("appRoles.columns.isActive")}
                      <SortIcon column="is_active" sort={sort} />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort("created_at")}
                    >
                      {t("appRoles.columns.created")}
                      <SortIcon column="created_at" sort={sort} />
                    </button>
                  </TableHead>
                  {canManage ? (
                    <TableHead className="text-end">{t("common.actions")}</TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((appRole) => (
                  <TableRow key={appRole.id}>
                    <TableCell className="font-medium">{appRole.name}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {appRole.description ?? "—"}
                    </TableCell>
                    <TableCell>{appRole.sort_order}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                          appRole.is_active
                            ? "bg-emerald-500/10 text-emerald-700"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {appRole.is_active
                          ? t("common.active")
                          : t("common.inactive")}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDateTime(appRole.created_at)}
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
                              setEditing(appRole)
                              setDialogOpen(true)
                            }}
                            aria-label={`${t("common.edit")} ${appRole.name}`}
                          >
                            <Pencil />
                          </Button>
                          ) : null}
                          {canDelete ? (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => void handleDelete(appRole)}
                            disabled={deleteMutation.isPending}
                            aria-label={`${t("common.delete")} ${appRole.name}`}
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
        <AppRoleFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          appRole={editing}
        />
      ) : null}
    </section>
  )
}
