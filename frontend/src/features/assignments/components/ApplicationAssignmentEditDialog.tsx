import { useEffect, useMemo } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { Plus, Trash2 } from "lucide-react"
import { z } from "zod"

import { LoadingSkeleton } from "@/components/LoadingSkeleton"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Combobox } from "@/components/ui/combobox"
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
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  useAppRolesLookup,
  useApplicationAssignmentDetails,
  useEndAssignment,
  useSaveAssignmentMatrix,
} from "@/features/assignments/hooks/use-assignments"
import { useUsers } from "@/features/users/hooks/use-users"
import { cn } from "@/lib/utils"

type ApplicationAssignmentEditDialogProps = {
  applicationId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

type EditRowValues = {
  key: string
  assignment_id: number | null
  user_id: number
  user_label: string
  vendor_name: string
  original_app_role_id: number
  app_role_id: number
  original_is_primary: boolean
  is_primary: boolean
  is_existing: boolean
}

type EditFormValues = {
  rows: EditRowValues[]
}

const compactControlClassName = "h-8 min-h-8 w-full max-w-full"

export function ApplicationAssignmentEditDialog({
  applicationId,
  open,
  onOpenChange,
}: ApplicationAssignmentEditDialogProps) {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language === "ar"
  const detailsQuery = useApplicationAssignmentDetails(applicationId, open)
  const rolesQuery = useAppRolesLookup()
  const usersQuery = useUsers({ page: 1, per_page: 100, sort: "first_name" })
  const endMutation = useEndAssignment()
  const saveMutation = useSaveAssignmentMatrix()

  const schema = useMemo(
    () =>
      z.object({
        rows: z.array(
          z.object({
            key: z.string(),
            assignment_id: z.number().nullable(),
            user_id: z.number().int().positive(t("validation.userRequired")),
            user_label: z.string(),
            vendor_name: z.string(),
            original_app_role_id: z.number().int(),
            app_role_id: z
              .number()
              .int()
              .positive(t("validation.appRoleRequired")),
            original_is_primary: z.boolean(),
            is_primary: z.boolean(),
            is_existing: z.boolean(),
          })
        ),
      }),
    [t]
  )

  const form = useForm<EditFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { rows: [] },
  })

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "rows",
  })

  useEffect(() => {
    if (!open || !detailsQuery.data) {
      return
    }

    const rows: EditRowValues[] = (detailsQuery.data.assignments ?? []).map(
      (assignment) => ({
        key: `existing-${assignment.id}`,
        assignment_id: assignment.id,
        user_id: assignment.user_id,
        user_label:
          assignment.user?.full_name ??
          assignment.user?.email ??
          String(assignment.user_id),
        vendor_name: assignment.user?.vendor?.name ?? "",
        original_app_role_id: assignment.app_role_id,
        app_role_id: assignment.app_role_id,
        original_is_primary: assignment.is_primary,
        is_primary: assignment.is_primary,
        is_existing: true,
      })
    )

    replace(rows)
  }, [open, detailsQuery.data, replace])

  const roleOptions = useMemo(
    () =>
      (rolesQuery.data ?? []).map((role) => ({
        value: String(role.id),
        label: role.name,
      })),
    [rolesQuery.data]
  )

  const watchedRows = form.watch("rows")
  const assignedUserIds = useMemo(
    () => new Set(watchedRows.map((row) => row.user_id).filter((id) => id > 0)),
    [watchedRows]
  )

  const usersById = useMemo(() => {
    const map = new Map(
      (usersQuery.data?.items ?? []).map((user) => [user.id, user])
    )
    return map
  }, [usersQuery.data?.items])

  function userOptionsForRow(index: number) {
    const current = watchedRows[index]
    const currentId = current?.user_id
    const options = (usersQuery.data?.items ?? [])
      .filter(
        (user) => user.id === currentId || !assignedUserIds.has(user.id)
      )
      .map((user) => ({
        value: String(user.id),
        label: `${user.full_name} · ${user.email}`,
      }))

    if (
      currentId > 0 &&
      !options.some((option) => option.value === String(currentId))
    ) {
      options.unshift({
        value: String(currentId),
        label: current.user_label || String(currentId),
      })
    }

    return options
  }

  const application = detailsQuery.data

  async function handleRemoveRow(index: number) {
    const row = form.getValues(`rows.${index}`)

    if (row.is_existing && row.assignment_id) {
      const confirmed = window.confirm(
        t("assignments.edit.deleteConfirm", { user: row.user_label })
      )
      if (!confirmed) {
        return
      }
      await endMutation.mutateAsync(row.assignment_id)
    }

    remove(index)
  }

  async function onSubmit(values: EditFormValues) {
    if (!applicationId) {
      return
    }

    const roleChanges = values.rows
      .filter(
        (row) =>
          row.is_existing &&
          row.assignment_id !== null &&
          row.app_role_id !== row.original_app_role_id
      )
      .map((row) => ({
        user_id: row.user_id,
        app_role_id: row.app_role_id,
        is_primary: row.is_primary,
      }))

    const roleChangedUserIds = new Set(roleChanges.map((row) => row.user_id))

    const existingUpdates = values.rows
      .filter(
        (row) =>
          row.is_existing &&
          row.assignment_id !== null &&
          !roleChangedUserIds.has(row.user_id) &&
          row.is_primary !== row.original_is_primary
      )
      .map((row) => ({
        id: row.assignment_id as number,
        is_primary: row.is_primary,
      }))

    const newUsers = values.rows
      .filter((row) => !row.is_existing)
      .map((row) => ({
        user_id: row.user_id,
        app_role_id: row.app_role_id,
        is_primary: row.is_primary,
      }))

    await saveMutation.mutateAsync({
      applicationId,
      existingUpdates,
      roleChanges,
      newUsers,
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {application
              ? t("assignments.edit.title", {
                  name: isArabic ? application.name_ar : application.name_en,
                })
              : t("assignments.edit.titleFallback")}
          </DialogTitle>
          <DialogDescription>
            {application ? (
              <span className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <span className="font-mono">{application.code}</span>
                <span>
                  {t("assignments.columns.department")}:{" "}
                  {isArabic
                    ? (application.department?.name_ar ?? "—")
                    : (application.department?.name_en ?? "—")}
                </span>
                <span>
                  {t("common.status")}:{" "}
                  {isArabic
                    ? (application.status?.name_ar ?? "—")
                    : (application.status?.name_en ?? "—")}
                </span>
              </span>
            ) : (
              t("assignments.edit.description")
            )}
          </DialogDescription>
        </DialogHeader>

        {detailsQuery.isLoading ? (
          <LoadingSkeleton variant="table" rows={5} />
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {fields.length === 0 ? (
                <p className="rounded-lg border border-dashed border-stroke px-4 py-8 text-center text-sm text-muted-foreground">
                  {t("assignments.view.empty")}
                </p>
              ) : (
                <TooltipProvider delayDuration={200}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[52%]">
                          {t("assignments.columns.user")}
                        </TableHead>
                        <TableHead className="w-[24%]">
                          {t("assignments.columns.role")}
                        </TableHead>
                        <TableHead className="w-[14%]">
                          {t("assignments.columns.primary")}
                        </TableHead>
                        <TableHead className="w-[10%] text-end">
                          {t("common.actions")}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((field, index) => {
                        const rowValues = watchedRows[index]
                        const selectedUser = usersById.get(
                          rowValues?.user_id ?? 0
                        )
                        const tooltipLines = [
                          rowValues?.user_label ||
                            selectedUser?.full_name ||
                            null,
                          selectedUser?.email ?? null,
                          rowValues?.vendor_name
                            ? `${t("assignments.columns.vendor")}: ${rowValues.vendor_name}`
                            : `${t("assignments.columns.vendor")}: ${t("assignments.internal")}`,
                        ].filter(Boolean) as string[]

                        return (
                          <TableRow key={field.id}>
                            <TableCell className="align-middle py-2">
                              <FormField
                                control={form.control}
                                name={`rows.${index}.user_id`}
                                render={({ field: userField }) => (
                                  <FormItem className="space-y-0">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <div className="w-full min-w-0">
                                          <FormControl>
                                            <Combobox
                                              options={userOptionsForRow(index)}
                                              value={
                                                userField.value
                                                  ? String(userField.value)
                                                  : undefined
                                              }
                                              disabled={field.is_existing}
                                              onValueChange={(value) => {
                                                const selected = usersById.get(
                                                  Number(value)
                                                )
                                                userField.onChange(
                                                  value ? Number(value) : 0
                                                )
                                                form.setValue(
                                                  `rows.${index}.user_label`,
                                                  selected
                                                    ? `${selected.full_name} · ${selected.email}`
                                                    : ""
                                                )
                                                form.setValue(
                                                  `rows.${index}.vendor_name`,
                                                  selected?.vendor?.name ?? ""
                                                )
                                              }}
                                              placeholder={t(
                                                "assignments.form.searchUsers"
                                              )}
                                              searchPlaceholder={t(
                                                "assignments.form.searchUsers"
                                              )}
                                              emptyMessage={t(
                                                "assignments.form.noUsers"
                                              )}
                                              className={cn(
                                                compactControlClassName,
                                                "justify-between truncate"
                                              )}
                                            />
                                          </FormControl>
                                        </div>
                                      </TooltipTrigger>
                                      {userField.value > 0 ? (
                                        <TooltipContent side="top" align="start">
                                          <div className="space-y-0.5 text-start">
                                            {tooltipLines.map((line) => (
                                              <p key={line}>{line}</p>
                                            ))}
                                          </div>
                                        </TooltipContent>
                                      ) : null}
                                    </Tooltip>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </TableCell>

                            <TableCell className="align-middle py-2">
                              <FormField
                                control={form.control}
                                name={`rows.${index}.app_role_id`}
                                render={({ field: roleField }) => (
                                  <FormItem className="space-y-0">
                                    <Select
                                      value={
                                        roleField.value
                                          ? String(roleField.value)
                                          : undefined
                                      }
                                      onValueChange={(value) =>
                                        roleField.onChange(Number(value))
                                      }
                                    >
                                      <FormControl>
                                        <SelectTrigger
                                          size="sm"
                                          className={cn(
                                            compactControlClassName,
                                            "w-full min-w-0"
                                          )}
                                        >
                                          <SelectValue
                                            placeholder={t(
                                              "assignments.form.searchRoles"
                                            )}
                                          />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {roleOptions.map((role) => (
                                          <SelectItem
                                            key={role.value}
                                            value={role.value}
                                          >
                                            {role.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </TableCell>

                            <TableCell className="align-middle py-2">
                              <FormField
                                control={form.control}
                                name={`rows.${index}.is_primary`}
                                render={({ field: primaryField }) => (
                                  <FormItem className="flex items-center gap-2 space-y-0">
                                    <FormControl>
                                      <Checkbox
                                        checked={primaryField.value}
                                        onCheckedChange={(checked) =>
                                          primaryField.onChange(
                                            checked === true
                                          )
                                        }
                                        aria-label={t(
                                          "assignments.columns.primary"
                                        )}
                                      />
                                    </FormControl>
                                    <span
                                      className={cn(
                                        "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
                                        primaryField.value
                                          ? "bg-emerald-500/10 text-emerald-700"
                                          : "bg-muted text-muted-foreground"
                                      )}
                                    >
                                      {primaryField.value
                                        ? t("common.yes")
                                        : t("common.no")}
                                    </span>
                                  </FormItem>
                                )}
                              />
                            </TableCell>

                            <TableCell className="align-middle py-2 text-end">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8 text-destructive hover:text-destructive"
                                aria-label={t("common.delete")}
                                disabled={
                                  endMutation.isPending ||
                                  saveMutation.isPending
                                }
                                onClick={() => void handleRemoveRow(index)}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TooltipProvider>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    key: `new-${Date.now()}`,
                    assignment_id: null,
                    user_id: 0,
                    user_label: "",
                    vendor_name: "",
                    original_app_role_id: 0,
                    app_role_id: 0,
                    original_is_primary: false,
                    is_primary: false,
                    is_existing: false,
                  })
                }
              >
                <Plus />
                {t("assignments.form.addUser")}
              </Button>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={saveMutation.isPending}
                >
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={saveMutation.isPending}>
                  {saveMutation.isPending
                    ? t("assignments.edit.saving")
                    : t("assignments.edit.save")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
