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
import { useApplicationAssignmentDetails } from "@/features/assignments/hooks/use-assignments"
import { cn } from "@/lib/utils"

type ApplicationAssignmentViewDialogProps = {
  applicationId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ApplicationAssignmentViewDialog({
  applicationId,
  open,
  onOpenChange,
}: ApplicationAssignmentViewDialogProps) {
  const { t, i18n } = useTranslation()
  const detailsQuery = useApplicationAssignmentDetails(applicationId, open)
  const application = detailsQuery.data
  const assignments = application?.assignments ?? []
  const isArabic = i18n.language === "ar"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {application
              ? isArabic
                ? application.name_ar
                : application.name_en
              : t("assignments.view.title")}
          </DialogTitle>
          <DialogDescription>
            {application ? (
              <span className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <span className="font-mono">{application.code}</span>
                <span>
                  {t("assignments.columns.department")}:{" "}
                  {isArabic
                    ? (application.department?.name_ar ?? "—")
                    : (application.department?.name_en ?? "—")}
                </span>
                <span>
                  {t("common.status")}:{" "}
                  {isArabic
                    ? (application.status?.name_ar ?? "—")
                    : (application.status?.name_en ?? "—")}
                </span>
              </span>
            ) : (
              t("assignments.view.description")
            )}
          </DialogDescription>
        </DialogHeader>

        {detailsQuery.isLoading ? (
          <LoadingSkeleton variant="table" rows={5} />
        ) : assignments.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stroke px-4 py-8 text-center text-sm text-muted-foreground">
            {t("assignments.view.empty")}
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("assignments.columns.user")}</TableHead>
                <TableHead>{t("assignments.columns.vendor")}</TableHead>
                <TableHead>{t("assignments.columns.role")}</TableHead>
                <TableHead>{t("assignments.columns.primary")}</TableHead>
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
                    {assignment.user?.vendor?.name ?? t("assignments.internal")}
                  </TableCell>
                  <TableCell>{assignment.app_role?.name ?? "—"}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                        assignment.is_primary
                          ? "bg-emerald-500/10 text-emerald-700"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {assignment.is_primary ? t("common.yes") : t("common.no")}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DialogContent>
    </Dialog>
  )
}
