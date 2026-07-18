import { useEffect, useMemo } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useCreateRoleMapping,
  useUpdateRoleMapping,
} from "@/features/authentication-settings/hooks/use-authentication-settings"
import type {
  IdentityProvider,
  RoleMapping,
} from "@/features/authentication-settings/types/authentication-settings"
import {
  createRoleMappingSchema,
  type RoleMappingFormValues,
} from "@/features/authentication-settings/types/authentication-settings-schema"
import { useRoles } from "@/features/roles/hooks/use-roles"
import { getApiFieldErrors } from "@/lib/api-errors"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  mapping: RoleMapping | null
  providers: IdentityProvider[]
}

const emptyValues: RoleMappingFormValues = {
  identity_provider_id: 0,
  claim_name: "groups",
  external_value: "",
  role_id: 0,
  priority: 100,
  is_enabled: true,
}

export function RoleMappingFormDialog({
  open,
  onOpenChange,
  mapping,
  providers,
}: Props) {
  const { t } = useTranslation()
  const schema = useMemo(() => createRoleMappingSchema(t), [t])
  const rolesQuery = useRoles()
  const createMutation = useCreateRoleMapping()
  const updateMutation = useUpdateRoleMapping()
  const form = useForm<RoleMappingFormValues>({
    resolver: zodResolver(schema),
    defaultValues: emptyValues,
  })

  useEffect(() => {
    if (open) {
      form.reset(
        mapping
          ? {
              identity_provider_id: mapping.identity_provider_id,
              claim_name: mapping.claim_name,
              external_value: mapping.external_value,
              role_id: mapping.role_id,
              priority: mapping.priority,
              is_enabled: mapping.is_enabled,
            }
          : { ...emptyValues, identity_provider_id: providers[0]?.id ?? 0 }
      )
    }
  }, [open, mapping, providers, form])

  const busy = createMutation.isPending || updateMutation.isPending

  async function submit(values: RoleMappingFormValues) {
    try {
      if (mapping) {
        await updateMutation.mutateAsync({ id: mapping.id, payload: values })
      } else {
        await createMutation.mutateAsync({ payload: values })
      }
      onOpenChange(false)
    } catch (error) {
      Object.entries(getApiFieldErrors(error) ?? {}).forEach(([field, messages]) =>
        form.setError(field as keyof RoleMappingFormValues, { message: messages[0] })
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {t(mapping ? "authentication.mappings.edit" : "authentication.mappings.create")}
          </DialogTitle>
          <DialogDescription>{t("authentication.mappings.formDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{t("authentication.fields.provider")}</Label>
              <Controller
                control={form.control}
                name="identity_provider_id"
                render={({ field }) => (
                  <Select value={String(field.value || "")} onValueChange={(v) => field.onChange(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {providers.map((provider) => (
                        <SelectItem key={provider.id} value={String(provider.id)}>
                          {provider.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-sm text-destructive">{form.formState.errors.identity_provider_id?.message}</p>
            </div>
            <div className="space-y-2">
              <Label>{t("authentication.fields.role")}</Label>
              <Controller
                control={form.control}
                name="role_id"
                render={({ field }) => (
                  <Select value={String(field.value || "")} onValueChange={(v) => field.onChange(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(rolesQuery.data ?? []).map((role) => (
                        <SelectItem key={role.id} value={String(role.id)}>{role.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-sm text-destructive">{form.formState.errors.role_id?.message}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mapping-claim">{t("authentication.fields.claimName")}</Label>
              <Input id="mapping-claim" dir="ltr" {...form.register("claim_name")} />
              <p className="text-sm text-destructive">{form.formState.errors.claim_name?.message}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mapping-value">{t("authentication.fields.externalValue")}</Label>
              <Input id="mapping-value" dir="ltr" {...form.register("external_value")} />
              <p className="text-sm text-destructive">{form.formState.errors.external_value?.message}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="mapping-priority">{t("authentication.fields.priority")}</Label>
              <Input
                id="mapping-priority"
                type="number"
                {...form.register("priority", { valueAsNumber: true })}
              />
              <p className="text-sm text-destructive">{form.formState.errors.priority?.message}</p>
            </div>
            <Controller
              control={form.control}
              name="is_enabled"
              render={({ field }) => (
                <label className="flex items-center gap-3 self-end rounded-lg border p-3">
                  <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
                  <span className="text-sm font-medium">{t("authentication.fields.enabled")}</span>
                </label>
              )}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={busy || rolesQuery.isLoading}>
              {busy ? t("settings.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
