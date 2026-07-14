import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Pencil, Plus, Trash2 } from "lucide-react"

import {
  EnterpriseDataTable,
  type EnterpriseDataTableColumn,
} from "@/components/EnterpriseDataTable"
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

export function TechnologiesPage() {
  const { t } = useTranslation()
  const { isSuperAdmin } = useAuth()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState("name")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Technology | null>(null)

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

  async function handleDelete(technology: Technology) {
    const confirmed = window.confirm(
      t("technologies.deleteConfirm", { name: technology.name })
    )
    if (!confirmed) return
    await deleteMutation.mutateAsync(technology.id)
  }

  const columns = useMemo<EnterpriseDataTableColumn<Technology>[]>(() => {
    const base: EnterpriseDataTableColumn<Technology>[] = [
      {
        id: "name",
        header: t("technologies.columns.name"),
        sortable: true,
        sortKey: "name",
        cell: (row) => <span className="font-medium">{row.name}</span>,
      },
      {
        id: "category",
        header: t("technologies.columns.category"),
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
        cell: (row) => (
          <span className="line-clamp-2 text-muted-foreground">
            {row.description || "—"}
          </span>
        ),
      },
      {
        id: "is_active",
        header: t("technologies.columns.isActive"),
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
        sortable: true,
        sortKey: "created_at",
        cell: (row) => (
          <span className="text-muted-foreground">
            {formatDateTime(row.created_at)}
          </span>
        ),
      },
    ]

    if (isSuperAdmin) {
      base.push({
        id: "actions",
        header: <span className="block text-end">{t("common.actions")}</span>,
        headerClassName: "text-end",
        className: "text-end",
        cell: (row) => (
          <div className="inline-flex gap-1">
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
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => void handleDelete(row)}
              disabled={deleteMutation.isPending}
              aria-label={`${t("common.delete")} ${row.name}`}
            >
              <Trash2 />
            </Button>
          </div>
        ),
      })
    }

    return base
  }, [deleteMutation.isPending, isSuperAdmin, t])

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("technologies.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("technologies.description")}
          </p>
        </div>
        {isSuperAdmin ? (
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
      />

      {isSuperAdmin ? (
        <TechnologyFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          technology={editing}
        />
      ) : null}
    </section>
  )
}
