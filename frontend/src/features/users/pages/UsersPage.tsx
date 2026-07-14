import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"
import { Pencil, Plus, Trash2 } from "lucide-react"

import { ConfirmAlertDialog } from "@/components/ConfirmAlertDialog"
import {
  EnterpriseDataTable,
  type EnterpriseDataTableColumn,
} from "@/components/EnterpriseDataTable"
import type { EnterpriseExportConfig } from "@/components/enterprise-data-table/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { UserFormDialog } from "@/features/users/components/UserFormDialog"
import {
  useDeleteUser,
  useUpdateUser,
  useUsers,
} from "@/features/users/hooks/use-users"
import type { ManagedUser } from "@/features/users/types/user"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { cn } from "@/lib/utils"

const ALL_COLUMN_IDS = [
  "name",
  "email",
  "roles",
  "vendor",
  "jobTitle",
  "active",
  "actions",
]

export function UsersPage() {
  const { t } = useTranslation()
  const { can } = useAuth()
  const canCreate = can("users.create")
  const canUpdate = can("users.update")
  const canDelete = can("users.delete")

  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "")
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState("-created_at")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ManagedUser | null>(null)
  const [selectedKeys, setSelectedKeys] = useState<Array<string | number>>([])
  const [visibleColumnIds, setVisibleColumnIds] = useState<string[]>(ALL_COLUMN_IDS)
  const [pendingDelete, setPendingDelete] = useState<ManagedUser | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  const debouncedSearch = useDebouncedValue(search, 350)
  const listParams = useMemo(
    () => ({ page, per_page: 15, search: debouncedSearch, sort }),
    [page, debouncedSearch, sort]
  )

  const usersQuery = useUsers(listParams)
  const deleteMutation = useDeleteUser()
  const updateMutation = useUpdateUser()
  const items = usersQuery.data?.items ?? []
  const pagination = usersQuery.data?.pagination

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    await deleteMutation.mutateAsync(pendingDelete.id)
    setSelectedKeys((current) => current.filter((key) => key !== pendingDelete.id))
    setPendingDelete(null)
  }

  async function handleBulkDelete() {
    await Promise.all(
      selectedKeys.map((id) => deleteMutation.mutateAsync(Number(id)))
    )
    setSelectedKeys([])
    setBulkDeleteOpen(false)
  }

  async function toggleActive(user: ManagedUser) {
    if (!canUpdate) return
    await updateMutation.mutateAsync({
      id: user.id,
      payload: {
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        vendor_id: user.vendor_id,
        phone: user.phone,
        teams: user.teams,
        whatsapp: user.whatsapp,
        extension: user.extension,
        job_title_id: user.job_title_id,
        is_active: !user.is_active,
        roles: user.roles ?? [],
      },
    })
  }

  const columns = useMemo<EnterpriseDataTableColumn<ManagedUser>[]>(() => {
    const base: EnterpriseDataTableColumn<ManagedUser>[] = [
      {
        id: "name",
        header: t("users.columns.name"),
        label: t("users.columns.name"),
        sortable: true,
        sortKey: "first_name",
        cell: (row) => (
          <div>
            <div className="font-medium">{row.full_name}</div>
            <div className="text-xs text-muted-foreground">
              {row.phone ?? "—"}
            </div>
          </div>
        ),
      },
      {
        id: "email",
        header: t("users.columns.email"),
        label: t("users.columns.email"),
        sortable: true,
        sortKey: "email",
        cell: (row) => row.email,
      },
      {
        id: "roles",
        header: t("users.columns.roles"),
        label: t("users.columns.roles"),
        cell: (row) =>
          row.roles && row.roles.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {row.roles.map((role) => (
                <Badge key={role} variant="outline">
                  {role}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: "vendor",
        header: t("users.columns.vendor"),
        label: t("users.columns.vendor"),
        cell: (row) =>
          row.vendor?.name ?? (
            <span className="text-muted-foreground">
              {t("users.form.vendorNone")}
            </span>
          ),
      },
      {
        id: "jobTitle",
        header: t("users.columns.jobTitle"),
        label: t("users.columns.jobTitle"),
        cell: (row) => row.job_title?.name_en ?? "—",
      },
      {
        id: "active",
        header: t("users.columns.active"),
        label: t("users.columns.active"),
        sortable: true,
        sortKey: "is_active",
        cell: (row) =>
          canUpdate ? (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={row.is_active}
                onCheckedChange={() => void toggleActive(row)}
                disabled={updateMutation.isPending}
                aria-label={`${t("common.edit")} ${row.full_name}`}
              />
              <span
                className={cn(
                  "text-xs",
                  row.is_active ? "text-emerald-700" : "text-muted-foreground"
                )}
              >
                {row.is_active ? t("common.active") : t("common.inactive")}
              </span>
            </div>
          ) : (
            <span
              className={cn(
                "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                row.is_active
                  ? "bg-emerald-500/10 text-emerald-700"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {row.is_active ? t("common.active") : t("common.inactive")}
            </span>
          ),
      },
    ]

    if (canUpdate || canDelete) {
      base.push({
        id: "actions",
        header: <span className="block text-end">{t("common.actions")}</span>,
        headerClassName: "text-end",
        className: "text-end",
        alwaysVisible: true,
        cell: (row) => (
          <div className="inline-flex gap-1">
            {canUpdate ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setEditing(row)
                  setDialogOpen(true)
                }}
                aria-label={`${t("common.edit")} ${row.full_name}`}
              >
                <Pencil />
              </Button>
            ) : null}
            {canDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setPendingDelete(row)}
                disabled={deleteMutation.isPending}
                aria-label={`${t("common.delete")} ${row.full_name}`}
              >
                <Trash2 />
              </Button>
            ) : null}
          </div>
        ),
      })
    }

    return base
  }, [canDelete, canUpdate, deleteMutation.isPending, updateMutation.isPending, t])

  const exportConfig: EnterpriseExportConfig = {
    entity: "users",
    filenamePrefix: "users",
    reportTitle: t("users.title"),
    columns: [
      { key: "full_name", label: t("users.columns.name") },
      { key: "email", label: t("users.columns.email") },
      { key: "vendor", label: t("users.columns.vendor") },
      { key: "job_title", label: t("users.columns.jobTitle") },
      { key: "is_active", label: t("users.columns.active") },
    ],
    getContext: () => ({ search: debouncedSearch, sort, page, per_page: 15 }),
    selectedIds: selectedKeys,
    permission: "users.export",
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("users.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("users.description")}
          </p>
        </div>
        {canCreate ? (
          <Button type="button" onClick={openCreate}>
            <Plus />
            {t("users.new")}
          </Button>
        ) : null}
      </div>

      <EnterpriseDataTable
        columns={columns}
        data={items}
        rowKey={(row) => row.id}
        loading={usersQuery.isLoading}
        search={search}
        onSearchChange={(value) => {
          setSearch(value)
          setPage(1)
        }}
        searchPlaceholder={t("users.searchPlaceholder")}
        sort={sort}
        onSortChange={(next) => {
          setSort(next)
          setPage(1)
        }}
        pagination={pagination}
        onPageChange={setPage}
        emptyTitle={t("users.emptyTitle")}
        emptyDescription={
          debouncedSearch
            ? t("common.tryDifferentSearch")
            : t("users.emptyCreate")
        }
        selectable={canDelete}
        selectedKeys={selectedKeys}
        onSelectedKeysChange={setSelectedKeys}
        visibleColumnIds={visibleColumnIds}
        onVisibleColumnIdsChange={setVisibleColumnIds}
        exportConfig={exportConfig}
        bulkActions={
          canDelete ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteOpen(true)}
              disabled={deleteMutation.isPending}
            >
              <Trash2 />
              {t("common.deleteSelected")}
            </Button>
          ) : null
        }
      />

      {canCreate || canUpdate ? (
        <UserFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          user={editing}
        />
      ) : null}

      <ConfirmAlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title={t("users.deleteTitle")}
        description={t("users.deleteConfirm", {
          name: pendingDelete?.full_name ?? "",
        })}
        confirming={deleteMutation.isPending}
        onConfirm={confirmDelete}
      />

      <ConfirmAlertDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={t("users.bulkDeleteTitle")}
        description={t("users.bulkDeleteConfirm", {
          count: selectedKeys.length,
        })}
        confirming={deleteMutation.isPending}
        onConfirm={handleBulkDelete}
      />
    </section>
  )
}
