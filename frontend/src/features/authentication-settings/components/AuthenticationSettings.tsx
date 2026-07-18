import { useMemo, useState } from "react"
import { Controller, useFormContext } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { CheckCircle2, CircleAlert, FlaskConical, Pencil, Plus, Trash2 } from "lucide-react"

import { ConfirmAlertDialog } from "@/components/ConfirmAlertDialog"
import {
  EnterpriseDataTable,
  type EnterpriseDataTableColumn,
} from "@/components/EnterpriseDataTable"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ProviderFormDialog } from "@/features/authentication-settings/components/ProviderFormDialog"
import { RoleMappingFormDialog } from "@/features/authentication-settings/components/RoleMappingFormDialog"
import {
  useDeleteProvider,
  useDeleteRoleMapping,
  useIdentityProviders,
  useRoleMappings,
  useTestProvider,
  useUpdateProvider,
  useUpdateRoleMapping,
} from "@/features/authentication-settings/hooks/use-authentication-settings"
import {
  SYNC_FIELD_KEYS,
  type IdentityProvider,
  type IdentityProviderPayload,
  type ProviderConnectionTest,
  type RoleMapping,
} from "@/features/authentication-settings/types/authentication-settings"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useRoles } from "@/features/roles/hooks/use-roles"
import type { SettingsFormValues } from "@/features/settings/types/settings-schema"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { cn } from "@/lib/utils"

const AUTHENTICATION_MODES = ["local", "sso", "hybrid"] as const

function AuthenticationMethodsSettings() {
  const { t } = useTranslation()
  const form = useFormContext<SettingsFormValues>()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("authentication.methods.title")}</CardTitle>
        <CardDescription>{t("authentication.methods.description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Controller
          control={form.control}
          name="authentication_mode"
          render={({ field }) => (
            <div className="grid gap-3 md:grid-cols-3" role="radiogroup">
              {AUTHENTICATION_MODES.map((mode) => (
                <label
                  key={mode}
                  className={cn(
                    "cursor-pointer rounded-xl border p-4 transition-colors",
                    field.value === mode && "border-primary bg-primary/[0.04]"
                  )}
                >
                  <input
                    type="radio"
                    name={field.name}
                    value={mode}
                    checked={field.value === mode}
                    onChange={() => field.onChange(mode)}
                    className="me-2 accent-primary"
                  />
                  <span className="font-medium">
                    {t(`authentication.methods.${mode}.title`)}
                  </span>
                  <span className="mt-2 block text-sm text-muted-foreground">
                    {t(`authentication.methods.${mode}.description`)}
                  </span>
                </label>
              ))}
            </div>
          )}
        />
      </CardContent>
    </Card>
  )
}

function GeneralAuthenticationSettings() {
  const { t } = useTranslation()
  const form = useFormContext<SettingsFormValues>()
  const roles = useRoles()

  const toggle = (
    name:
      | "enabled"
      | "auto_provisioning"
      | "allow_email_account_linking"
      | "require_verified_email_for_linking"
      | "automatic_department_mapping"
      | "update_roles_on_login"
      | "update_user_information_on_login",
    description: string
  ) => (
    <Controller
      control={form.control}
      name={`authentication_role_mapping.${name}`}
      render={({ field }) => (
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3">
          <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
          <span>
            <span className="block text-sm font-medium">{t(`authentication.general.${name}`)}</span>
            <span className="text-xs text-muted-foreground">{description}</span>
          </span>
        </label>
      )}
    />
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("authentication.general.title")}</CardTitle>
        <CardDescription>{t("authentication.general.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-2">
          {toggle("enabled", t("authentication.general.enabledHint"))}
          {toggle("auto_provisioning", t("authentication.general.autoProvisioningHint"))}
          {toggle(
            "allow_email_account_linking",
            t("authentication.general.allowEmailAccountLinkingHint")
          )}
          {toggle(
            "require_verified_email_for_linking",
            t("authentication.general.requireVerifiedEmailForLinkingHint")
          )}
          {toggle("automatic_department_mapping", t("authentication.general.departmentMappingHint"))}
          {toggle("update_roles_on_login", t("authentication.general.updateRolesHint"))}
          {toggle(
            "update_user_information_on_login",
            t("authentication.general.updateInformationHint")
          )}
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="space-y-2">
            <Label htmlFor="department-claim">{t("authentication.fields.departmentClaim")}</Label>
            <Input
              id="department-claim"
              dir="ltr"
              {...form.register("authentication_role_mapping.department_claim")}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("authentication.fields.defaultRole")}</Label>
            <Controller
              control={form.control}
              name="authentication_role_mapping.default_role_id"
              render={({ field }) => (
                <Select
                  value={field.value ? String(field.value) : "none"}
                  onValueChange={(v) => field.onChange(v === "none" ? null : Number(v))}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("authentication.general.noDefaultRole")}</SelectItem>
                    {(roles.data ?? []).map((role) => (
                      <SelectItem key={role.id} value={String(role.id)}>{role.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("authentication.fields.defaultStatus")}</Label>
            <Controller
              control={form.control}
              name="authentication_role_mapping.default_user_status"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">{t("common.active")}</SelectItem>
                    <SelectItem value="inactive">{t("common.inactive")}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("authentication.fields.multiMatch")}</Label>
            <Controller
              control={form.control}
              name="authentication_role_mapping.multi_match_strategy"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple">{t("authentication.general.multipleRoles")}</SelectItem>
                    <SelectItem value="highest_priority">{t("authentication.general.highestPriority")}</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
        <div>
          <h4 className="mb-1 text-sm font-semibold">{t("authentication.general.syncFields")}</h4>
          <p className="mb-3 text-xs text-muted-foreground">{t("authentication.general.syncFieldsHint")}</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {SYNC_FIELD_KEYS.map((key) => (
              <Controller
                key={key}
                control={form.control}
                name={`authentication_role_mapping.sync_fields.${key}`}
                render={({ field }) => (
                  <label className="flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2">
                    <Checkbox checked={field.value} onCheckedChange={(v) => field.onChange(v === true)} />
                    <span className="text-sm">{t(`authentication.syncFields.${key}`)}</span>
                  </label>
                )}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function AuthenticationSettings() {
  const { t } = useTranslation()
  const { can } = useAuth()
  const canCreateProvider = can("identity-providers.create")
  const canUpdateProvider = can("identity-providers.update")
  const canDeleteProvider = can("identity-providers.delete")
  const canViewProviders = can("identity-providers.view")
  const canCreateMapping = can("role-mappings.create")
  const canUpdateMapping = can("role-mappings.update")
  const canDeleteMapping = can("role-mappings.delete")
  const canViewMappings = can("role-mappings.view")

  const [providerSearch, setProviderSearch] = useState("")
  const [providerPage, setProviderPage] = useState(1)
  const [providerSort, setProviderSort] = useState("-created_at")
  const [mappingSearch, setMappingSearch] = useState("")
  const [mappingPage, setMappingPage] = useState(1)
  const [mappingSort, setMappingSort] = useState("priority")
  const [providerDialog, setProviderDialog] = useState(false)
  const [mappingDialog, setMappingDialog] = useState(false)
  const [editingProvider, setEditingProvider] = useState<IdentityProvider | null>(null)
  const [editingMapping, setEditingMapping] = useState<RoleMapping | null>(null)
  const [deleteProvider, setDeleteProvider] = useState<IdentityProvider | null>(null)
  const [deleteMapping, setDeleteMapping] = useState<RoleMapping | null>(null)
  const [testResult, setTestResult] = useState<ProviderConnectionTest | null>(null)

  const providerQuery = useIdentityProviders({
    page: providerPage,
    per_page: 15,
    search: useDebouncedValue(providerSearch, 350),
    sort: providerSort,
  })
  const providerOptionsQuery = useIdentityProviders({ page: 1, per_page: 100, sort: "name" })
  const mappingQuery = useRoleMappings({
    page: mappingPage,
    per_page: 15,
    search: useDebouncedValue(mappingSearch, 350),
    sort: mappingSort,
  })
  const updateProvider = useUpdateProvider()
  const testProvider = useTestProvider()
  const removeProvider = useDeleteProvider()
  const updateMapping = useUpdateRoleMapping()
  const removeMapping = useDeleteRoleMapping()

  const providerColumns = useMemo<EnterpriseDataTableColumn<IdentityProvider>[]>(() => {
    const columns: EnterpriseDataTableColumn<IdentityProvider>[] = [
      { id: "name", header: t("authentication.fields.name"), sortable: true, sortKey: "name", cell: (row) => <div><div className="font-medium">{row.name}</div><code className="text-xs text-muted-foreground">{row.slug}</code></div> },
      { id: "protocol", header: t("authentication.fields.protocol"), cell: (row) => <Badge variant="outline">{row.protocol.toUpperCase()}</Badge> },
      { id: "enabled", header: t("common.status"), sortable: true, sortKey: "enabled", cell: (row) => canUpdateProvider ? <Checkbox aria-label={`${t("common.edit")} ${row.name}`} checked={row.is_enabled} disabled={updateProvider.isPending} onCheckedChange={() => void updateProvider.mutateAsync({ id: row.id, payload: { name: row.name, slug: row.slug, protocol: row.protocol, is_enabled: !row.is_enabled, configuration: (row.configuration_safe ?? row.configuration ?? {}) as IdentityProviderPayload["configuration"] } })} /> : <Badge variant={row.is_enabled ? "default" : "muted"}>{t(row.is_enabled ? "common.active" : "common.inactive")}</Badge> },
      { id: "last_successful_auth_at", header: t("authentication.fields.lastSuccessfulAuth"), cell: (row) => row.last_successful_auth_at ? <span className="text-xs text-muted-foreground" dir="ltr">{row.last_successful_auth_at}</span> : <span className="text-xs text-muted-foreground">—</span> },
    ]
    if (canUpdateProvider || canDeleteProvider) columns.push({
      id: "actions", header: <span className="block text-end">{t("common.actions")}</span>, className: "text-end", alwaysVisible: true,
      cell: (row) => <div className="inline-flex gap-1">{canUpdateProvider ? <><Button type="button" variant="ghost" size="icon-sm" aria-label={`${t("authentication.providers.test")} ${row.name}`} title={t("authentication.providers.test")} disabled={testProvider.isPending} onClick={() => { void testProvider.mutateAsync({ id: row.id }).then(setTestResult).catch(() => undefined) }}><FlaskConical /></Button><Button type="button" variant="ghost" size="icon-sm" aria-label={`${t("common.edit")} ${row.name}`} onClick={() => { setEditingProvider(row); setProviderDialog(true) }}><Pencil /></Button></> : null}{canDeleteProvider ? <Button type="button" variant="ghost" size="icon-sm" aria-label={`${t("common.delete")} ${row.name}`} onClick={() => setDeleteProvider(row)}><Trash2 /></Button> : null}</div>,
    })
    return columns
  }, [t, canUpdateProvider, canDeleteProvider, updateProvider, testProvider])

  const mappingColumns = useMemo<EnterpriseDataTableColumn<RoleMapping>[]>(() => {
    const columns: EnterpriseDataTableColumn<RoleMapping>[] = [
      { id: "provider", header: t("authentication.fields.provider"), cell: (row) => row.provider?.name ?? row.identity_provider?.name ?? "—" },
      { id: "claim", header: t("authentication.fields.claimName"), cell: (row) => <code className="text-xs">{row.claim_name}</code> },
      { id: "value", header: t("authentication.fields.externalValue"), cell: (row) => row.external_value },
      { id: "role", header: t("authentication.fields.role"), cell: (row) => <Badge variant="outline">{row.role?.name ?? row.role_name ?? "—"}</Badge> },
      { id: "priority", header: t("authentication.fields.priority"), sortable: true, sortKey: "priority", cell: (row) => row.priority },
      { id: "enabled", header: t("common.status"), sortable: true, sortKey: "enabled", cell: (row) => canUpdateMapping ? <Checkbox aria-label={`${t("common.edit")} ${row.external_value}`} checked={row.is_enabled} disabled={updateMapping.isPending} onCheckedChange={() => void updateMapping.mutateAsync({ id: row.id, payload: { identity_provider_id: row.identity_provider_id, claim_name: row.claim_name, external_value: row.external_value, role_id: row.role_id, priority: row.priority, is_enabled: !row.is_enabled } })} /> : <Badge variant={row.is_enabled ? "default" : "muted"}>{t(row.is_enabled ? "common.active" : "common.inactive")}</Badge> },
    ]
    if (canUpdateMapping || canDeleteMapping) columns.push({
      id: "actions", header: <span className="block text-end">{t("common.actions")}</span>, className: "text-end", alwaysVisible: true,
      cell: (row) => <div className="inline-flex gap-1">{canUpdateMapping ? <Button type="button" variant="ghost" size="icon-sm" aria-label={`${t("common.edit")} ${row.external_value}`} onClick={() => { setEditingMapping(row); setMappingDialog(true) }}><Pencil /></Button> : null}{canDeleteMapping ? <Button type="button" variant="ghost" size="icon-sm" aria-label={`${t("common.delete")} ${row.external_value}`} onClick={() => setDeleteMapping(row)}><Trash2 /></Button> : null}</div>,
    })
    return columns
  }, [t, canUpdateMapping, canDeleteMapping, updateMapping])

  const denied = (label: string) => (
    <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">{t("authentication.permissionDenied", { resource: label })}</CardContent></Card>
  )

  return (
    <Tabs defaultValue="methods">
      <TabsList className="h-auto w-full justify-start overflow-x-auto">
        <TabsTrigger value="methods">{t("authentication.tabs.methods")}</TabsTrigger>
        <TabsTrigger value="provisioning">{t("authentication.tabs.provisioning")}</TabsTrigger>
        <TabsTrigger value="providers">{t("authentication.tabs.providers")}</TabsTrigger>
        <TabsTrigger value="mappings">{t("authentication.tabs.mappings")}</TabsTrigger>
      </TabsList>
      <TabsContent value="methods"><AuthenticationMethodsSettings /></TabsContent>
      <TabsContent value="provisioning"><GeneralAuthenticationSettings /></TabsContent>
      <TabsContent value="providers">
        {!canViewProviders ? denied(t("authentication.tabs.providers")) : (
          <>
            {providerQuery.isError ? <p role="alert" className="mb-3 rounded-lg border border-destructive/30 p-3 text-sm text-destructive">{t("authentication.loadFailed")} <Button type="button" variant="link" onClick={() => void providerQuery.refetch()}>{t("errors.tryAgain")}</Button></p> : null}
            <EnterpriseDataTable
              columns={providerColumns}
              data={providerQuery.data?.items ?? []}
              rowKey={(row) => row.id}
              loading={providerQuery.isLoading}
              search={providerSearch}
              onSearchChange={(value) => { setProviderSearch(value); setProviderPage(1) }}
              sort={providerSort}
              onSortChange={setProviderSort}
              pagination={providerQuery.data?.pagination}
              onPageChange={setProviderPage}
              searchPlaceholder={t("authentication.providers.search")}
              emptyTitle={t("authentication.providers.empty")}
              toolbar={canCreateProvider ? <Button type="button" size="sm" onClick={() => { setEditingProvider(null); setProviderDialog(true) }}><Plus />{t("authentication.providers.create")}</Button> : null}
            />
          </>
        )}
      </TabsContent>
      <TabsContent value="mappings">
        {!canViewMappings ? denied(t("authentication.tabs.mappings")) : (
          <>
            {mappingQuery.isError ? <p role="alert" className="mb-3 rounded-lg border border-destructive/30 p-3 text-sm text-destructive">{t("authentication.loadFailed")} <Button type="button" variant="link" onClick={() => void mappingQuery.refetch()}>{t("errors.tryAgain")}</Button></p> : null}
            <EnterpriseDataTable
              columns={mappingColumns}
              data={mappingQuery.data?.items ?? []}
              rowKey={(row) => row.id}
              loading={mappingQuery.isLoading}
              search={mappingSearch}
              onSearchChange={(value) => { setMappingSearch(value); setMappingPage(1) }}
              sort={mappingSort}
              onSortChange={setMappingSort}
              pagination={mappingQuery.data?.pagination}
              onPageChange={setMappingPage}
              searchPlaceholder={t("authentication.mappings.search")}
              emptyTitle={t("authentication.mappings.empty")}
              toolbar={canCreateMapping ? <Button type="button" size="sm" onClick={() => { setEditingMapping(null); setMappingDialog(true) }} disabled={(providerOptionsQuery.data?.items.length ?? 0) === 0}><Plus />{t("authentication.mappings.create")}</Button> : null}
            />
          </>
        )}
      </TabsContent>
      <ProviderFormDialog open={providerDialog} onOpenChange={setProviderDialog} provider={editingProvider} />
      <RoleMappingFormDialog open={mappingDialog} onOpenChange={setMappingDialog} mapping={editingMapping} providers={providerOptionsQuery.data?.items ?? []} />
      <ConfirmAlertDialog open={deleteProvider !== null} onOpenChange={(open) => { if (!open) setDeleteProvider(null) }} title={t("authentication.providers.deleteTitle")} description={t("authentication.providers.deleteConfirm", { name: deleteProvider?.name })} confirming={removeProvider.isPending} onConfirm={async () => { if (deleteProvider) await removeProvider.mutateAsync({ id: deleteProvider.id }) }} />
      <ConfirmAlertDialog open={deleteMapping !== null} onOpenChange={(open) => { if (!open) setDeleteMapping(null) }} title={t("authentication.mappings.deleteTitle")} description={t("authentication.mappings.deleteConfirm", { value: deleteMapping?.external_value })} confirming={removeMapping.isPending} onConfirm={async () => { if (deleteMapping) await removeMapping.mutateAsync({ id: deleteMapping.id }) }} />
      <Dialog open={testResult !== null} onOpenChange={(open) => { if (!open) setTestResult(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("authentication.providers.testResults")}</DialogTitle>
            <DialogDescription>{testResult?.message}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            {testResult?.checks.map((check, index) => {
              const passed = check.status === "success" || check.status === "passed"
              return (
                <div key={`${check.name}-${index}`} className="flex items-start gap-3 rounded-lg border p-3">
                  {passed ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" /> : <CircleAlert className="mt-0.5 size-5 shrink-0 text-destructive" />}
                  <div><p className="text-sm font-medium">{check.name}</p><p className="text-xs text-muted-foreground">{check.message}</p></div>
                </div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </Tabs>
  )
}
