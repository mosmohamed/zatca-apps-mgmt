import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Lock, Pencil, Plus, Save, Trash2, Users as UsersIcon } from "lucide-react"

import { ConfirmAlertDialog } from "@/components/ConfirmAlertDialog"
import { EmptyState } from "@/components/EmptyState"
import { LoadingSkeleton } from "@/components/LoadingSkeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PermissionMatrix } from "@/features/roles/components/PermissionMatrix"
import { RoleFormDialog } from "@/features/roles/components/RoleFormDialog"
import { RoleMembersPanel } from "@/features/roles/components/RoleMembersPanel"
import {
  useDeleteRole,
  usePermissionsCatalog,
  useRoles,
  useSyncRolePermissions,
} from "@/features/roles/hooks/use-roles"
import type { Role } from "@/features/roles/types/role"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { cn } from "@/lib/utils"

export function RolesPage() {
  const { t } = useTranslation()
  const { can, isSuperAdmin } = useAuth()
  const canManageRoles = isSuperAdmin || can("roles.update")

  const rolesQuery = useRoles()
  const permissionsQuery = usePermissionsCatalog()
  const syncMutation = useSyncRolePermissions()
  const deleteMutation = useDeleteRole()

  const roles = rolesQuery.data ?? []
  const permissions = permissionsQuery.data ?? []

  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<"permissions" | "members">(
    "permissions"
  )
  const [checkedPermissions, setCheckedPermissions] = useState<Set<string>>(
    new Set()
  )
  const [formOpen, setFormOpen] = useState(false)
  const [editingRole, setEditingRole] = useState<Role | null>(null)
  const [pendingDelete, setPendingDelete] = useState<Role | null>(null)

  const selectedRole = roles.find((role) => role.id === selectedRoleId) ?? null

  useEffect(() => {
    if (!selectedRoleId && roles.length > 0) {
      setSelectedRoleId(roles[0].id)
    }
  }, [roles, selectedRoleId])

  useEffect(() => {
    setCheckedPermissions(new Set(selectedRole?.permissions ?? []))
  }, [selectedRole])

  const isDirty = useMemo(() => {
    if (!selectedRole) return false
    const original = new Set(selectedRole.permissions)
    if (original.size !== checkedPermissions.size) return true
    for (const name of checkedPermissions) {
      if (!original.has(name)) return true
    }
    return false
  }, [selectedRole, checkedPermissions])

  const matrixDisabled =
    !canManageRoles || Boolean(selectedRole?.is_system) || syncMutation.isPending

  function togglePermission(name: string) {
    setCheckedPermissions((current) => {
      const next = new Set(current)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }

  function toggleMany(names: string[], nextChecked: boolean) {
    setCheckedPermissions((current) => {
      const next = new Set(current)
      names.forEach((name) => {
        if (nextChecked) {
          next.add(name)
        } else {
          next.delete(name)
        }
      })
      return next
    })
  }

  async function handleSave() {
    if (!selectedRole) return
    await syncMutation.mutateAsync({
      id: selectedRole.id,
      payload: { permissions: Array.from(checkedPermissions) },
    })
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    await deleteMutation.mutateAsync(pendingDelete.id)
    if (selectedRoleId === pendingDelete.id) {
      setSelectedRoleId(null)
    }
    setPendingDelete(null)
  }

  const isLoading = rolesQuery.isLoading || permissionsQuery.isLoading

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("roles.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("roles.description")}</p>
        </div>
        {canManageRoles ? (
          <Button
            type="button"
            onClick={() => {
              setEditingRole(null)
              setFormOpen(true)
            }}
          >
            <Plus />
            {t("roles.new")}
          </Button>
        ) : null}
      </div>

      {isLoading ? (
        <LoadingSkeleton variant="table" rows={6} />
      ) : roles.length === 0 ? (
        <EmptyState title={t("roles.emptyTitle")} description={t("roles.emptyCreate")} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[18rem_1fr]">
          <div className="rounded-xl border border-stroke bg-card p-2 shadow-sm">
            <ul className="space-y-1">
              {roles.map((role) => (
                <li key={role.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedRoleId(role.id)}
                    className={cn(
                      "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-start text-sm font-medium transition-colors",
                      selectedRoleId === role.id
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      {role.is_system ? <Lock className="size-3.5" /> : null}
                      {role.name}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <UsersIcon className="size-3.5" />
                      {role.users_count ?? 0}
                    </span>
                  </button>
                  {canManageRoles && !role.is_system ? (
                    <div className="flex items-center justify-end gap-1 px-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => {
                          setEditingRole(role)
                          setFormOpen(true)
                        }}
                        aria-label={`${t("common.edit")} ${role.name}`}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setPendingDelete(role)}
                        disabled={deleteMutation.isPending}
                        aria-label={`${t("common.delete")} ${role.name}`}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4 rounded-xl border border-stroke bg-card p-4 shadow-sm">
            {selectedRole ? (
              <Tabs
                value={activeTab}
                onValueChange={(value) =>
                  setActiveTab(value as "permissions" | "members")
                }
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold">{selectedRole.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {activeTab === "permissions"
                        ? t("roles.matrix.description")
                        : t("roles.members.description", {
                            role: selectedRole.name,
                          })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedRole.is_system ? (
                      <Badge variant="muted">{t("roles.systemRole")}</Badge>
                    ) : null}
                    {activeTab === "permissions" &&
                    canManageRoles &&
                    !selectedRole.is_system ? (
                      <Button
                        type="button"
                        onClick={() => void handleSave()}
                        disabled={!isDirty || syncMutation.isPending}
                      >
                        <Save />
                        {syncMutation.isPending
                          ? t("roles.matrix.saving")
                          : t("roles.matrix.save")}
                      </Button>
                    ) : null}
                  </div>
                </div>

                <TabsList>
                  <TabsTrigger value="permissions">
                    {t("roles.tabs.permissions")}
                  </TabsTrigger>
                  <TabsTrigger value="members">
                    {t("roles.tabs.members")}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="permissions">
                  <PermissionMatrix
                    permissions={permissions}
                    checkedPermissions={checkedPermissions}
                    onTogglePermission={togglePermission}
                    onToggleModule={toggleMany}
                    onToggleAction={toggleMany}
                    disabled={matrixDisabled}
                  />
                </TabsContent>

                <TabsContent value="members">
                  <RoleMembersPanel key={selectedRole.id} role={selectedRole} />
                </TabsContent>
              </Tabs>
            ) : (
              <EmptyState title={t("roles.selectRole")} />
            )}
          </div>
        </div>
      )}

      <RoleFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        role={editingRole}
        onCreated={(role) => setSelectedRoleId(role.id)}
      />

      <ConfirmAlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null)
        }}
        title={t("roles.deleteTitle")}
        description={t("roles.deleteConfirm", { name: pendingDelete?.name ?? "" })}
        confirming={deleteMutation.isPending}
        onConfirm={confirmDelete}
      />
    </section>
  )
}
