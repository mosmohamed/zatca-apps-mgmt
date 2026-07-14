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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useCreateTechnology,
  useUpdateTechnology,
} from "@/features/technologies/hooks/use-technologies"
import type { Technology } from "@/features/technologies/types/technology"
import { TECHNOLOGY_CATEGORIES } from "@/features/technologies/types/technology"
import {
  createTechnologyFormSchema,
  type TechnologyFormValues,
} from "@/features/technologies/types/technology-schema"
import { getApiFieldErrors } from "@/lib/api-errors"

type TechnologyFormDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  technology?: Technology | null
}

const emptyValues: TechnologyFormValues = {
  name: "",
  category: "Frontend",
  description: "",
  is_active: true,
}

function toFormValues(technology?: Technology | null): TechnologyFormValues {
  if (!technology) {
    return emptyValues
  }

  return {
    name: technology.name,
    category: (TECHNOLOGY_CATEGORIES.includes(
      technology.category as (typeof TECHNOLOGY_CATEGORIES)[number]
    )
      ? technology.category
      : "Other") as TechnologyFormValues["category"],
    description: technology.description ?? "",
    is_active: technology.is_active,
  }
}

export function TechnologyFormDialog({
  open,
  onOpenChange,
  technology = null,
}: TechnologyFormDialogProps) {
  const { t } = useTranslation()
  const isEdit = Boolean(technology)
  const createMutation = useCreateTechnology()
  const updateMutation = useUpdateTechnology()

  const technologyFormSchema = useMemo(
    () => createTechnologyFormSchema(t),
    [t]
  )

  const form = useForm<TechnologyFormValues>({
    resolver: zodResolver(technologyFormSchema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(toFormValues(technology))
    }
  }, [open, technology, form])

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  async function onSubmit(values: TechnologyFormValues) {
    const payload = {
      name: values.name,
      category: values.category,
      description: values.description || null,
      is_active: values.is_active,
    }

    try {
      if (isEdit && technology) {
        await updateMutation.mutateAsync({
          id: technology.id,
          payload,
        })
      } else {
        await createMutation.mutateAsync(payload)
      }
      onOpenChange(false)
      form.reset(emptyValues)
    } catch (error) {
      const fieldErrors = getApiFieldErrors(error)
      if (fieldErrors) {
        Object.entries(fieldErrors).forEach(([field, messages]) => {
          form.setError(field as keyof TechnologyFormValues, {
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
              ? t("technologies.form.editTitle")
              : t("technologies.form.createTitle")}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t("technologies.form.editDescription")
              : t("technologies.form.createDescription")}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("technologies.form.name")}</FormLabel>
                  <FormControl>
                    <Input placeholder="React" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("technologies.form.category")}</FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={t("technologies.form.category")}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {TECHNOLOGY_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {t(`technologies.categories.${category}`)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("technologies.form.description")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("technologies.form.descriptionPlaceholder")}
                      {...field}
                      value={field.value ?? ""}
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
                    {t("technologies.form.isActive")}
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
                  ? t("technologies.form.saving")
                  : isEdit
                    ? t("technologies.form.updateSubmit")
                    : t("technologies.form.createSubmit")}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
