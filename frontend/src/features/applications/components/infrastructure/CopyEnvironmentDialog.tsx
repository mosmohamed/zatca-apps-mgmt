import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { AlertTriangle, Copy } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  environmentLabel,
  type ApplicationInfrastructureEnvironment,
  type CopyEnvironmentPayload,
} from "@/features/applications/types/infrastructure"

type CopyEnvironmentDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  environments: ApplicationInfrastructureEnvironment[]
  targetEnvironmentId: number
  isCopying: boolean
  onCopy: (payload: CopyEnvironmentPayload) => Promise<unknown>
}

export function CopyEnvironmentDialog({
  open,
  onOpenChange,
  environments,
  targetEnvironmentId,
  isCopying,
  onCopy,
}: CopyEnvironmentDialogProps) {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language.startsWith("ar")
  const [sourceId, setSourceId] = useState<string>("")

  const sources = environments.filter(
    (entry) =>
      entry.profile !== null && entry.environment.id !== targetEnvironmentId
  )
  const target = environments.find(
    (entry) => entry.environment.id === targetEnvironmentId
  )
  const willOverwrite = target?.profile !== null && target !== undefined

  useEffect(() => {
    if (open) {
      setSourceId("")
    }
  }, [open])

  async function handleCopy() {
    if (!sourceId) {
      return
    }

    await onCopy({
      source_environment_id: Number(sourceId),
      target_environment_id: targetEnvironmentId,
      overwrite: willOverwrite,
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {t("applications.infrastructure.copy.title")}
          </DialogTitle>
          <DialogDescription>
            {t("applications.infrastructure.copy.description", {
              target: target
                ? environmentLabel(target.environment, isArabic)
                : "",
            })}
          </DialogDescription>
        </DialogHeader>

        {sources.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stroke bg-muted/20 px-3 py-4 text-sm text-muted-foreground">
            {t("applications.infrastructure.copy.noSources")}
          </p>
        ) : (
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="copy-source-environment">
                {t("applications.infrastructure.copy.sourceLabel")}
              </Label>
              <Select value={sourceId} onValueChange={setSourceId}>
                <SelectTrigger id="copy-source-environment" className="w-full">
                  <SelectValue
                    placeholder={t(
                      "applications.infrastructure.copy.sourcePlaceholder"
                    )}
                  />
                </SelectTrigger>
                <SelectContent>
                  {sources.map((entry) => (
                    <SelectItem
                      key={entry.environment.id}
                      value={String(entry.environment.id)}
                    >
                      {entry.environment.code} ·{" "}
                      {environmentLabel(entry.environment, isArabic)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {willOverwrite ? (
              <div className="flex gap-2 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-sm text-destructive">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                <p>
                  {t("applications.infrastructure.copy.overwriteWarning", {
                    target: target
                      ? environmentLabel(target.environment, isArabic)
                      : "",
                  })}
                </p>
              </div>
            ) : null}
          </div>
        )}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isCopying}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="button"
            variant={willOverwrite ? "destructive" : "default"}
            onClick={() => void handleCopy()}
            disabled={!sourceId || isCopying || sources.length === 0}
          >
            <Copy />
            {isCopying
              ? t("applications.infrastructure.copy.copying")
              : t("applications.infrastructure.copy.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
