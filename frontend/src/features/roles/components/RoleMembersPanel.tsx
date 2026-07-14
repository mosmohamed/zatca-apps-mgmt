import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Trash2, UserRoundPlus } from "lucide-react"

import { ConfirmAlertDialog } from "@/components/ConfirmAlertDialog"
import { EmptyState } from "@/components/EmptyState"
import { LoadingSkeleton } from "@/components/LoadingSkeleton"
import { Button } from "@/components/ui/button"
import { Combobox } from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/features/auth/hooks/use-auth"
import {
  useAttachRoleUser,
  useDetachRoleUser,
  useRoleUsers,
} from "@/features/roles/hooks/use-roles"
import type { Role } from "@/features/roles/types/role"
import { useUsers } from "@/features/users/hooks/use-users"
import { useDebouncedValue } from "@/hooks/use-debounced-value"

type RoleMembersPanelProps = {
  role: Role
}

export function RoleMembersPanel({ role }: RoleMembersPanelProps) {
  const { t } = useTranslation()
  const { can, isSuperAdmin } = useAuth()
  const canManage = isSuperAdmin || can("roles.update")
  const manageBlocked = role.name === "super_admin" && !isSuperAdmin

  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [pendingDetachId, setPendingDetachId] = useState<number | null>(null)

  const debouncedSearch = useDebouncedValue(search, 350)
  const membersQuery = useRoleUsers(role.id, {
    page,
    per_page: 15,
    search: debouncedSearch,
  })
  const allUsersQuery = useUsers({ page: 1, per_page: 100, sort: "first_name" })
  const attachMutation = useAttachRoleUser(role.id)
  const detachMutation = useDetachRoleUser(role.id)

  const members = membersQuery.data?.items ?? []
  const pagination = membersQuery.data?.pagination

  const assignOptions = useMemo(() => {
    const users = allUsersQuery.data?.items ?? []
    return users
      .filter((user) => !(user.roles ?? []).includes(role.name))
      .map((user) => ({
        value: String(user.id),
        label: `${user.full_name} (${user.email})`,
      }))
  }, [allUsersQuery.data?.items, role.name])

  async function handleAttach() {
    if (!selectedUserId) return
    await attachMutation.mutateAsync(Number(selectedUserId))
    setSelectedUserId("")
  }

  async function confirmDetach() {
    if (pendingDetachId === null) return
    await detachMutation.mutateAsync(pendingDetachId)
    setPendingDetachId(null)
  }

  return (
    <div className="space-y-4">
      {canManage && !manageBlocked ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">
              {t("roles.members.assignUser")}
            </p>
            <Combobox
              options={assignOptions}
              value={selectedUserId}
              onValueChange={setSelectedUserId}
              placeholder={t("roles.members.selectUser")}
              searchPlaceholder={t("roles.members.searchUsers")}
              emptyMessage={t("roles.members.noUsersToAssign")}
            />
          </div>
          <Button
            type="button"
            onClick={() => void handleAttach()}
            disabled={!selectedUserId || attachMutation.isPending}
          >
            <UserRoundPlus />
            {attachMutation.isPending
              ? t("roles.members.assigning")
              : t("roles.members.assign")}
          </Button>
        </div>
      ) : null}

      <Input
        value={search}
        onChange={(event) => {
          setSearch(event.target.value)
          setPage(1)
        }}
        placeholder={t("roles.members.searchMembers")}
        className="sm:max-w-sm"
      />

      {membersQuery.isLoading ? (
        <LoadingSkeleton variant="table" rows={5} />
      ) : members.length === 0 ? (
        <EmptyState
          title={t("roles.members.emptyTitle")}
          description={t("roles.members.emptyDescription")}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-stroke">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-start text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">{t("users.columns.name")}</th>
                <th className="px-3 py-2 font-medium">{t("users.columns.email")}</th>
                <th className="px-3 py-2 font-medium">{t("users.columns.jobTitle")}</th>
                {canManage && !manageBlocked ? (
                  <th className="px-3 py-2 text-end font-medium">
                    {t("common.actions")}
                  </th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-t border-stroke">
                  <td className="px-3 py-2.5 font-medium">{member.full_name}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {member.email}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">
                    {member.job_title?.name_en ?? "—"}
                  </td>
                  {canManage && !manageBlocked ? (
                    <td className="px-3 py-2.5 text-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setPendingDetachId(member.id)}
                        disabled={detachMutation.isPending}
                        aria-label={t("roles.members.removeUser", {
                          name: member.full_name,
                        })}
                      >
                        <Trash2 />
                      </Button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && pagination.last_page > 1 ? (
        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pagination.current_page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            {t("common.previous")}
          </Button>
          <span className="text-xs text-muted-foreground">
            {t("common.pageOf", {
              current: pagination.current_page,
              last: pagination.last_page,
            })}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pagination.current_page >= pagination.last_page}
            onClick={() =>
              setPage((current) =>
                Math.min(pagination.last_page, current + 1)
              )
            }
          >
            {t("common.next")}
          </Button>
        </div>
      ) : null}

      {manageBlocked ? (
        <p className="text-xs text-muted-foreground">
          {t("roles.members.superAdminRestricted")}
        </p>
      ) : !canManage ? (
        <p className="text-xs text-muted-foreground">
          {t("roles.members.readOnly")}
        </p>
      ) : null}

      <ConfirmAlertDialog
        open={pendingDetachId !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDetachId(null)
        }}
        title={t("roles.members.removeTitle")}
        description={t("roles.members.removeConfirm")}
        confirming={detachMutation.isPending}
        onConfirm={confirmDetach}
      />
    </div>
  )
}
