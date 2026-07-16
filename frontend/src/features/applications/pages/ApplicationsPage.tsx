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
import { ApplicationFormDialog } from "@/features/applications/components/ApplicationFormDialog"
import {
  useApplications,
  useDeleteApplication,
} from "@/features/applications/hooks/use-applications"
import type { Application } from "@/features/applications/types/application"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { cn } from "@/lib/utils"

const ALL_COLUMN_IDS = [
  "name",
  "code",
  "department",
  "type",
  "status",
  "criticality",
  "actions",
]

export function ApplicationsPage() {
  const { t } = useTranslation()
  const { can } = useAuth()
  const canCreate = can("applications.create")
  const canUpdate = can("applications.update")
  const canDelete = can("applications.delete")

  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [perPage] = useState(15)
  const [sort, setSort] = useState("-created_at")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Application | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Application | null>(null)
  const [selectedKeys, setSelectedKeys] = useState<Array<string | number>>([])
  const [visibleColumnIds, setVisibleColumnIds] = useState<string[]>(ALL_COLUMN_IDS)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

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

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(application: Application) {
    setEditing(application)
    setDialogOpen(true)
  }

  async function confirmDelete() {
    if (!pendingDelete) {
      return
    }
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

  const columns = useMemo<EnterpriseDataTableColumn<Application>[]>(() => {
    const base: EnterpriseDataTableColumn<Application>[] = [
      {
        id: "name",
        header: t("applications.columns.name"),
        label: t("applications.columns.name"),
        sortable: true,
        sortKey: "name_en",
        cell: (row) => (
          <div>
            <div className="font-medium">{row.name_en}</div>
            <div className="text-xs text-muted-foreground">{row.name_ar}</div>
          </div>
        ),
      },
      {
        id: "code",
        header: t("applications.columns.code"),
        label: t("applications.columns.code"),
        sortable: true,
        sortKey: "code",
        className: "font-mono text-xs",
        cell: (row) => row.code,
      },
      {
        id: "department",
        header: t("applications.columns.department"),
        label: t("applications.columns.department"),
        cell: (row) => row.department?.name_en ?? "—",
      },
      {
        id: "type",
        header: t("applications.columns.type"),
        label: t("applications.columns.type"),
        cell: (row) => row.application_type?.name_en ?? "—",
      },
      {
        id: "status",
        header: t("applications.columns.status"),
        label: t("applications.columns.status"),
        cell: (row) => (
          <span
            className={cn(
              "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
              row.status?.name_en === "Active" &&
                "bg-emerald-500/10 text-emerald-700",
              row.status?.name_en === "Maintenance" &&
                "bg-amber-500/10 text-amber-700",
              row.status?.name_en === "Retired" &&
                "bg-slate-500/10 text-slate-700",
              row.status?.name_en === "Archived" &&
                "bg-muted text-muted-foreground"
            )}
          >
            {row.status?.name_en ?? "—"}
          </span>
        ),
      },
      {
        id: "criticality",
        header: t("applications.columns.criticality"),
        label: t("applications.columns.criticality"),
        cell: (row) => row.criticality?.name_en ?? "—",
      },
      {
        id: "ha_model",
        header: t("applications.columns.haModel"),
        label: t("applications.columns.haModel"),
        cell: (row) =>
          row.ha_model
            ? t(`applications.haModels.${row.ha_model}`, {
                defaultValue: row.ha_model,
              })
            : "—",
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
                onClick={() => openEdit(row)}
                aria-label={`${t("common.edit")} ${row.name_en}`}
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
                aria-label={`${t("common.delete")} ${row.name_en}`}
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
    entity: "applications",
    filenamePrefix: "applications",
    reportTitle: t("applications.title"),
    columns: [
      { key: "name_en", label: t("applications.columns.name") },
      { key: "code", label: t("applications.columns.code") },
      { key: "department", label: t("applications.columns.department") },
      { key: "application_type", label: t("applications.columns.type") },
      { key: "status", label: t("applications.columns.status") },
      { key: "criticality", label: t("applications.columns.criticality") },
      { key: "ha_model", label: t("applications.columns.haModel") },
    ],
    getContext: () => ({
      search: debouncedSearch,
      sort,
      page,
      per_page: perPage,
    }),
    selectedIds: selectedKeys,
    permission: "applications.export",
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
        {canCreate ? (
          <Button type="button" onClick={openCreate}>
            <Plus />
            {t("applications.new")}
          </Button>
        ) : null}
      </div>

      <EnterpriseDataTable
        columns={columns}
        data={items}
        rowKey={(row) => row.id}
        loading={applicationsQuery.isLoading}
        search={search}
        onSearchChange={(value) => {
          setSearch(value)
          setPage(1)
        }}
        searchPlaceholder={t("applications.searchPlaceholder")}
        sort={sort}
        onSortChange={(next) => {
          setSort(next)
          setPage(1)
        }}
        pagination={pagination}
        onPageChange={setPage}
        emptyTitle={t("applications.emptyTitle")}
        emptyDescription={
          debouncedSearch
            ? t("common.tryDifferentSearch")
            : t("applications.emptyCreate")
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
        <ApplicationFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          application={editing}
        />
      ) : null}

      <ConfirmAlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(null)
          }
        }}
        title={t("applications.deleteTitle")}
        description={t("applications.deleteConfirm", {
          name: pendingDelete?.name_en ?? "",
        })}
        confirming={deleteMutation.isPending}
        onConfirm={confirmDelete}
      />

      <ConfirmAlertDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={t("applications.bulkDeleteTitle")}
        description={t("applications.bulkDeleteConfirm", {
          count: selectedKeys.length,
        })}
        confirming={deleteMutation.isPending}
        onConfirm={handleBulkDelete}
      />
    </section>
  )
}
