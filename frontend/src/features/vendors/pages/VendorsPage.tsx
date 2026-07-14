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
import { VendorFormDialog } from "@/features/vendors/components/VendorFormDialog"
import {
  useDeleteVendor,
  useVendors,
} from "@/features/vendors/hooks/use-vendors"
import type { Vendor } from "@/features/vendors/types/vendor"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { cn } from "@/lib/utils"

type SortColumn = "name" | "email" | "status" | "created_at"

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

export function VendorsPage() {
  const { t } = useTranslation()
  const { isSuperAdmin } = useAuth()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState("name")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Vendor | null>(null)

  const debouncedSearch = useDebouncedValue(search, 350)
  const listParams = useMemo(
    () => ({ page, per_page: 15, search: debouncedSearch, sort }),
    [page, debouncedSearch, sort]
  )

  const vendorsQuery = useVendors(listParams)
  const deleteMutation = useDeleteVendor()
  const items = vendorsQuery.data?.items ?? []
  const pagination = vendorsQuery.data?.pagination

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

  async function handleDelete(vendor: Vendor) {
    const confirmed = window.confirm(
      t("vendors.deleteConfirm", { name: vendor.name })
    )
    if (!confirmed) return
    await deleteMutation.mutateAsync(vendor.id)
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("vendors.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("vendors.description")}
          </p>
        </div>
        {isSuperAdmin ? (
          <Button type="button" onClick={openCreate}>
            <Plus />
            {t("vendors.new")}
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
            placeholder={t("vendors.searchPlaceholder")}
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

        {vendorsQuery.isLoading ? (
          <LoadingSkeleton variant="table" rows={8} />
        ) : items.length === 0 ? (
          <EmptyState
            title={t("vendors.emptyTitle")}
            description={
              debouncedSearch
                ? t("common.tryDifferentSearch")
                : t("vendors.emptyCreate")
            }
            actionLabel={isSuperAdmin ? t("vendors.create") : undefined}
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
                      onClick={() => toggleSort("name")}
                    >
                      {t("vendors.columns.name")}
                      <SortIcon column="name" sort={sort} />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort("email")}
                    >
                      {t("vendors.columns.email")}
                      <SortIcon column="email" sort={sort} />
                    </button>
                  </TableHead>
                  <TableHead>{t("vendors.columns.phone")}</TableHead>
                  <TableHead>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort("status")}
                    >
                      {t("vendors.columns.status")}
                      <SortIcon column="status" sort={sort} />
                    </button>
                  </TableHead>
                  {isSuperAdmin ? (
                    <TableHead className="text-end">{t("common.actions")}</TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((vendor) => (
                  <TableRow key={vendor.id}>
                    <TableCell className="font-medium">{vendor.name}</TableCell>
                    <TableCell>{vendor.email ?? "—"}</TableCell>
                    <TableCell>{vendor.phone ?? "—"}</TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                          vendor.status
                            ? "bg-emerald-500/10 text-emerald-700"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {vendor.status ? t("common.active") : t("common.inactive")}
                      </span>
                    </TableCell>
                    {isSuperAdmin ? (
                      <TableCell className="text-end">
                        <div className="inline-flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              setEditing(vendor)
                              setDialogOpen(true)
                            }}
                            aria-label={`${t("common.edit")} ${vendor.name}`}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => void handleDelete(vendor)}
                            disabled={deleteMutation.isPending}
                            aria-label={`${t("common.delete")} ${vendor.name}`}
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
        <VendorFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          vendor={editing}
        />
      ) : null}
    </section>
  )
}
