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
import { SmartFacilitiesLevelName } from "@/features/smart-facilities/components/SmartFacilitiesLevelName"
import { useSmartFacilitiesCategoryAssignmentMatrix } from "@/features/smart-facilities/hooks/use-smart-facilities"

type SmartFacilitiesCategoryAssignmentViewDialogProps = {
  categoryId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SmartFacilitiesCategoryAssignmentViewDialog({
  categoryId,
  open,
  onOpenChange,
}: SmartFacilitiesCategoryAssignmentViewDialogProps) {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language.startsWith("ar")
  const detailsQuery = useSmartFacilitiesCategoryAssignmentMatrix(categoryId, open)
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
              : t("smartFacilities.assignments.view.title")}
          </DialogTitle>
          <DialogDescription>
            {category ? (
              <span className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <span className="font-mono">{category.code}</span>
                <span>
                  {t("smartFacilities.assignments.columns.assignedUsers")}:{" "}
                  {category.assignments_count ?? assignments.length}
                </span>
              </span>
            ) : (
              t("smartFacilities.assignments.view.description")
            )}
          </DialogDescription>
        </DialogHeader>

        {detailsQuery.isLoading ? (
          <LoadingSkeleton variant="table" rows={5} />
        ) : assignments.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stroke px-4 py-8 text-center text-sm text-muted-foreground">
            {t("smartFacilities.assignments.view.empty")}
          </p>
        ) : (
          <TooltipProvider delayDuration={200}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    {t("smartFacilities.assignments.columns.user")}
                  </TableHead>
                  <TableHead>
                    {t("smartFacilities.assignments.columns.level")}
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
                        <SmartFacilitiesLevelName level={assignment.level} />
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
