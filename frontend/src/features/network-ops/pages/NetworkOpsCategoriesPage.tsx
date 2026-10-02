import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
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
import { NetworkOpsCategoryFormDialog } from "@/features/network-ops/components/NetworkOpsCategoryFormDialog"
import { NetworkOpsCategoryStatsCards } from "@/features/network-ops/components/NetworkOpsCategoryStatsCards"
import { NetworkOpsLevelFormDialog } from "@/features/network-ops/components/NetworkOpsLevelFormDialog"
import { NetworkOpsLevelName } from "@/features/network-ops/components/NetworkOpsLevelName"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  useDeleteNetworkOpsCategory,
  useDeleteNetworkOpsLevel,
  useNetworkOpsCategories,
  useNetworkOpsLevels,
} from "@/features/network-ops/hooks/use-network-ops"
import type {
  NetworkOpsCategory,
  NetworkOpsLevel,
} from "@/features/network-ops/types/network-ops"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { cn } from "@/lib/utils"
import { formatDateTime } from "@/utils/format"

type CategoryDialogState = {
  open: boolean
  category: NetworkOpsCategory | null
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

type CategoryTableRow = NetworkOpsCategory & {
  depth: 0 | 1
  has_children: boolean
}

function CategoriesTab() {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language.startsWith("ar")
  const { can } = useAuth()
  const canCreate = can("network-ops-categories.create")
  const canUpdate = can("network-ops-categories.update")
  const canDelete = can("network-ops-categories.delete")
  const canViewTeamDetails = can("network-ops-team-assignments.view")
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
  const categoriesQuery = useNetworkOpsCategories(listParams)
  const deleteMutation = useDeleteNetworkOpsCategory()
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

  function openCreateSub(root: NetworkOpsCategory) {
    setDialog({
      open: true,
      category: null,
      parentId: root.id,
      parentLabel: isArabic ? root.name_ar : root.name_en,
    })
  }

  function openEdit(category: NetworkOpsCategory) {
    setDialog({
      open: true,
      category,
      parentId: category.parent_id,
      parentLabel: null,
    })
  }

  async function handleDelete(category: NetworkOpsCategory) {
    const name = isArabic ? category.name_ar : category.name_en
    const confirmed = window.confirm(
      t("networkOps.categories.deleteConfirm", { name })
    )
    if (!confirmed) return
    await deleteMutation.mutateAsync(category.id)
  }

  const columns = useMemo<EnterpriseDataTableColumn<CategoryTableRow>[]>(() => {
    const base: EnterpriseDataTableColumn<CategoryTableRow>[] = [
      {
        id: "name",
        header: t("networkOps.categories.columns.name"),
        label: t("networkOps.categories.columns.name"),
        sortable: true,
        sortKey: isArabic ? "name_ar" : "name_en",
        cell: (row) => {
          const name = isArabic ? row.name_ar : row.name_en
          const hasSubcategories =
            row.has_children || (row.children_count ?? 0) > 0
          const ownAssignmentsCount = hasSubcategories
            ? 0
            : (row.assignments_count ?? 0)
          const canOpenTeamDetails =
            canViewTeamDetails && !hasSubcategories && ownAssignmentsCount > 0

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
                      ? t("networkOps.categories.collapse")
                      : t("networkOps.categories.expand")
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
              {canOpenTeamDetails ? (
                <Link
                  to={`/network-ops-escalation-matrix/${row.id}`}
                  className={cn(
                    "cursor-pointer truncate underline-offset-2 outline-none transition-colors",
                    "hover:underline focus-visible:underline",
                    "focus-visible:ring-2 focus-visible:ring-ring",
                    row.depth === 0
                      ? "font-semibold text-foreground"
                      : "font-medium text-muted-foreground"
                  )}
                  aria-label={t("networkOps.categories.openTeamDetails", {
                    name,
                  })}
                >
                  {name}
                </Link>
              ) : (
                <span
                  className={cn(
                    "truncate",
                    row.depth === 0
                      ? "font-semibold"
                      : "font-medium text-muted-foreground"
                  )}
                >
                  {name}
                </span>
              )}
            </div>
          )
        },
      },
      {
        id: "type",
        header: t("networkOps.categories.columns.type"),
        label: t("networkOps.categories.columns.type"),
        cell: (row) =>
          row.parent_id === null
            ? t("networkOps.categories.types.parent")
            : t("networkOps.categories.types.subcategory"),
      },
      {
        id: "parent",
        header: t("networkOps.categories.columns.parent"),
        label: t("networkOps.categories.columns.parent"),
        cell: (row) =>
          row.parent
            ? isArabic
              ? row.parent.name_ar
              : row.parent.name_en
            : "—",
      },
      {
        id: "code",
        header: t("networkOps.categories.columns.code"),
        label: t("networkOps.categories.columns.code"),
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
        header: t("networkOps.categories.columns.assignments"),
        label: t("networkOps.categories.columns.assignments"),
        cell: (row) => (
          <span className="tabular-nums">{row.assignments_count ?? 0}</span>
        ),
      },
      {
        id: "sort_order",
        header: t("networkOps.categories.columns.sortOrder"),
        label: t("networkOps.categories.columns.sortOrder"),
        sortable: true,
        sortKey: "sort_order",
        cell: (row) => (
          <span className="tabular-nums">{row.sort_order}</span>
        ),
      },
      {
        id: "status",
        header: t("networkOps.categories.columns.isActive"),
        label: t("networkOps.categories.columns.isActive"),
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
        header: t("networkOps.categories.columns.created"),
        label: t("networkOps.categories.columns.created"),
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
                aria-label={t("networkOps.categories.addSub")}
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
    canViewTeamDetails,
    deleteMutation.isPending,
    expandedIds,
    isArabic,
    t,
  ])

  return (
    <div className="space-y-4">
      <NetworkOpsCategoryStatsCards />

      <div className="flex justify-end">
        {canCreate ? (
          <Button type="button" onClick={openCreateRoot}>
            <Plus />
            {t("networkOps.categories.newRoot")}
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
        searchPlaceholder={t("networkOps.categories.searchPlaceholder")}
        sort={sort}
        onSortChange={(value) => {
          setSort(value)
          setPage(1)
        }}
        pagination={pagination}
        onPageChange={setPage}
        emptyTitle={t("networkOps.categories.emptyTitle")}
        emptyDescription={
          debouncedSearch || categoryType || activeStatus
            ? t("common.tryDifferentSearch")
            : t("networkOps.categories.emptyCreate")
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
                  {t("networkOps.categories.filters.allTypes")}
                </SelectItem>
                <SelectItem value="parent">
                  {t("networkOps.categories.types.parent")}
                </SelectItem>
                <SelectItem value="subcategory">
                  {t("networkOps.categories.types.subcategory")}
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
                  {t("networkOps.categories.filters.allStatuses")}
                </SelectItem>
                <SelectItem value="active">{t("common.active")}</SelectItem>
                <SelectItem value="inactive">{t("common.inactive")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {canCreate || canUpdate ? (
        <NetworkOpsCategoryFormDialog
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
  const canCreate = can("network-ops-levels.create")
  const canUpdate = can("network-ops-levels.update")
  const canDelete = can("network-ops-levels.delete")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState("sort_order")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<NetworkOpsLevel | null>(null)
  const [visibleColumnIds, setVisibleColumnIds] =
    useState<string[]>(LEVEL_COLUMN_IDS)

  const debouncedSearch = useDebouncedValue(search, 300)
  const listParams = useMemo(
    () => ({ page, per_page: 15, search: debouncedSearch, sort }),
    [page, debouncedSearch, sort]
  )

  const levelsQuery = useNetworkOpsLevels(listParams)
  const deleteMutation = useDeleteNetworkOpsLevel()
  const items = levelsQuery.data?.items ?? []
  const pagination = levelsQuery.data?.pagination

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  async function handleDelete(level: NetworkOpsLevel) {
    const confirmed = window.confirm(
      t("networkOps.levels.deleteConfirm", { name: level.name_en })
    )
    if (!confirmed) return
    await deleteMutation.mutateAsync(level.id)
  }

  const columns = useMemo<EnterpriseDataTableColumn<NetworkOpsLevel>[]>(() => {
    const base: EnterpriseDataTableColumn<NetworkOpsLevel>[] = [
      {
        id: "name_en",
        header: t("networkOps.levels.columns.nameEn"),
        label: t("networkOps.levels.columns.nameEn"),
        sortable: true,
        sortKey: "name_en",
        cell: (row) => (
          <span className="font-medium">
            <NetworkOpsLevelName level={row} locale="en" />
          </span>
        ),
      },
      {
        id: "name_ar",
        header: t("networkOps.levels.columns.nameAr"),
        label: t("networkOps.levels.columns.nameAr"),
        sortable: true,
        sortKey: "name_ar",
        cell: (row) => <NetworkOpsLevelName level={row} locale="ar" showIcon={false} />,
      },
      {
        id: "code",
        header: t("networkOps.levels.columns.code"),
        label: t("networkOps.levels.columns.code"),
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
        header: t("networkOps.levels.columns.note"),
        label: t("networkOps.levels.columns.note"),
        cell: (row) => (
          <span className="line-clamp-1 text-muted-foreground">
            {row.note_en ?? "—"}
          </span>
        ),
      },
      {
        id: "sort_order",
        header: t("networkOps.levels.columns.sortOrder"),
        label: t("networkOps.levels.columns.sortOrder"),
        sortable: true,
        sortKey: "sort_order",
        cell: (row) => row.sort_order,
      },
      {
        id: "status",
        header: t("networkOps.levels.columns.isActive"),
        label: t("networkOps.levels.columns.isActive"),
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
              {t("networkOps.levels.new")}
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
          searchPlaceholder={t("networkOps.levels.searchPlaceholder")}
          sort={sort}
          onSortChange={(value) => {
            setSort(value)
            setPage(1)
          }}
          pagination={pagination}
          onPageChange={setPage}
          emptyTitle={t("networkOps.levels.emptyTitle")}
          emptyDescription={
            debouncedSearch
              ? t("common.tryDifferentSearch")
              : t("networkOps.levels.emptyCreate")
          }
          visibleColumnIds={visibleColumnIds}
          onVisibleColumnIdsChange={setVisibleColumnIds}
        />

        {canCreate || canUpdate ? (
          <NetworkOpsLevelFormDialog
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            level={editing}
          />
        ) : null}
      </div>
    </TooltipProvider>
  )
}

export function NetworkOpsCategoriesPage() {
  const { t } = useTranslation()

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">
          {t("networkOps.categories.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("networkOps.categories.description")}
        </p>
      </div>

      <Tabs defaultValue="categories">
        <TabsList>
          <TabsTrigger value="categories">
            {t("networkOps.categories.tabs.categories")}
          </TabsTrigger>
          <TabsTrigger value="levels">
            {t("networkOps.categories.tabs.levels")}
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
