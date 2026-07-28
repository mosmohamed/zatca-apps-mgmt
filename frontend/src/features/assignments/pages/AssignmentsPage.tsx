import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Eye, Pencil } from "lucide-react"

import { ApplicationPreviewLink } from "@/components/entity-preview/ApplicationPreviewLink"
import { EnterpriseDataTable } from "@/components/EnterpriseDataTable"
import { Button } from "@/components/ui/button"
import { ApplicationAssignmentEditDialog } from "@/features/assignments/components/ApplicationAssignmentEditDialog"
import { ApplicationAssignmentViewDialog } from "@/features/assignments/components/ApplicationAssignmentViewDialog"
import { useApplicationAssignmentsSummary } from "@/features/assignments/hooks/use-assignments"
import type { AssignmentSummary } from "@/features/assignments/types/assignment"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useDebouncedValue } from "@/hooks/use-debounced-value"

export function AssignmentsPage() {
  const { t, i18n } = useTranslation()
  const { isSuperAdmin } = useAuth()
  const isArabic = i18n.language === "ar"

  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState("name_en")
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

  const summaryQuery = useApplicationAssignmentsSummary(listParams)
  const items = summaryQuery.data?.items ?? []
  const pagination = summaryQuery.data?.pagination

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">{t("assignments.title")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("assignments.description")}
        </p>
      </div>

      <EnterpriseDataTable<AssignmentSummary>
        columns={[
          {
            id: "name",
            header: t("assignments.columns.application"),
            sortable: true,
            sortKey: "name_en",
            cell: (row) => (
              <div className="min-w-0">
                <div className="truncate font-medium">
                  <ApplicationPreviewLink
                    applicationId={row.id}
                    name={isArabic ? row.name_ar : row.name_en}
                  />
                </div>
                {/* <div className="font-mono text-xs text-muted-foreground">
                  {row.code}
                </div> */}
              </div>
            ),
          },
          {
            id: "department",
            header: t("assignments.columns.department"),
            cell: (row) =>
              isArabic
                ? (row.department?.name_ar ?? "—")
                : (row.department?.name_en ?? "—"),
          },
          {
            id: "active_users_count",
            header: t("assignments.columns.activeEmployees"),
            sortable: true,
            sortKey: "active_users_count",
            cell: (row) => row.active_users_count,
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
                  aria-label={t("assignments.actions.view")}
                  onClick={() => setViewId(row.id)}
                >
                  <Eye />
                </Button>
                {isSuperAdmin ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label={t("assignments.actions.edit")}
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
        searchPlaceholder={t("assignments.searchPlaceholder")}
        sort={sort}
        onSortChange={(value) => {
          setSort(value)
          setPage(1)
        }}
        pagination={pagination}
        onPageChange={setPage}
        emptyTitle={t("assignments.emptyTitle")}
        emptyDescription={
          debouncedSearch
            ? t("assignments.emptyFiltered")
            : t("assignments.emptyCreate")
        }
      />

      <ApplicationAssignmentViewDialog
        applicationId={viewId}
        open={viewId !== null}
        onOpenChange={(next) => {
          if (!next) setViewId(null)
        }}
      />

      {isSuperAdmin ? (
        <ApplicationAssignmentEditDialog
          applicationId={editId}
          open={editId !== null}
          onOpenChange={(next) => {
            if (!next) setEditId(null)
          }}
        />
      ) : null}
    </section>
  )
}
