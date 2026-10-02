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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { VendorFormDialog } from "@/features/vendors/components/VendorFormDialog"
import { VendorStatsCards } from "@/features/vendors/components/VendorStatsCards"
import {
  useDeleteVendor,
  useVendors,
} from "@/features/vendors/hooks/use-vendors"
import type { Vendor } from "@/features/vendors/types/vendor"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import type { OperationalAreaCode } from "@/lib/operational-areas"
import { cn } from "@/lib/utils"

const ALL_COLUMN_IDS = ["name", "email", "phone", "areas", "status", "actions"]

export type VendorsPageProps = {
  forcedArea?: OperationalAreaCode
  viewPermission?: string
  titleKey?: string
  lockArea?: boolean
}

export function VendorsPage({
  forcedArea,
  viewPermission = "vendors.view",
  titleKey = "vendors.title",
  lockArea = false,
}: VendorsPageProps = {}) {
  const { t } = useTranslation()
  const { can } = useAuth()
  const canCreate = can("vendors.create")
  const canUpdate = can("vendors.update")
  const canDelete = can("vendors.delete")
  const canView = can(viewPermission)

  const [searchParams] = useSearchParams()
  const [search, setSearch] = useState(() => searchParams.get("q") ?? "")
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState("name")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Vendor | null>(null)
  const [selectedKeys, setSelectedKeys] = useState<Array<string | number>>([])
  const [visibleColumnIds, setVisibleColumnIds] = useState<string[]>(ALL_COLUMN_IDS)
  const [pendingDelete, setPendingDelete] = useState<Vendor | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  const debouncedSearch = useDebouncedValue(search, 350)
  const listParams = useMemo(
    () => ({
      page,
      per_page: 15,
      search: debouncedSearch,
      sort,
      ...(forcedArea ? { area: forcedArea } : {}),
    }),
    [page, debouncedSearch, sort, forcedArea]
  )

  const vendorsQuery = useVendors(listParams)
  const deleteMutation = useDeleteVendor()
  const items = vendorsQuery.data?.items ?? []
  const pagination = vendorsQuery.data?.pagination

  if (!canView) {
    return null
  }

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

  const columns = useMemo<EnterpriseDataTableColumn<Vendor>[]>(() => {
    const base: EnterpriseDataTableColumn<Vendor>[] = [
      {
        id: "name",
        header: t("vendors.columns.name"),
        label: t("vendors.columns.name"),
        sortable: true,
        sortKey: "name",
        cell: (row) => <span className="font-medium">{row.name}</span>,
      },
      {
        id: "email",
        header: t("vendors.columns.email"),
        label: t("vendors.columns.email"),
        sortable: true,
        sortKey: "email",
        cell: (row) => row.email ?? "—",
      },
      {
        id: "phone",
        header: t("vendors.columns.phone"),
        label: t("vendors.columns.phone"),
        cell: (row) => row.phone ?? "—",
      },
      {
        id: "areas",
        header: t("vendors.columns.areas"),
        label: t("vendors.columns.areas"),
        cell: (row) =>
          row.areas && row.areas.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {row.areas.map((area) => (
                <Badge key={area} variant="secondary">
                  {t(`operationalAreas.${area}`)}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground">—</span>
          ),
      },
      {
        id: "status",
        header: t("vendors.columns.status"),
        label: t("vendors.columns.status"),
        sortable: true,
        sortKey: "status",
        cell: (row) => (
          <span
            className={cn(
              "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
              row.status
                ? "bg-emerald-500/10 text-emerald-700"
                : "bg-muted text-muted-foreground"
            )}
          >
            {row.status ? t("common.active") : t("common.inactive")}
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
    entity: "vendors",
    filenamePrefix: "vendors",
    reportTitle: t(titleKey),
    columns: [
      { key: "name", label: t("vendors.columns.name") },
      { key: "email", label: t("vendors.columns.email") },
      { key: "phone", label: t("vendors.columns.phone") },
      { key: "status", label: t("vendors.columns.status") },
    ],
    getContext: () => ({ search: debouncedSearch, sort, page, per_page: 15 }),
    selectedIds: selectedKeys,
    permission: "vendors.export",
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t(titleKey)}</h2>
          <p className="text-sm text-muted-foreground">
            {t("vendors.description")}
          </p>
        </div>
        {canCreate ? (
          <Button type="button" onClick={openCreate}>
            <Plus />
            {t("vendors.new")}
          </Button>
        ) : null}
      </div>

      <VendorStatsCards area={forcedArea} />

      <EnterpriseDataTable
        columns={columns}
        data={items}
        rowKey={(row) => row.id}
        loading={vendorsQuery.isLoading}
        search={search}
        onSearchChange={(value) => {
          setSearch(value)
          setPage(1)
        }}
        searchPlaceholder={t("vendors.searchPlaceholder")}
        sort={sort}
        onSortChange={(next) => {
          setSort(next)
          setPage(1)
        }}
        pagination={pagination}
        onPageChange={setPage}
        emptyTitle={t("vendors.emptyTitle")}
        emptyDescription={
          debouncedSearch
            ? t("common.tryDifferentSearch")
            : t("vendors.emptyCreate")
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
        <VendorFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          vendor={editing}
          defaultAreas={forcedArea ? [forcedArea] : undefined}
          lockAreas={lockArea}
        />
      ) : null}

      <ConfirmAlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title={t("vendors.deleteTitle")}
        description={t("vendors.deleteConfirm", {
          name: pendingDelete?.name ?? "",
        })}
        confirming={deleteMutation.isPending}
        onConfirm={confirmDelete}
      />

      <ConfirmAlertDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={t("vendors.bulkDeleteTitle")}
        description={t("vendors.bulkDeleteConfirm", {
          count: selectedKeys.length,
        })}
        confirming={deleteMutation.isPending}
        onConfirm={handleBulkDelete}
      />
    </section>
  )
}
