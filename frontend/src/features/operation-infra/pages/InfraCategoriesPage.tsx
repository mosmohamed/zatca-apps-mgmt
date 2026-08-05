import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react"

import {
  EnterpriseDataTable,
  type EnterpriseDataTableColumn,
} from "@/components/EnterpriseDataTable"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { InfraCategoryFormDialog } from "@/features/operation-infra/components/InfraCategoryFormDialog"
import { InfraCategoryStatsCards } from "@/features/operation-infra/components/InfraCategoryStatsCards"
import { InfraLevelFormDialog } from "@/features/operation-infra/components/InfraLevelFormDialog"
import { InfraLevelName } from "@/features/operation-infra/components/InfraLevelName"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  useDeleteInfraCategory,
  useDeleteInfraLevel,
  useInfraCategories,
  useInfraLevels,
} from "@/features/operation-infra/hooks/use-operation-infra"
import type {
  InfraCategory,
  InfraLevel,
} from "@/features/operation-infra/types/operation-infra"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { cn } from "@/lib/utils"
import { formatDateTime } from "@/utils/format"

type CategoryDialogState = {
  open: boolean
  category: InfraCategory | null
  parentId: number | null
  parentLabel: string | null
}

const initialCategoryDialogState: CategoryDialogState = {
  open: false,
  category: null,
  parentId: null,
  parentLabel: null,
}

const CATEGORY_COLUMN_IDS = [
  "name",
  "type",
  "parent",
  "code",
  "assignments",
  "sort_order",
  "status",
  "created",
  "actions",
]

const LEVEL_COLUMN_IDS = [
  "name_en",
  "name_ar",
  "code",
  "note",
  "sort_order",
  "status",
  "actions",
]

type CategoryTableRow = InfraCategory & {
  depth: 0 | 1
  has_children: boolean
}

function CategoriesTab() {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language.startsWith("ar")
  const { can } = useAuth()
  const canCreate = can("infra-categories.create")
  const canUpdate = can("infra-categories.update")
  const canDelete = can("infra-categories.delete")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState("sort_order")
  const [categoryType, setCategoryType] = useState<
    "" | "parent" | "subcategory"
  >("")
  const [activeStatus, setActiveStatus] = useState<
    "" | "active" | "inactive"
  >("")
  const [visibleColumnIds, setVisibleColumnIds] =
    useState<string[]>(CATEGORY_COLUMN_IDS)
  const [dialog, setDialog] = useState<CategoryDialogState>(
    initialCategoryDialogState
  )
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())

  const debouncedSearch = useDebouncedValue(search, 350)
  const isHierarchical = categoryType === ""
  const listParams = useMemo(
    () => ({
      page,
      per_page: 15,
      search: debouncedSearch,
      sort,
      category_type:
        categoryType === "parent" || categoryType === "subcategory"
          ? categoryType
          : undefined,
      active_status:
        activeStatus === "active" || activeStatus === "inactive"
          ? activeStatus
          : undefined,
    }),
    [page, debouncedSearch, sort, categoryType, activeStatus]
  )
  const categoriesQuery = useInfraCategories(listParams)
  const deleteMutation = useDeleteInfraCategory()
  const items = categoriesQuery.data?.items ?? []
  const pagination = categoriesQuery.data?.pagination

  useEffect(() => {
    if (!isHierarchical) {
      return
    }
    setExpandedIds((current) => {
      let changed = false
      const next = new Set(current)
      for (const item of items) {
        if ((item.children?.length ?? 0) > 0 && !next.has(item.id)) {
          next.add(item.id)
          changed = true
        }
      }
      return changed ? next : current
    })
  }, [isHierarchical, items])

  const tableRows = useMemo<CategoryTableRow[]>(() => {
    if (!isHierarchical) {
      return items.map((item) => ({
        ...item,
        depth: item.parent_id === null ? 0 : 1,
        has_children: false,
      }))
    }

    const rows: CategoryTableRow[] = []
    for (const parent of items) {
      const children = parent.children ?? []
      rows.push({
        ...parent,
        depth: 0,
        has_children: children.length > 0,
        assignments_count:
          children.length > 0
            ? children.reduce(
                (sum, child) => sum + (child.assignments_count ?? 0),
                0
              )
            : (parent.assignments_count ?? 0),
      })
      if (expandedIds.has(parent.id)) {
        for (const child of children) {
          rows.push({
            ...child,
            depth: 1,
            has_children: false,
            parent: {
              id: parent.id,
              name_en: parent.name_en,
              name_ar: parent.name_ar,
              code: parent.code,
            },
          })
        }
      }
    }
    return rows
  }, [expandedIds, isHierarchical, items])

  function toggleExpanded(id: number) {
    setExpandedIds((current) => {
      const next = new Set(current)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function openCreateRoot() {
    setDialog({ open: true, category: null, parentId: null, parentLabel: null })
  }

  function openCreateSub(root: InfraCategory) {
    setDialog({
      open: true,
      category: null,
      parentId: root.id,
      parentLabel: isArabic ? root.name_ar : root.name_en,
    })
  }

  function openEdit(category: InfraCategory) {
    setDialog({
      open: true,
      category,
      parentId: category.parent_id,
      parentLabel: null,
    })
  }

  async function handleDelete(category: InfraCategory) {
    const name = isArabic ? category.name_ar : category.name_en
    const confirmed = window.confirm(
      t("operationInfra.categories.deleteConfirm", { name })
    )
    if (!confirmed) return
    await deleteMutation.mutateAsync(category.id)
  }

  const columns = useMemo<EnterpriseDataTableColumn<CategoryTableRow>[]>(() => {
    const base: EnterpriseDataTableColumn<CategoryTableRow>[] = [
      {
        id: "name",
        header: t("operationInfra.categories.columns.name"),
        label: t("operationInfra.categories.columns.name"),
        sortable: true,
        sortKey: isArabic ? "name_ar" : "name_en",
        cell: (row) => {
          const name = isArabic ? row.name_ar : row.name_en
          return (
            <div
              className={cn(
                "flex min-w-0 items-center gap-1.5",
                row.depth === 1 && "ps-6"
              )}
            >
              {row.has_children ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-7 shrink-0"
                  onClick={() => toggleExpanded(row.id)}
                  aria-expanded={expandedIds.has(row.id)}
                  aria-label={
                    expandedIds.has(row.id)
                      ? t("operationInfra.categories.collapse")
                      : t("operationInfra.categories.expand")
                  }
                >
                  {expandedIds.has(row.id) ? (
                    <ChevronDown className="size-4" />
                  ) : (
                    <ChevronRight className="size-4 rtl:rotate-180" />
                  )}
                </Button>
              ) : (
                <span
                  className={cn(
                    "inline-block size-7 shrink-0",
                    row.depth === 1 &&
                      "ms-1 border-s-2 border-muted-foreground/25"
                  )}
                  aria-hidden
                />
              )}
              <span
                className={cn(
                  "truncate",
                  row.depth === 0 ? "font-semibold" : "font-medium text-muted-foreground"
                )}
              >
                {name}
              </span>
            </div>
          )
        },
      },
      {
        id: "type",
        header: t("operationInfra.categories.columns.type"),
        label: t("operationInfra.categories.columns.type"),
        cell: (row) =>
          row.parent_id === null
            ? t("operationInfra.categories.types.parent")
            : t("operationInfra.categories.types.subcategory"),
      },
      {
        id: "parent",
        header: t("operationInfra.categories.columns.parent"),
        label: t("operationInfra.categories.columns.parent"),
        cell: (row) =>
          row.parent
            ? isArabic
              ? row.parent.name_ar
              : row.parent.name_en
            : "—",
      },
      {
        id: "code",
        header: t("operationInfra.categories.columns.code"),
        label: t("operationInfra.categories.columns.code"),
        sortable: true,
        sortKey: "code",
        cell: (row) => (
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
            {row.code}
          </code>
        ),
      },
      {
        id: "assignments",
        header: t("operationInfra.categories.columns.assignments"),
        label: t("operationInfra.categories.columns.assignments"),
        cell: (row) => (
          <span className="tabular-nums">{row.assignments_count ?? 0}</span>
        ),
      },
      {
        id: "sort_order",
        header: t("operationInfra.categories.columns.sortOrder"),
        label: t("operationInfra.categories.columns.sortOrder"),
        sortable: true,
        sortKey: "sort_order",
        cell: (row) => (
          <span className="tabular-nums">{row.sort_order}</span>
        ),
      },
      {
        id: "status",
        header: t("operationInfra.categories.columns.isActive"),
        label: t("operationInfra.categories.columns.isActive"),
        sortable: true,
        sortKey: "is_active",
        cell: (row) => (
          <span
            className={cn(
              "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
              row.is_active
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "bg-muted text-muted-foreground"
            )}
          >
            {row.is_active ? t("common.active") : t("common.inactive")}
          </span>
        ),
      },
      {
        id: "created",
        header: t("operationInfra.categories.columns.created"),
        label: t("operationInfra.categories.columns.created"),
        sortable: true,
        sortKey: "created_at",
        cell: (row) => (
          <span className="text-muted-foreground">
            {formatDateTime(row.created_at)}
          </span>
        ),
      },
    ]

    if (canCreate || canUpdate || canDelete) {
      base.push({
        id: "actions",
        header: <span className="block text-end">{t("common.actions")}</span>,
        label: t("common.actions"),
        headerClassName: "text-end",
        className: "text-end",
        alwaysVisible: true,
        cell: (row) => (
          <div className="inline-flex gap-1">
            {canCreate && row.parent_id === null ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => openCreateSub(row)}
                aria-label={t("operationInfra.categories.addSub")}
              >
                <Plus />
              </Button>
            ) : null}
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
                onClick={() => void handleDelete(row)}
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
  }, [
    canCreate,
    canDelete,
    canUpdate,
    deleteMutation.isPending,
    expandedIds,
    isArabic,
    t,
  ])

  return (
    <div className="space-y-4">
      <InfraCategoryStatsCards />

      <div className="flex justify-end">
        {canCreate ? (
          <Button type="button" onClick={openCreateRoot}>
            <Plus />
            {t("operationInfra.categories.newRoot")}
          </Button>
        ) : null}
      </div>

      <EnterpriseDataTable
        columns={columns}
        data={tableRows}
        rowKey={(row) =>
          row.depth === 1 ? `child-${row.id}` : `parent-${row.id}`
        }
        loading={categoriesQuery.isLoading}
        search={search}
        onSearchChange={(value) => {
          setSearch(value)
          setPage(1)
        }}
        searchPlaceholder={t("operationInfra.categories.searchPlaceholder")}
        sort={sort}
        onSortChange={(value) => {
          setSort(value)
          setPage(1)
        }}
        pagination={pagination}
        onPageChange={setPage}
        emptyTitle={t("operationInfra.categories.emptyTitle")}
        emptyDescription={
          debouncedSearch || categoryType || activeStatus
            ? t("common.tryDifferentSearch")
            : t("operationInfra.categories.emptyCreate")
        }
        visibleColumnIds={visibleColumnIds}
        onVisibleColumnIdsChange={setVisibleColumnIds}
        toolbar={
          <div className="flex flex-1 flex-col gap-2 sm:flex-row">
            <Select
              value={categoryType || "all"}
              onValueChange={(value) => {
                setCategoryType(
                  value === "parent" || value === "subcategory" ? value : ""
                )
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("operationInfra.categories.filters.allTypes")}
                </SelectItem>
                <SelectItem value="parent">
                  {t("operationInfra.categories.types.parent")}
                </SelectItem>
                <SelectItem value="subcategory">
                  {t("operationInfra.categories.types.subcategory")}
                </SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={activeStatus || "all"}
              onValueChange={(value) => {
                setActiveStatus(
                  value === "active" || value === "inactive" ? value : ""
                )
                setPage(1)
              }}
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("operationInfra.categories.filters.allStatuses")}
                </SelectItem>
                <SelectItem value="active">{t("common.active")}</SelectItem>
                <SelectItem value="inactive">{t("common.inactive")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {canCreate || canUpdate ? (
        <InfraCategoryFormDialog
          open={dialog.open}
          onOpenChange={(open) => setDialog((current) => ({ ...current, open }))}
          category={dialog.category}
          parentId={dialog.parentId}
          parentLabel={dialog.parentLabel}
        />
      ) : null}
    </div>
  )
}

function LevelsTab() {
  const { t } = useTranslation()
  const { can } = useAuth()
  const canCreate = can("infra-levels.create")
  const canUpdate = can("infra-levels.update")
  const canDelete = can("infra-levels.delete")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState("sort_order")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<InfraLevel | null>(null)
  const [visibleColumnIds, setVisibleColumnIds] =
    useState<string[]>(LEVEL_COLUMN_IDS)

  const debouncedSearch = useDebouncedValue(search, 300)
  const listParams = useMemo(
    () => ({ page, per_page: 15, search: debouncedSearch, sort }),
    [page, debouncedSearch, sort]
  )

  const levelsQuery = useInfraLevels(listParams)
  const deleteMutation = useDeleteInfraLevel()
  const items = levelsQuery.data?.items ?? []
  const pagination = levelsQuery.data?.pagination

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  async function handleDelete(level: InfraLevel) {
    const confirmed = window.confirm(
      t("operationInfra.levels.deleteConfirm", { name: level.name_en })
    )
    if (!confirmed) return
    await deleteMutation.mutateAsync(level.id)
  }

  const columns = useMemo<EnterpriseDataTableColumn<InfraLevel>[]>(() => {
    const base: EnterpriseDataTableColumn<InfraLevel>[] = [
      {
        id: "name_en",
        header: t("operationInfra.levels.columns.nameEn"),
        label: t("operationInfra.levels.columns.nameEn"),
        sortable: true,
        sortKey: "name_en",
        cell: (row) => (
          <span className="font-medium">
            <InfraLevelName level={row} locale="en" />
          </span>
        ),
      },
      {
        id: "name_ar",
        header: t("operationInfra.levels.columns.nameAr"),
        label: t("operationInfra.levels.columns.nameAr"),
        sortable: true,
        sortKey: "name_ar",
        cell: (row) => <InfraLevelName level={row} locale="ar" showIcon={false} />,
      },
      {
        id: "code",
        header: t("operationInfra.levels.columns.code"),
        label: t("operationInfra.levels.columns.code"),
        sortable: true,
        sortKey: "code",
        cell: (row) => (
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
            {row.code}
          </code>
        ),
      },
      {
        id: "note",
        header: t("operationInfra.levels.columns.note"),
        label: t("operationInfra.levels.columns.note"),
        cell: (row) => (
          <span className="line-clamp-1 text-muted-foreground">
            {row.note_en ?? "—"}
          </span>
        ),
      },
      {
        id: "sort_order",
        header: t("operationInfra.levels.columns.sortOrder"),
        label: t("operationInfra.levels.columns.sortOrder"),
        sortable: true,
        sortKey: "sort_order",
        cell: (row) => row.sort_order,
      },
      {
        id: "status",
        header: t("operationInfra.levels.columns.isActive"),
        label: t("operationInfra.levels.columns.isActive"),
        sortable: true,
        sortKey: "is_active",
        cell: (row) => (
          <span
            className={cn(
              "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
              row.is_active
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
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
        label: t("common.actions"),
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
                onClick={() => void handleDelete(row)}
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

  return (
    <TooltipProvider delayDuration={200}>
      <div className="space-y-4">
        <div className="flex justify-end">
          {canCreate ? (
            <Button type="button" onClick={openCreate}>
              <Plus />
              {t("operationInfra.levels.new")}
            </Button>
          ) : null}
        </div>

        <EnterpriseDataTable
          columns={columns}
          data={items}
          rowKey={(row) => row.id}
          loading={levelsQuery.isLoading}
          search={search}
          onSearchChange={(value) => {
            setSearch(value)
            setPage(1)
          }}
          searchPlaceholder={t("operationInfra.levels.searchPlaceholder")}
          sort={sort}
          onSortChange={(value) => {
            setSort(value)
            setPage(1)
          }}
          pagination={pagination}
          onPageChange={setPage}
          emptyTitle={t("operationInfra.levels.emptyTitle")}
          emptyDescription={
            debouncedSearch
              ? t("common.tryDifferentSearch")
              : t("operationInfra.levels.emptyCreate")
          }
          visibleColumnIds={visibleColumnIds}
          onVisibleColumnIdsChange={setVisibleColumnIds}
        />

        {canCreate || canUpdate ? (
          <InfraLevelFormDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            level={editing}
          />
        ) : null}
      </div>
    </TooltipProvider>
  )
}

export function InfraCategoriesPage() {
  const { t } = useTranslation()

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">
          {t("operationInfra.categories.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("operationInfra.categories.description")}
        </p>
      </div>

      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories">
            {t("operationInfra.categories.tabs.categories")}
          </TabsTrigger>
          <TabsTrigger value="levels">
            {t("operationInfra.categories.tabs.levels")}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="categories">
          <CategoriesTab />
        </TabsContent>
        <TabsContent value="levels">
          <LevelsTab />
        </TabsContent>
      </Tabs>
    </section>
  )
}
