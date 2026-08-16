import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Eye, Pencil } from "lucide-react"

import { EnterpriseDataTable } from "@/components/EnterpriseDataTable"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { ServiceDeskCategoryAssignmentEditDialog } from "@/features/service-desk/components/ServiceDeskCategoryAssignmentEditDialog"
import { ServiceDeskCategoryAssignmentViewDialog } from "@/features/service-desk/components/ServiceDeskCategoryAssignmentViewDialog"
import { ServiceDeskTeamAssignmentStatsCards } from "@/features/service-desk/components/ServiceDeskTeamAssignmentStatsCards"
import { useServiceDeskCategoryAssignmentsSummary } from "@/features/service-desk/hooks/use-service-desk"
import type { ServiceDeskCategoryAssignmentSummary } from "@/features/service-desk/types/service-desk"
import { useDebouncedValue } from "@/hooks/use-debounced-value"

export function ServiceDeskTeamAssignmentsPage() {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language.startsWith("ar")
  const { can } = useAuth()
  const canUpdate = can("service-desk-team-assignments.update")
  const canCreate = can("service-desk-team-assignments.create")
  const canEditAssignments = canUpdate || canCreate

  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState("-assignments_count")
  const [viewId, setViewId] = useState<number | null>(null)
  const [editId, setEditId] = useState<number | null>(null)

  const debouncedSearch = useDebouncedValue(search, 350)
  const listParams = useMemo(
    () => ({
      page,
      per_page: 15,
      search: debouncedSearch,
      sort,
    }),
    [page, debouncedSearch, sort]
  )

  const summaryQuery = useServiceDeskCategoryAssignmentsSummary(listParams)
  const items = summaryQuery.data?.items ?? []
  const pagination = summaryQuery.data?.pagination

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">
          {t("serviceDesk.assignments.title")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("serviceDesk.assignments.description")}
        </p>
      </div>

      <ServiceDeskTeamAssignmentStatsCards />

      <EnterpriseDataTable<ServiceDeskCategoryAssignmentSummary>
        columns={[
          {
            id: "name",
            header: t("serviceDesk.assignments.columns.stream"),
            sortable: true,
            sortKey: "name_en",
            cell: (row) => (
              <div className="min-w-0">
                <div className="truncate font-medium">
                  {isArabic
                    ? (row.title_ar ?? row.name_ar)
                    : (row.title_en ?? row.name_en)}
                </div>
                <div className="font-mono text-xs text-muted-foreground">
                  {row.code}
                </div>
              </div>
            ),
          },
          {
            id: "assignments_count",
            header: t("serviceDesk.assignments.columns.assignedUsers"),
            sortable: true,
            sortKey: "assignments_count",
            cell: (row) => row.assignments_count,
          },
          {
            id: "actions",
            header: t("common.actions"),
            headerClassName: "text-end",
            className: "text-end",
            cell: (row) => (
              <div className="inline-flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label={t("serviceDesk.assignments.actions.view")}
                  onClick={() => setViewId(row.id)}
                >
                  <Eye />
                </Button>
                {canEditAssignments ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("serviceDesk.assignments.actions.edit")}
                    onClick={() => setEditId(row.id)}
                  >
                    <Pencil />
                  </Button>
                ) : null}
              </div>
            ),
          },
        ]}
        data={items}
        rowKey={(row) => row.id}
        loading={summaryQuery.isLoading}
        search={search}
        onSearchChange={(value) => {
          setSearch(value)
          setPage(1)
        }}
        searchPlaceholder={t("serviceDesk.assignments.searchPlaceholder")}
        sort={sort}
        onSortChange={(value) => {
          setSort(value)
          setPage(1)
        }}
        pagination={pagination}
        onPageChange={setPage}
        emptyTitle={t("serviceDesk.assignments.emptyTitle")}
        emptyDescription={
          debouncedSearch
            ? t("common.tryDifferentSearch")
            : t("serviceDesk.assignments.emptyCreate")
        }
      />

      <ServiceDeskCategoryAssignmentViewDialog
        categoryId={viewId}
        open={viewId !== null}
        onOpenChange={(next) => {
          if (!next) setViewId(null)
        }}
      />

      {canEditAssignments ? (
        <ServiceDeskCategoryAssignmentEditDialog
          categoryId={editId}
          open={editId !== null}
          onOpenChange={(next) => {
            if (!next) setEditId(null)
          }}
        />
      ) : null}
    </section>
  )
}
