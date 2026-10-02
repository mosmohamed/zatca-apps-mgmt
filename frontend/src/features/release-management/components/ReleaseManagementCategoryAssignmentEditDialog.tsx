import { useEffect, useMemo, useRef } from "react"
import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useTranslation } from "react-i18next"
import { Plus, Trash2 } from "lucide-react"

import { LoadingSkeleton } from "@/components/LoadingSkeleton"
import { Button } from "@/components/ui/button"
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
  useReleaseManagementCategoryAssignmentMatrix,
  useReleaseManagementLevelsLookup,
  useSaveReleaseManagementCategoryAssignmentMatrix,
} from "@/features/release-management/hooks/use-release-management"
import {
  createReleaseManagementCategoryAssignmentMatrixSchema,
  type ReleaseManagementCategoryAssignmentMatrixFormValues,
} from "@/features/release-management/types/release-management-schema"
import { useUsers } from "@/features/users/hooks/use-users"
import { cn } from "@/lib/utils"

type ReleaseManagementCategoryAssignmentEditDialogProps = {
  categoryId: number | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const compactControlClassName = "h-8 min-h-8 w-full max-w-full"

export function ReleaseManagementCategoryAssignmentEditDialog({
  categoryId,
  open,
  onOpenChange,
}: ReleaseManagementCategoryAssignmentEditDialogProps) {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language.startsWith("ar")
  const detailsQuery = useReleaseManagementCategoryAssignmentMatrix(categoryId, open)
  const levelsQuery = useReleaseManagementLevelsLookup()
  const usersQuery = useUsers({ page: 1, per_page: 100, sort: "first_name" })
  const saveMutation = useSaveReleaseManagementCategoryAssignmentMatrix()
  const initialAssignmentIdsRef = useRef<number[]>([])

  const schema = useMemo(
    () => createReleaseManagementCategoryAssignmentMatrixSchema(t),
    [t]
  )

  const form = useForm<ReleaseManagementCategoryAssignmentMatrixFormValues>({
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

    const rows = (detailsQuery.data.assignments ?? []).map((assignment) => ({
      key: `existing-${assignment.id}`,
      assignment_id: assignment.id,
      user_id: assignment.user_id,
      user_label:
        assignment.user?.full_name ??
        assignment.user?.email ??
        String(assignment.user_id),
      original_release_management_level_id: assignment.release_management_level_id,
      release_management_level_id: assignment.release_management_level_id,
      is_existing: true,
    }))

    initialAssignmentIdsRef.current = rows
      .map((row) => row.assignment_id)
      .filter((id): id is number => id !== null)

    replace(rows)
  }, [open, detailsQuery.data, replace])

  const levelOptions = useMemo(
    () =>
      (levelsQuery.data ?? []).map((level) => ({
        value: String(level.id),
        level,
      })),
    [levelsQuery.data]
  )

  const watchedRows = form.watch("rows")

  const usersById = useMemo(() => {
    return new Map((usersQuery.data?.items ?? []).map((user) => [user.id, user]))
  }, [usersQuery.data?.items])

  function userOptionsForRow(index: number) {
    const current = watchedRows[index]
    const currentId = current?.user_id
    const options = (usersQuery.data?.items ?? []).map((user) => ({
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

  const category = detailsQuery.data

  function handleRemoveRow(index: number) {
    const row = form.getValues(`rows.${index}`)

    if (row.is_existing && row.assignment_id) {
      const confirmed = window.confirm(
        t("releaseManagement.assignments.edit.deleteConfirm", {
          user: row.user_label,
        })
      )
      if (!confirmed) {
        return
      }
    }

    remove(index)
  }

  async function onSubmit(values: ReleaseManagementCategoryAssignmentMatrixFormValues) {
    if (!categoryId) {
      return
    }

    const remainingIds = new Set(
      values.rows
        .filter((row) => row.is_existing && row.assignment_id !== null)
        .map((row) => row.assignment_id as number)
    )

    const removedIds = initialAssignmentIdsRef.current.filter(
      (id) => !remainingIds.has(id)
    )

    const existingUpdates = values.rows
      .filter(
        (row) =>
          row.is_existing &&
          row.assignment_id !== null &&
          row.release_management_level_id !== row.original_release_management_level_id
      )
      .map((row) => ({
        id: row.assignment_id as number,
        release_management_level_id: row.release_management_level_id,
      }))

    const newUsers = values.rows
      .filter((row) => !row.is_existing)
      .map((row) => ({
        user_id: row.user_id,
        release_management_level_id: row.release_management_level_id,
      }))

    await saveMutation.mutateAsync({
      categoryId,
      existingUpdates,
      newUsers,
      removedIds,
    })

    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {category
              ? t("releaseManagement.assignments.edit.title", {
                  name: isArabic
                    ? (category.title_ar ?? category.name_ar)
                    : (category.title_en ?? category.name_en),
                })
              : t("releaseManagement.assignments.edit.titleFallback")}
          </DialogTitle>
          <DialogDescription>
            {category ? (
              <span className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <span className="font-mono">{category.code}</span>
                <span>
                  {t("releaseManagement.assignments.columns.assignedUsers")}:{" "}
                  {category.assignments_count ??
                    category.assignments?.length ??
                    0}
                </span>
              </span>
            ) : (
              t("releaseManagement.assignments.edit.description")
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
                  {t("releaseManagement.assignments.view.empty")}
                </p>
              ) : (
                <TooltipProvider delayDuration={200}>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[58%]">
                          {t("releaseManagement.assignments.columns.user")}
                        </TableHead>
                        <TableHead className="w-[32%]">
                          {t("releaseManagement.assignments.columns.level")}
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
                                              }}
                                              placeholder={t(
                                                "releaseManagement.assignments.form.searchUsers"
                                              )}
                                              searchPlaceholder={t(
                                                "releaseManagement.assignments.form.searchUsers"
                                              )}
                                              emptyMessage={t(
                                                "releaseManagement.assignments.form.noUsers"
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
                                        <TooltipContent
                                          side="top"
                                          align="start"
                                        >
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
                                name={`rows.${index}.release_management_level_id`}
                                render={({ field: levelField }) => (
                                  <FormItem className="space-y-0">
                                    <Select
                                      value={
                                        levelField.value
                                          ? String(levelField.value)
                                          : undefined
                                      }
                                      onValueChange={(value) =>
                                        levelField.onChange(Number(value))
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
                                              "releaseManagement.assignments.form.selectLevel"
                                            )}
                                          />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {levelOptions.map((option) => (
                                          <SelectItem
                                            key={option.value}
                                            value={option.value}
                                            title={
                                              (isArabic
                                                ? option.level.note_ar
                                                : option.level.note_en) ??
                                              undefined
                                            }
                                          >
                                            {isArabic
                                              ? option.level.name_ar
                                              : option.level.name_en}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
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
                                disabled={saveMutation.isPending}
                                onClick={() => handleRemoveRow(index)}
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
                    original_release_management_level_id: 0,
                    release_management_level_id: 0,
                    is_existing: false,
                  })
                }
              >
                <Plus />
                {t("releaseManagement.assignments.form.addUser")}
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
                    ? t("releaseManagement.assignments.edit.saving")
                    : t("releaseManagement.assignments.edit.save")}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
