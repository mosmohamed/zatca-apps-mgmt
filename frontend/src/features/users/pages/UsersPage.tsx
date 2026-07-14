import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Plus, Trash2 } from "lucide-react"

import { EmptyState } from "@/components/EmptyState"
import { LoadingSkeleton } from "@/components/LoadingSkeleton"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { UserFormDialog } from "@/features/users/components/UserFormDialog"
import {
  useDeleteUser,
  useUpdateUser,
  useUsers,
} from "@/features/users/hooks/use-users"
import type { ManagedUser } from "@/features/users/types/user"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import { cn } from "@/lib/utils"

type SortColumn =
  | "first_name"
  | "last_name"
  | "email"
  | "is_active"
  | "created_at"

function SortIcon({ column, sort }: { column: SortColumn; sort: string }) {
  const active = sort === column || sort === `-${column}`
  if (!active) {
    return <ArrowUpDown className="size-3.5 opacity-50" />
  }
  return sort.startsWith("-") ? (
    <ArrowDown className="size-3.5" />
  ) : (
    <ArrowUp className="size-3.5" />
  )
}

export function UsersPage() {
  const { t } = useTranslation()
  const { isSuperAdmin } = useAuth()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState("-created_at")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<ManagedUser | null>(null)

  const debouncedSearch = useDebouncedValue(search, 350)
  const listParams = useMemo(
    () => ({ page, per_page: 15, search: debouncedSearch, sort }),
    [page, debouncedSearch, sort]
  )

  const usersQuery = useUsers(listParams)
  const deleteMutation = useDeleteUser()
  const updateMutation = useUpdateUser()
  const items = usersQuery.data?.items ?? []
  const pagination = usersQuery.data?.pagination

  function toggleSort(column: SortColumn) {
    setPage(1)
    setSort((current) => {
      if (current === column) return `-${column}`
      if (current === `-${column}`) return column
      return column
    })
  }

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  async function handleDelete(user: ManagedUser) {
    const confirmed = window.confirm(
      t("users.deleteConfirm", { name: user.full_name })
    )
    if (!confirmed) return
    await deleteMutation.mutateAsync(user.id)
  }

  async function toggleActive(user: ManagedUser) {
    if (!isSuperAdmin) return
    await updateMutation.mutateAsync({
      id: user.id,
      payload: {
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        vendor_id: user.vendor_id,
        phone: user.phone,
        teams: user.teams,
        whatsapp: user.whatsapp,
        extension: user.extension,
        job_title_id: user.job_title_id,
        is_active: !user.is_active,
      },
    })
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("users.title")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("users.description")}
          </p>
        </div>
        {isSuperAdmin ? (
          <Button type="button" onClick={openCreate}>
            <Plus />
            {t("users.new")}
          </Button>
        ) : null}
      </div>

      <div className="rounded-xl border border-stroke bg-card p-4 shadow-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }}
            placeholder={t("users.searchPlaceholder")}
            className="sm:max-w-sm"
          />
          <p className="text-xs text-muted-foreground">
            {pagination
              ? t("common.pagination", {
                  total: pagination.total,
                  current: pagination.current_page,
                  last: pagination.last_page,
                })
              : t("common.loading")}
          </p>
        </div>

        {usersQuery.isLoading ? (
          <LoadingSkeleton variant="table" rows={8} />
        ) : items.length === 0 ? (
          <EmptyState
            title={t("users.emptyTitle")}
            description={
              debouncedSearch
                ? t("common.tryDifferentSearch")
                : t("users.emptyCreate")
            }
            actionLabel={isSuperAdmin ? t("users.create") : undefined}
            onAction={isSuperAdmin ? openCreate : undefined}
          />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort("first_name")}
                    >
                      {t("users.columns.name")}
                      <SortIcon column="first_name" sort={sort} />
                    </button>
                  </TableHead>
                  <TableHead>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort("email")}
                    >
                      {t("users.columns.email")}
                      <SortIcon column="email" sort={sort} />
                    </button>
                  </TableHead>
                  <TableHead>{t("users.columns.vendor")}</TableHead>
                  <TableHead>{t("users.columns.jobTitle")}</TableHead>
                  <TableHead>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1"
                      onClick={() => toggleSort("is_active")}
                    >
                      {t("users.columns.active")}
                      <SortIcon column="is_active" sort={sort} />
                    </button>
                  </TableHead>
                  {isSuperAdmin ? (
                    <TableHead className="text-end">{t("common.actions")}</TableHead>
                  ) : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">{user.full_name}</div>
                      <div className="text-xs text-muted-foreground">
                        {user.phone ?? "—"}
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.vendor?.name ?? (
                        <span className="text-muted-foreground">
                          {t("users.form.vendorNone")}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.job_title?.name_en ?? "—"}
                    </TableCell>
                    <TableCell>
                      {isSuperAdmin ? (
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={user.is_active}
                            onCheckedChange={() => void toggleActive(user)}
                            disabled={updateMutation.isPending}
                            aria-label={`${t("common.edit")} ${user.full_name}`}
                          />
                          <span
                            className={cn(
                              "text-xs",
                              user.is_active
                                ? "text-emerald-700"
                                : "text-muted-foreground"
                            )}
                          >
                            {user.is_active
                              ? t("common.active")
                              : t("common.inactive")}
                          </span>
                        </div>
                      ) : (
                        <span
                          className={cn(
                            "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                            user.is_active
                              ? "bg-emerald-500/10 text-emerald-700"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {user.is_active
                            ? t("common.active")
                            : t("common.inactive")}
                        </span>
                      )}
                    </TableCell>
                    {isSuperAdmin ? (
                      <TableCell className="text-end">
                        <div className="inline-flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => {
                              setEditing(user)
                              setDialogOpen(true)
                            }}
                            aria-label={`${t("common.edit")} ${user.full_name}`}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => void handleDelete(user)}
                            disabled={deleteMutation.isPending}
                            aria-label={`${t("common.delete")} ${user.full_name}`}
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {pagination && pagination.last_page > 1 ? (
              <div className="mt-4 flex items-center justify-end gap-2">
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
          </>
        )}
      </div>

      {isSuperAdmin ? (
        <UserFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          user={editing}
        />
      ) : null}
    </section>
  )
}
