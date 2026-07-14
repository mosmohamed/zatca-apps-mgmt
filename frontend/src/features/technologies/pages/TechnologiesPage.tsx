import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Pencil, Plus, Trash2 } from "lucide-react"

import { ConfirmAlertDialog } from "@/components/ConfirmAlertDialog"
import {
  EnterpriseDataTable,
  type EnterpriseDataTableColumn,
} from "@/components/EnterpriseDataTable"
import type { EnterpriseExportConfig } from "@/components/enterprise-data-table/types"
import { Button } from "@/components/ui/button"
import { TechnologyFormDialog } from "@/features/technologies/components/TechnologyFormDialog"
import {
  useDeleteTechnology,
  useTechnologies,
} from "@/features/technologies/hooks/use-technologies"
import type { Technology } from "@/features/technologies/types/technology"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { cn } from "@/lib/utils"
import { formatDateTime } from "@/utils/format"

const ALL_COLUMN_IDS = [
  "name",
  "category",
  "description",
  "is_active",
  "created_at",
  "actions",
]

export function TechnologiesPage() {
  const { t } = useTranslation()
  const { can } = useAuth()
  const canCreate = can("technologies.create")
  const canUpdate = can("technologies.update")
  const canDelete = can("technologies.delete")

  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState("name")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Technology | null>(null)
  const [selectedKeys, setSelectedKeys] = useState<Array<string | number>>([])
  const [visibleColumnIds, setVisibleColumnIds] = useState<string[]>(ALL_COLUMN_IDS)
  const [pendingDelete, setPendingDelete] = useState<Technology | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  const debouncedSearch = useDebouncedValue(search, 350)
  const listParams = useMemo(
    () => ({ page, per_page: 15, search: debouncedSearch, sort }),
    [page, debouncedSearch, sort]
  )

  const technologiesQuery = useTechnologies(listParams)
  const deleteMutation = useDeleteTechnology()
  const items = technologiesQuery.data?.items ?? []
  const pagination = technologiesQuery.data?.pagination

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

  const columns = useMemo<EnterpriseDataTableColumn<Technology>[]>(() => {
    const base: EnterpriseDataTableColumn<Technology>[] = [
      {
        id: "name",
        header: t("technologies.columns.name"),
        label: t("technologies.columns.name"),
        sortable: true,
        sortKey: "name",
        cell: (row) => <span className="font-medium">{row.name}</span>,
      },
      {
        id: "category",
        header: t("technologies.columns.category"),
        label: t("technologies.columns.category"),
        sortable: true,
        sortKey: "category",
        cell: (row) =>
          t(`technologies.categories.${row.category}`, {
            defaultValue: row.category,
          }),
      },
      {
        id: "description",
        header: t("technologies.columns.description"),
        label: t("technologies.columns.description"),
        cell: (row) => (
          <span className="line-clamp-2 text-muted-foreground">
            {row.description || "—"}
          </span>
        ),
      },
      {
        id: "is_active",
        header: t("technologies.columns.isActive"),
        label: t("technologies.columns.isActive"),
        sortable: true,
        sortKey: "is_active",
        cell: (row) => (
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
      {
        id: "created_at",
        header: t("technologies.columns.created"),
        label: t("technologies.columns.created"),
        sortable: true,
        sortKey: "created_at",
        cell: (row) => (
          <span className="text-muted-foreground">
            {formatDateTime(row.created_at)}
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
                aria-label={`${t("common.edit")} ${row.name}`}
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
                aria-label={`${t("common.delete")} ${row.name}`}
              >
                <Trash2 />
              </Button>
            ) : null}
          </div>
        ),
      })
    }

    return base
  }, [canDelete, canUpdate, deleteMutation.isPending, t])

  const exportConfig: EnterpriseExportConfig = {
    entity: "technologies",
    filenamePrefix: "technologies",
    reportTitle: t("technologies.title"),
    columns: [
      { key: "name", label: t("technologies.columns.name") },
      { key: "category", label: t("technologies.columns.category") },
      { key: "description", label: t("technologies.columns.description") },
      { key: "is_active", label: t("technologies.columns.isActive") },
      { key: "created_at", label: t("technologies.columns.created") },
    ],
    getContext: () => ({
      search: debouncedSearch,
      sort,
      page,
      per_page: 15,
    }),
    selectedIds: selectedKeys,
    permission: "technologies.export",
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("technologies.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("technologies.description")}
          </p>
        </div>
        {canCreate ? (
          <Button type="button" onClick={openCreate}>
            <Plus />
            {t("technologies.new")}
          </Button>
        ) : null}
      </div>

      <EnterpriseDataTable
        columns={columns}
        data={items}
        rowKey={(row) => row.id}
        loading={technologiesQuery.isLoading}
        search={search}
        onSearchChange={(value) => {
          setSearch(value)
          setPage(1)
        }}
        searchPlaceholder={t("technologies.searchPlaceholder")}
        sort={sort}
        onSortChange={(next) => {
          setSort(next)
          setPage(1)
        }}
        pagination={pagination}
        onPageChange={setPage}
        emptyTitle={t("technologies.emptyTitle")}
        emptyDescription={
          debouncedSearch
            ? t("common.tryDifferentSearch")
            : t("technologies.emptyCreate")
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
        <TechnologyFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          technology={editing}
        />
      ) : null}

      <ConfirmAlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title={t("technologies.deleteTitle")}
        description={t("technologies.deleteConfirm", {
          name: pendingDelete?.name ?? "",
        })}
        confirming={deleteMutation.isPending}
        onConfirm={confirmDelete}
      />

      <ConfirmAlertDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={t("technologies.bulkDeleteTitle")}
        description={t("technologies.bulkDeleteConfirm", {
          count: selectedKeys.length,
        })}
        confirming={deleteMutation.isPending}
        onConfirm={handleBulkDelete}
      />
    </section>
  )
}
