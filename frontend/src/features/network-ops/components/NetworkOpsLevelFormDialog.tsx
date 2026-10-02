import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  useCreateNetworkOpsLevel,
  useUpdateNetworkOpsLevel,
} from "@/features/network-ops/hooks/use-network-ops"
import type { NetworkOpsLevel } from "@/features/network-ops/types/network-ops"
import {
  createNetworkOpsLevelFormSchema,
  type NetworkOpsLevelFormValues,
} from "@/features/network-ops/types/network-ops-schema"
import { getApiFieldErrors } from "@/lib/api-errors"

type NetworkOpsLevelFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  level?: NetworkOpsLevel | null
}

const emptyValues: NetworkOpsLevelFormValues = {
  name_en: "",
  name_ar: "",
  code: "",
  note_en: "",
  note_ar: "",
  sort_order: 0,
  is_active: true,
}

function toFormValues(level?: NetworkOpsLevel | null): NetworkOpsLevelFormValues {
  if (!level) {
    return emptyValues
  }

  return {
    name_en: level.name_en,
    name_ar: level.name_ar,
    code: level.code,
    note_en: level.note_en ?? "",
    note_ar: level.note_ar ?? "",
    sort_order: level.sort_order,
    is_active: level.is_active,
  }
}

export function NetworkOpsLevelFormDialog({
  open,
  onOpenChange,
  level = null,
}: NetworkOpsLevelFormDialogProps) {
  const { t } = useTranslation()
  const isEdit = Boolean(level)
  const createMutation = useCreateNetworkOpsLevel()
  const updateMutation = useUpdateNetworkOpsLevel()

  const infraLevelFormSchema = useMemo(
    () => createNetworkOpsLevelFormSchema(t),
    [t]
  )

  const form = useForm<NetworkOpsLevelFormValues>({
    resolver: zodResolver(infraLevelFormSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(toFormValues(level))
    }
  }, [open, level, form])

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  async function onSubmit(values: NetworkOpsLevelFormValues) {
    const payload = {
      ...values,
      note_en: values.note_en?.trim() ? values.note_en.trim() : null,
      note_ar: values.note_ar?.trim() ? values.note_ar.trim() : null,
    }

    try {
      if (isEdit && level) {
        await updateMutation.mutateAsync({ id: level.id, payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      onOpenChange(false)
      form.reset(emptyValues)
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error)
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, messages]) => {
          form.setError(field as keyof NetworkOpsLevelFormValues, {
            message: messages[0],
          })
        })
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? t("networkOps.levels.form.editTitle")
              : t("networkOps.levels.form.createTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t("networkOps.levels.form.editDescription")
              : t("networkOps.levels.form.createDescription")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name_en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("networkOps.levels.form.nameEn")}
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="L1 Support" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="name_ar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("networkOps.levels.form.nameAr")}
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="الدعم من المستوى الأول" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("networkOps.levels.form.code")}</FormLabel>
                  <FormControl>
                    <Input placeholder="l1" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="note_en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("networkOps.levels.form.noteEn")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          "networkOps.levels.form.notePlaceholder"
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="note_ar"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("networkOps.levels.form.noteAr")}
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          "networkOps.levels.form.notePlaceholder"
                        )}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="sort_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("networkOps.levels.form.sortOrder")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      {...field}
                      onChange={(event) =>
                        field.onChange(event.target.valueAsNumber || 0)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3 space-y-0 rounded-lg border border-stroke p-3">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  </FormControl>
                  <FormLabel className="font-normal">
                    {t("networkOps.levels.form.isActive")}
                  </FormLabel>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? t("networkOps.levels.form.saving")
                  : isEdit
                    ? t("networkOps.levels.form.updateSubmit")
                    : t("networkOps.levels.form.createSubmit")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
