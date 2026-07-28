import type { Control, FieldPath } from "react-hook-form"
import { useTranslation } from "react-i18next"

import { Checkbox } from "@/components/ui/checkbox"
import {
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
import { Textarea } from "@/components/ui/textarea"
import {
  defaultFieldMaxLength,
  type InfraFieldDef,
} from "@/features/applications/types/infrastructure-fields"
import type { EnvironmentProfileFormValues } from "@/features/applications/types/infrastructure-schema"
import {
  infraFieldLabel,
  infraOptionLabel,
} from "@/features/applications/utils/infrastructure-labels"
import { cn } from "@/lib/utils"

const CLEAR_OPTION = "__none__"

type InfraFieldInputProps = {
  control: Control<EnvironmentProfileFormValues>
  name: string
  definition: InfraFieldDef
  disabled?: boolean
}

function toInputValue(value: unknown): string {
  if (value === null || value === undefined) {
    return ""
  }

  return String(value)
}

export function InfraFieldInput({
  control,
  name,
  definition,
  disabled = false,
}: InfraFieldInputProps) {
  const { t } = useTranslation()
  const label = infraFieldLabel(t, definition.name)
  const maxLength = defaultFieldMaxLength(definition)

  return (
    <FormField
      control={control}
      name={name as FieldPath<EnvironmentProfileFormValues>}
      render={({ field }) => {
        if (definition.kind === "boolean") {
          return (
            <FormItem className="flex flex-row items-center gap-2.5 rounded-lg border border-border/60 bg-muted/20 px-3 py-2.5">
              <FormControl>
                <Checkbox
                  checked={field.value === true}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  disabled={disabled}
                  onBlur={field.onBlur}
                />
              </FormControl>
              <FormLabel className="!m-0 cursor-pointer text-xs font-medium">
                {label}
              </FormLabel>
              <FormMessage />
            </FormItem>
          )
        }

        return (
          <FormItem className={cn(definition.wide && "sm:col-span-2 xl:col-span-3")}>
            <FormLabel className="text-xs font-medium text-muted-foreground">
              {label}
            </FormLabel>
            <FormControl>
              {definition.kind === "notes" ? (
                <Textarea
                  rows={3}
                  maxLength={maxLength}
                  disabled={disabled}
                  value={toInputValue(field.value)}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              ) : definition.kind === "select" ? (
                <Select
                  value={
                    toInputValue(field.value) === ""
                      ? CLEAR_OPTION
                      : toInputValue(field.value)
                  }
                  onValueChange={(value) =>
                    field.onChange(value === CLEAR_OPTION ? "" : value)
                  }
                  disabled={disabled}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={label} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={CLEAR_OPTION}>
                      {t("applications.infrastructure.notSpecified")}
                    </SelectItem>
                    {(definition.options ?? []).map((option) => (
                      <SelectItem key={option} value={option}>
                        {infraOptionLabel(t, definition.name, option)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  type={
                    definition.kind === "date"
                      ? "date"
                      : definition.kind === "port" ||
                          definition.kind === "number"
                        ? "number"
                        : "text"
                  }
                  inputMode={
                    definition.kind === "port" || definition.kind === "number"
                      ? "numeric"
                      : undefined
                  }
                  min={definition.kind === "port" ? 1 : undefined}
                  max={definition.kind === "port" ? 65535 : undefined}
                  maxLength={
                    definition.kind === "port" ||
                    definition.kind === "number" ||
                    definition.kind === "date"
                      ? undefined
                      : maxLength
                  }
                  disabled={disabled}
                  value={toInputValue(field.value)}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              )}
            </FormControl>
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}
