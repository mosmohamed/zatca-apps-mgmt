import { useTranslation } from "react-i18next"

import { LoadingSkeleton } from "@/components/LoadingSkeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  TooltipProvider,
} from "@/components/ui/tooltip"
import { InfraLevelName } from "@/features/operation-infra/components/InfraLevelName"
import { useInfraCategoryAssignmentMatrix } from "@/features/operation-infra/hooks/use-operation-infra"

type InfraCategoryAssignmentViewDialogProps = {
  categoryId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InfraCategoryAssignmentViewDialog({
  categoryId,
  open,
  onOpenChange,
}: InfraCategoryAssignmentViewDialogProps) {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language.startsWith("ar")
  const detailsQuery = useInfraCategoryAssignmentMatrix(categoryId, open)
  const category = detailsQuery.data
  const assignments = category?.assignments ?? []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {category
              ? isArabic
                ? (category.title_ar ?? category.name_ar)
                : (category.title_en ?? category.name_en)
              : t("operationInfra.assignments.view.title")}
          </DialogTitle>
          <DialogDescription>
            {category ? (
              <span className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <span className="font-mono">{category.code}</span>
                <span>
                  {t("operationInfra.assignments.columns.assignedUsers")}:{" "}
                  {category.assignments_count ?? assignments.length}
                </span>
              </span>
            ) : (
              t("operationInfra.assignments.view.description")
            )}
          </DialogDescription>
        </DialogHeader>

        {detailsQuery.isLoading ? (
          <LoadingSkeleton variant="table" rows={5} />
        ) : assignments.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stroke px-4 py-8 text-center text-sm text-muted-foreground">
            {t("operationInfra.assignments.view.empty")}
          </p>
        ) : (
          <TooltipProvider delayDuration={200}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {t("operationInfra.assignments.columns.user")}
                  </TableHead>
                  <TableHead>
                    {t("operationInfra.assignments.columns.level")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((assignment) => (
                  <TableRow key={assignment.id}>
                    <TableCell>
                      <div className="font-medium">
                        {assignment.user?.full_name ?? "—"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {assignment.user?.email ?? ""}
                      </div>
                    </TableCell>
                    <TableCell>
                      {assignment.level ? (
                        <InfraLevelName level={assignment.level} />
                      ) : (
                        "—"
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TooltipProvider>
        )}
      </DialogContent>
    </Dialog>
  )
}
