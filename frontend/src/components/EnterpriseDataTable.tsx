import type { ReactNode } from "react"
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { useTranslation } from "react-i18next"

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
}: EnterpriseDataTableProps<T>) {
  const { t } = useTranslation()

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
                {columns.map((column) => (
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
              {data.map((row) => (
                <TableRow key={rowKey(row)}>
                  {columns.map((column) => (
                    <TableCell key={column.id} className={column.className}>
                      {column.cell(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
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
