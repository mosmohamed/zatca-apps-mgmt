import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Eye, Pencil, Plus, Trash2 } from "lucide-react"

import { ConfirmAlertDialog } from "@/components/ConfirmAlertDialog"
import {
  EnterpriseDataTable,
  type EnterpriseDataTableColumn,
} from "@/components/EnterpriseDataTable"
import type { EnterpriseExportConfig } from "@/components/enterprise-data-table/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { LicenseFormDialog } from "@/features/licenses/components/LicenseFormDialog"
import { LicenseStatsCards } from "@/features/licenses/components/LicenseStatsCards"
import {
  LICENSE_MODULES,
  licensePermission,
  type LicenseModuleId,
} from "@/features/licenses/config/license-modules"
import {
  useDeleteLicense,
  useLicenses,
} from "@/features/licenses/hooks/use-licenses"
import type { License, LicenseStatus } from "@/features/licenses/types/license"
import { LICENSE_STATUSES } from "@/features/licenses/types/license"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { cn } from "@/lib/utils"
import { formatDate } from "@/utils/format"

const ALL_COLUMN_IDS = [
  "name",
  "publisher",
  "product",
  "environment",
  "licensed",
  "used",
  "available",
  "status",
  "end_date",
  "actions",
]

function statusBadgeClass(status: string): string {
  switch (status) {
    case "active":
      return "border-transparent bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    case "expiring_soon":
      return "border-transparent bg-amber-500/10 text-amber-700 dark:text-amber-300"
    case "expired":
      return "border-transparent bg-red-500/10 text-red-700 dark:text-red-300"
    default:
      return ""
  }
}

type LicensesPageProps = {
  moduleId?: LicenseModuleId
}

export function LicensesPage({ moduleId = "apps" }: LicensesPageProps) {
  const { t } = useTranslation()
  const { can } = useAuth()
  const module = LICENSE_MODULES[moduleId]
  const canCreate = can(licensePermission(module, "create"))
  const canUpdate = can(licensePermission(module, "update"))
  const canDelete = can(licensePermission(module, "delete"))
  const canView = can(licensePermission(module, "view"))

  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState("name")
  const [environment, setEnvironment] = useState("")
  const [status, setStatus] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<License | null>(null)
  const [selectedKeys, setSelectedKeys] = useState<Array<string | number>>([])
  const [visibleColumnIds, setVisibleColumnIds] =
    useState<string[]>(ALL_COLUMN_IDS)
  const [pendingDelete, setPendingDelete] = useState<License | null>(null)
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false)

  const debouncedSearch = useDebouncedValue(search, 350)
  const listParams = useMemo(
    () => ({
      page,
      per_page: 15,
      search: debouncedSearch,
      sort,
      environment: environment || undefined,
      status: status || undefined,
    }),
    [page, debouncedSearch, sort, environment, status]
  )

  const licensesQuery = useLicenses(listParams, moduleId)
  const deleteMutation = useDeleteLicense(moduleId)
  const items = licensesQuery.data?.items ?? []
  const pagination = licensesQuery.data?.pagination

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    await deleteMutation.mutateAsync(pendingDelete.id)
    setSelectedKeys((current) =>
      current.filter((key) => key !== pendingDelete.id)
    )
    setPendingDelete(null)
  }

  async function handleBulkDelete() {
    await Promise.all(
      selectedKeys.map((id) => deleteMutation.mutateAsync(Number(id)))
    )
    setSelectedKeys([])
    setBulkDeleteOpen(false)
  }

  const columns = useMemo<EnterpriseDataTableColumn<License>[]>(() => {
    const base: EnterpriseDataTableColumn<License>[] = [
      {
        id: "name",
        header: t("licenses.columns.name"),
        label: t("licenses.columns.name"),
        sortable: true,
        sortKey: "name",
        cell: (row) => <span className="font-medium">{row.name}</span>,
      },
      {
        id: "publisher",
        header: t("licenses.columns.publisher"),
        label: t("licenses.columns.publisher"),
        sortable: true,
        sortKey: "publisher",
        cell: (row) => row.publisher,
      },
      {
        id: "product",
        header: t(module.productKey),
        label: t(module.productKey),
        sortable: true,
        sortKey: "product",
        cell: (row) => row.product,
      },
      {
        id: "environment",
        header: t("licenses.columns.environment"),
        label: t("licenses.columns.environment"),
        sortable: true,
        sortKey: "environment",
        cell: (row) => row.environment || "—",
      },
      {
        id: "licensed",
        header: t(module.licensedKey),
        label: t(module.licensedKey),
        sortable: true,
        sortKey: "licensed",
        cell: (row) => (
          <span className="tabular-nums">{row.licensed}</span>
        ),
      },
      {
        id: "used",
        header: t("licenses.columns.used"),
        label: t("licenses.columns.used"),
        sortable: true,
        sortKey: "used",
        cell: (row) => <span className="tabular-nums">{row.used}</span>,
      },
      {
        id: "available",
        header: t("licenses.columns.available"),
        label: t("licenses.columns.available"),
        sortable: true,
        sortKey: "available",
        cell: (row) => (
          <span className="tabular-nums">{row.available}</span>
        ),
      },
      {
        id: "status",
        header: t("licenses.columns.status"),
        label: t("licenses.columns.status"),
        cell: (row) => (
          <Badge
            className={cn(
              statusBadgeClass(row.status),
              "whitespace-nowrap"
            )}
          >
            {t(`licenses.status.${row.status as LicenseStatus}`, {
              defaultValue: row.status,
            })}
          </Badge>
        ),
      },
      {
        id: "end_date",
        header: t("licenses.columns.endDate"),
        label: t("licenses.columns.endDate"),
        sortable: true,
        sortKey: "end_date",
        cell: (row) => (
          <span className="text-muted-foreground">
            {formatDate(row.end_date)}
          </span>
        ),
      },
    ]

    if (canView || canUpdate || canDelete) {
      base.push({
        id: "actions",
        header: <span className="block text-end">{t("common.actions")}</span>,
        headerClassName: "text-end",
        className: "text-end",
        alwaysVisible: true,
        cell: (row) => (
          <div className="inline-flex gap-1">
            {canView ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                asChild
                aria-label={`${t("licenses.view")} ${row.name}`}
              >
                <Link to={module.detailPath(row.id)}>
                  <Eye />
                </Link>
              </Button>
            ) : null}
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
  }, [canDelete, canUpdate, canView, deleteMutation.isPending, module, t])

  const exportConfig: EnterpriseExportConfig = {
    entity: module.exportEntity,
    filenamePrefix: module.exportEntity,
    reportTitle: t(module.titleKey),
    columns: [
      { key: "publisher", label: t("licenses.columns.publisher") },
      { key: "name", label: t("licenses.columns.name") },
      { key: "product", label: t(module.productKey) },
      { key: "version", label: t("licenses.columns.version") },
      { key: "environment", label: t("licenses.columns.environment") },
      { key: "licensed", label: t(module.licensedKey) },
      { key: "used", label: t("licenses.columns.used") },
      { key: "available", label: t("licenses.columns.available") },
      { key: "start_date", label: t("licenses.columns.startDate") },
      { key: "end_date", label: t("licenses.columns.endDate") },
      { key: "status", label: t("licenses.columns.status") },
    ],
    getContext: () => {
      const filterParts: string[] = []
      if (environment) {
        filterParts.push(
          `${t("licenses.filters.environment")}: ${environment}`
        )
      }
      if (status) {
        filterParts.push(
          `${t("licenses.filters.status")}: ${t(`licenses.status.${status}`, { defaultValue: status })}`
        )
      }

      return {
        search: debouncedSearch,
        sort,
        page,
        per_page: 15,
        filters_summary:
          filterParts.length > 0 ? filterParts.join(" · ") : undefined,
      }
    },
    selectedIds: selectedKeys,
    permission: licensePermission(module, "export"),
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t(module.titleKey)}</h2>
          <p className="text-sm text-muted-foreground">
            {t(module.descriptionKey)}
          </p>
        </div>
        {canCreate ? (
          <Button type="button" onClick={openCreate}>
            <Plus />
            {t("licenses.new")}
          </Button>
        ) : null}
      </div>

      <LicenseStatsCards moduleId={moduleId} />

      <div className="rounded-xl border border-stroke bg-card p-4 shadow-sm">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="licenses-filter-environment">
              {t("licenses.filters.environment")}
            </Label>
            <Input
              id="licenses-filter-environment"
              value={environment}
              onChange={(event) => {
                setEnvironment(event.target.value)
                setPage(1)
              }}
              placeholder={t("licenses.filters.environmentPlaceholder")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="licenses-filter-status">
              {t("licenses.filters.status")}
            </Label>
            <Select
              value={status || "all"}
              onValueChange={(value) => {
                setStatus(value === "all" ? "" : value)
                setPage(1)
              }}
            >
              <SelectTrigger id="licenses-filter-status" className="w-full">
                <SelectValue placeholder={t("licenses.filters.allStatuses")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("licenses.filters.allStatuses")}
                </SelectItem>
                {LICENSE_STATUSES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {t(`licenses.status.${item}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <EnterpriseDataTable
        columns={columns}
        data={items}
        rowKey={(row) => row.id}
        loading={licensesQuery.isLoading}
        search={search}
        onSearchChange={(value) => {
          setSearch(value)
          setPage(1)
        }}
        searchPlaceholder={t("licenses.searchPlaceholder")}
        sort={sort}
        onSortChange={(next) => {
          setSort(next)
          setPage(1)
        }}
        pagination={pagination}
        onPageChange={setPage}
        emptyTitle={t("licenses.emptyTitle")}
        emptyDescription={
          debouncedSearch || environment || status
            ? t("licenses.emptyFiltered")
            : t("licenses.emptyCreate")
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
        <LicenseFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          license={editing}
          moduleId={moduleId}
        />
      ) : null}

      <ConfirmAlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title={t("licenses.deleteTitle")}
        description={t("licenses.deleteConfirm", {
          name: pendingDelete?.name ?? "",
        })}
        confirming={deleteMutation.isPending}
        onConfirm={confirmDelete}
      />

      <ConfirmAlertDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title={t("licenses.bulkDeleteTitle")}
        description={t("licenses.bulkDeleteConfirm", {
          count: selectedKeys.length,
        })}
        confirming={deleteMutation.isPending}
        onConfirm={handleBulkDelete}
      />
    </section>
  )
}
