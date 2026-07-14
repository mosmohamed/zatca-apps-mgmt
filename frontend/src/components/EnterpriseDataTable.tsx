import type { ReactNode } from "react"
import { ArrowDown, ArrowUp, ArrowUpDown, Columns3 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { EmptyState } from "@/components/EmptyState"
import { LoadingSkeleton } from "@/components/LoadingSkeleton"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ExportMenu } from "@/components/enterprise-data-table/ExportMenu"
import type { EnterpriseExportConfig } from "@/components/enterprise-data-table/types"
import type { PaginationMeta } from "@/types/api"
import { cn } from "@/lib/utils"

export type EnterpriseDataTableColumn<T> = {
  id: string
  header: ReactNode
  cell: (row: T) => ReactNode
  sortable?: boolean
  sortKey?: string
  className?: string
  headerClassName?: string
  /** Label used in the column-visibility menu; defaults to `id` when omitted. */
  label?: string
  /** Set to prevent this column from being hidden via the visibility menu. */
  alwaysVisible?: boolean
}

type EnterpriseDataTableProps<T> = {
  columns: EnterpriseDataTableColumn<T>[]
  data: T[]
  rowKey: (row: T) => string | number
  loading?: boolean
  search?: string
  onSearchChange?: (value: string) => void
  searchPlaceholder?: string
  sort?: string
  onSortChange?: (sort: string) => void
  pagination?: PaginationMeta
  onPageChange?: (page: number) => void
  emptyTitle?: string
  emptyDescription?: string
  toolbar?: ReactNode
  className?: string
  selectable?: boolean
  selectedKeys?: Array<string | number>
  onSelectedKeysChange?: (keys: Array<string | number>) => void
  visibleColumnIds?: string[]
  onVisibleColumnIdsChange?: (ids: string[]) => void
  bulkActions?: ReactNode
  exportConfig?: EnterpriseExportConfig
}

export function EnterpriseDataTable<T>({
  columns,
  data,
  rowKey,
  loading = false,
  search,
  onSearchChange,
  searchPlaceholder,
  sort,
  onSortChange,
  pagination,
  onPageChange,
  emptyTitle,
  emptyDescription,
  toolbar,
  className,
  selectable = false,
  selectedKeys,
  onSelectedKeysChange,
  visibleColumnIds,
  onVisibleColumnIdsChange,
  bulkActions,
  exportConfig,
}: EnterpriseDataTableProps<T>) {
  const { t } = useTranslation()

  const selectedKeySet = new Set(selectedKeys ?? [])
  const rowKeys = data.map((row) => rowKey(row))
  const allSelected =
    rowKeys.length > 0 && rowKeys.every((key) => selectedKeySet.has(key))
  const someSelected = rowKeys.some((key) => selectedKeySet.has(key))

  const effectiveColumns = visibleColumnIds
    ? columns.filter(
        (column) =>
          column.alwaysVisible || visibleColumnIds.includes(column.id)
      )
    : columns

  function toggleSort(column: EnterpriseDataTableColumn<T>) {
    if (!column.sortable || !column.sortKey || !onSortChange) {
      return
    }

    const key = column.sortKey
    if (sort === key) {
      onSortChange(`-${key}`)
      return
    }
    if (sort === `-${key}`) {
      onSortChange(key)
      return
    }
    onSortChange(key)
  }

  function toggleSelectAll() {
    if (!onSelectedKeysChange) {
      return
    }

    if (allSelected) {
      const next = (selectedKeys ?? []).filter((key) => !rowKeys.includes(key))
      onSelectedKeysChange(next)
      return
    }

    const next = new Set(selectedKeys ?? [])
    rowKeys.forEach((key) => next.add(key))
    onSelectedKeysChange(Array.from(next))
  }

  function toggleRowSelected(key: string | number) {
    if (!onSelectedKeysChange) {
      return
    }

    if (selectedKeySet.has(key)) {
      onSelectedKeysChange((selectedKeys ?? []).filter((item) => item !== key))
      return
    }

    onSelectedKeysChange([...(selectedKeys ?? []), key])
  }

  function toggleColumnVisible(columnId: string) {
    if (!visibleColumnIds || !onVisibleColumnIdsChange) {
      return
    }

    if (visibleColumnIds.includes(columnId)) {
      onVisibleColumnIdsChange(visibleColumnIds.filter((id) => id !== columnId))
      return
    }

    onVisibleColumnIdsChange([...visibleColumnIds, columnId])
  }

  function SortIcon({ sortKey }: { sortKey: string }) {
    const active = sort === sortKey || sort === `-${sortKey}`
    if (!active) {
      return <ArrowUpDown className="size-3.5 opacity-50" />
    }
    return sort?.startsWith("-") ? (
      <ArrowDown className="size-3.5" />
    ) : (
      <ArrowUp className="size-3.5" />
    )
  }

  const showColumnToggle = Boolean(visibleColumnIds && onVisibleColumnIdsChange)
  const hasSelection = someSelected && (selectedKeys?.length ?? 0) > 0

  return (
    <div className={cn("rounded-xl border border-stroke bg-card p-4 shadow-sm", className)}>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          {onSearchChange ? (
            <Input
              value={search ?? ""}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder ?? t("common.search")}
              className="sm:max-w-sm"
            />
          ) : null}
          {toolbar}
        </div>
        <div className="flex items-center gap-2">
          {showColumnToggle ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  <Columns3 />
                  {t("common.columns")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>{t("common.toggleColumns")}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {columns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={visibleColumnIds?.includes(column.id) ?? true}
                    disabled={column.alwaysVisible}
                    onCheckedChange={() => toggleColumnVisible(column.id)}
                    onSelect={(event) => event.preventDefault()}
                  >
                    {column.label ?? column.id}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
          {exportConfig ? (
            <ExportMenu config={exportConfig} hasData={data.length > 0} />
          ) : null}
          <p className="whitespace-nowrap text-xs text-muted-foreground">
            {pagination
              ? t("common.pagination", {
                  total: pagination.total,
                  current: pagination.current_page,
                  last: pagination.last_page,
                })
              : t("common.loading")}
          </p>
        </div>
      </div>

      {hasSelection && bulkActions ? (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-lg border border-brand/30 bg-brand/5 px-3 py-2">
          <span className="text-sm font-medium">
            {t("common.selectedCount", { count: selectedKeys?.length ?? 0 })}
          </span>
          <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
            {bulkActions}
          </div>
        </div>
      ) : null}

      {loading ? (
        <LoadingSkeleton variant="table" rows={8} />
      ) : data.length === 0 ? (
        <EmptyState
          title={emptyTitle ?? t("empty.defaultDescription")}
          description={emptyDescription}
        />
      ) : (
        <>
          <Table>
            <TableHeader>
              <TableRow>
                {selectable ? (
                  <TableHead className="w-10">
                    <Checkbox
                      checked={
                        allSelected ? true : someSelected ? "indeterminate" : false
                      }
                      onCheckedChange={toggleSelectAll}
                      aria-label={t("common.selectAll")}
                    />
                  </TableHead>
                ) : null}
                {effectiveColumns.map((column) => (
                  <TableHead
                    key={column.id}
                    className={column.headerClassName}
                  >
                    {column.sortable && column.sortKey && onSortChange ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1"
                        onClick={() => toggleSort(column)}
                      >
                        {column.header}
                        <SortIcon sortKey={column.sortKey} />
                      </button>
                    ) : (
                      column.header
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => {
                const key = rowKey(row)
                return (
                  <TableRow key={key} data-state={selectedKeySet.has(key) ? "selected" : undefined}>
                    {selectable ? (
                      <TableCell>
                        <Checkbox
                          checked={selectedKeySet.has(key)}
                          onCheckedChange={() => toggleRowSelected(key)}
                          aria-label={t("common.selectRow")}
                        />
                      </TableCell>
                    ) : null}
                    {effectiveColumns.map((column) => (
                      <TableCell key={column.id} className={column.className}>
                        {column.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          {pagination && pagination.last_page > 1 && onPageChange ? (
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={pagination.current_page <= 1}
                onClick={() =>
                  onPageChange(Math.max(1, pagination.current_page - 1))
                }
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
                  onPageChange(
                    Math.min(pagination.last_page, pagination.current_page + 1)
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
  )
}
