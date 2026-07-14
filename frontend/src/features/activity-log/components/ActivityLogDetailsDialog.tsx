import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { ActivityLogEntry } from "@/features/activity-log/types/activity-log"
import { formatDateTime } from "@/utils/format"

type ActivityLogDetailsDialogProps = {
  entry: ActivityLogEntry | null
  onOpenChange: (open: boolean) => void
}

function PropertiesBlock({
  title,
  data,
}: {
  title: string
  data: Record<string, unknown> | undefined
}) {
  if (!data || Object.keys(data).length === 0) {
    return null
  }

  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <pre className="max-h-56 overflow-auto rounded-lg bg-muted p-3 text-start text-xs">
        {JSON.stringify(data, null, 2)}
      </pre>
    </div>
  )
}

export function ActivityLogDetailsDialog({
  entry,
  onOpenChange,
}: ActivityLogDetailsDialogProps) {
  const { t } = useTranslation()

  return (
    <Dialog open={entry !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("activityLog.details.title")}</DialogTitle>
          <DialogDescription>{entry?.description}</DialogDescription>
        </DialogHeader>

        {entry ? (
          <div className="space-y-4">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">
                  {t("activityLog.columns.causer")}
                </dt>
                <dd className="font-medium">
                  {entry.causer?.name ?? t("activityLog.systemCauser")}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  {t("activityLog.columns.subject")}
                </dt>
                <dd className="font-medium">
                  {entry.subject?.label ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  {t("activityLog.columns.event")}
                </dt>
                <dd>
                  {entry.event ? (
                    <Badge variant="outline">{entry.event}</Badge>
                  ) : (
                    "—"
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">
                  {t("activityLog.columns.date")}
                </dt>
                <dd className="font-medium">{formatDateTime(entry.created_at)}</dd>
              </div>
            </dl>

            <PropertiesBlock
              title={t("activityLog.details.before")}
              data={entry.properties?.old}
            />
            <PropertiesBlock
              title={t("activityLog.details.after")}
              data={entry.properties?.attributes}
            />
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
