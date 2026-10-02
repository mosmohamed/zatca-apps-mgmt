import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
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
import { Textarea } from "@/components/ui/textarea"
import {
  useCreateNetworkOpsCategory,
  useUpdateNetworkOpsCategory,
} from "@/features/network-ops/hooks/use-network-ops"
import type { NetworkOpsCategory } from "@/features/network-ops/types/network-ops"
import {
  createNetworkOpsCategoryFormSchema,
  type NetworkOpsCategoryFormValues,
} from "@/features/network-ops/types/network-ops-schema"
import { getApiFieldErrors } from "@/lib/api-errors"

type NetworkOpsCategoryFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: NetworkOpsCategory | null
  /** Fixed parent for "add subcategory" flows; null/undefined means root category. */
  parentId?: number | null
  parentLabel?: string | null
}

const emptyValues: NetworkOpsCategoryFormValues = {
  name_en: "",
  name_ar: "",
  code: "",
  description: "",
  sort_order: 0,
  is_active: true,
}

function toFormValues(
  category?: NetworkOpsCategory | null
): NetworkOpsCategoryFormValues {
  if (!category) {
    return emptyValues
  }

  return {
    name_en: category.name_en,
    name_ar: category.name_ar,
    code: category.code,
    description: category.description ?? "",
    sort_order: category.sort_order,
    is_active: category.is_active,
  }
}

export function NetworkOpsCategoryFormDialog({
  open,
  onOpenChange,
  category = null,
  parentId = null,
  parentLabel = null,
}: NetworkOpsCategoryFormDialogProps) {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language.startsWith("ar")
  const isEdit = Boolean(category)
  const createMutation = useCreateNetworkOpsCategory()
  const updateMutation = useUpdateNetworkOpsCategory()

  const effectiveParentId = category ? category.parent_id : parentId
  const effectiveParentLabel = category
    ? category.parent
      ? isArabic
        ? category.parent.name_ar
        : category.parent.name_en
      : null
    : parentLabel

  const infraCategoryFormSchema = useMemo(
    () => createNetworkOpsCategoryFormSchema(t),
    [t]
  )

  const form = useForm<NetworkOpsCategoryFormValues>({
    resolver: zodResolver(infraCategoryFormSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(toFormValues(category))
    }
  }, [open, category, form])

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  async function onSubmit(values: NetworkOpsCategoryFormValues) {
    const payload = {
      ...values,
      description: values.description?.trim()
        ? values.description.trim()
        : null,
      parent_id: effectiveParentId ?? null,
    }

    try {
      if (isEdit && category) {
        await updateMutation.mutateAsync({ id: category.id, payload })
      } else {
        await createMutation.mutateAsync(payload)
      }
      onOpenChange(false)
      form.reset(emptyValues)
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error)
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, messages]) => {
          form.setError(field as keyof NetworkOpsCategoryFormValues, {
            message: messages[0],
          })
        })
      }
    }
  }

  const isSubcategory = effectiveParentId !== null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? isSubcategory
                ? t("networkOps.categories.form.editSubTitle")
                : t("networkOps.categories.form.editTitle")
              : isSubcategory
                ? t("networkOps.categories.form.createSubTitle")
                : t("networkOps.categories.form.createTitle")}
          </DialogTitle>
          <DialogDescription>
            {isSubcategory
              ? t("networkOps.categories.form.subDescription")
              : t("networkOps.categories.form.rootDescription")}
          </DialogDescription>
        </DialogHeader>

        {isSubcategory && effectiveParentLabel ? (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">
              {t("networkOps.categories.form.parentLabel")}
            </span>
            <Badge variant="secondary">{effectiveParentLabel}</Badge>
          </div>
        ) : null}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name_en"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t("networkOps.categories.form.nameEn")}
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Networking" {...field} />
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
                      {t("networkOps.categories.form.nameAr")}
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="الشبكات" {...field} />
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
                  <FormLabel>
                    {t("networkOps.categories.form.code")}
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="networking" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("networkOps.categories.form.description")}
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder={t(
                        "networkOps.categories.form.descriptionPlaceholder"
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
              name="sort_order"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {t("networkOps.categories.form.sortOrder")}
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
                    {t("networkOps.categories.form.isActive")}
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
                  ? t("networkOps.categories.form.saving")
                  : isEdit
                    ? t("networkOps.categories.form.updateSubmit")
                    : t("networkOps.categories.form.createSubmit")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
