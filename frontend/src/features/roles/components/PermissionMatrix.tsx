import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PERMISSION_ACTIONS, type Permission } from "@/features/roles/types/role"
import { cn } from "@/lib/utils"

type PermissionMatrixProps = {
  permissions: Permission[]
  checkedPermissions: Set<string>
  onTogglePermission: (permissionName: string) => void
  onToggleModule: (permissionNames: string[], nextChecked: boolean) => void
  onToggleAction: (permissionNames: string[], nextChecked: boolean) => void
  disabled?: boolean
}

type ModuleRow = {
  module: string
  byAction: Partial<Record<(typeof PERMISSION_ACTIONS)[number], Permission>>
}

export function PermissionMatrix({
  permissions,
  checkedPermissions,
  onTogglePermission,
  onToggleModule,
  onToggleAction,
  disabled = false,
}: PermissionMatrixProps) {
  const { t } = useTranslation()

  const moduleRows = useMemo<ModuleRow[]>(() => {
    const rows = new Map<string, ModuleRow>()

    for (const permission of permissions) {
      const existing = rows.get(permission.module) ?? {
        module: permission.module,
        byAction: {},
      }
      existing.byAction[permission.action as (typeof PERMISSION_ACTIONS)[number]] =
        permission
      rows.set(permission.module, existing)
    }

    return Array.from(rows.values()).sort((a, b) =>
      a.module.localeCompare(b.module)
    )
  }, [permissions])

  const availableActions = useMemo(() => {
    const actionsPresent = new Set(permissions.map((permission) => permission.action))
    return PERMISSION_ACTIONS.filter((action) => actionsPresent.has(action))
  }, [permissions])

  function moduleFullyChecked(row: ModuleRow) {
    const names = Object.values(row.byAction)
      .filter((permission): permission is Permission => Boolean(permission))
      .map((permission) => permission.name)
    return names.length > 0 && names.every((name) => checkedPermissions.has(name))
  }

  function moduleSomeChecked(row: ModuleRow) {
    const names = Object.values(row.byAction)
      .filter((permission): permission is Permission => Boolean(permission))
      .map((permission) => permission.name)
    return names.some((name) => checkedPermissions.has(name))
  }

  function actionFullyChecked(action: (typeof PERMISSION_ACTIONS)[number]) {
    const names = moduleRows
      .map((row) => row.byAction[action]?.name)
      .filter((name): name is string => Boolean(name))
    return names.length > 0 && names.every((name) => checkedPermissions.has(name))
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-stroke">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-40">{t("roles.matrix.module")}</TableHead>
            {availableActions.map((action) => (
              <TableHead key={action} className="text-center">
                <div className="flex flex-col items-center gap-1">
                  <span>{t(`roles.matrix.actions.${action}`)}</span>
                  <Checkbox
                    checked={actionFullyChecked(action)}
                    disabled={disabled}
                    onCheckedChange={(checked) => {
                      const names = moduleRows
                        .map((row) => row.byAction[action]?.name)
                        .filter((name): name is string => Boolean(name))
                      onToggleAction(names, checked === true)
                    }}
                    aria-label={t("roles.matrix.toggleActionColumn", {
                      action: t(`roles.matrix.actions.${action}`),
                    })}
                  />
                </div>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {moduleRows.map((row) => (
            <TableRow key={row.module}>
              <TableCell>
                <div className="flex items-center gap-2 font-medium">
                  <Checkbox
                    checked={
                      moduleFullyChecked(row)
                        ? true
                        : moduleSomeChecked(row)
                          ? "indeterminate"
                          : false
                    }
                    disabled={disabled}
                    onCheckedChange={(checked) => {
                      const names = Object.values(row.byAction)
                        .filter((permission): permission is Permission =>
                          Boolean(permission)
                        )
                        .map((permission) => permission.name)
                      onToggleModule(names, checked === true)
                    }}
                    aria-label={t("roles.matrix.toggleModuleRow", {
                      module: t(`roles.matrix.modules.${row.module}`, {
                        defaultValue: row.module,
                      }),
                    })}
                  />
                  <span>
                    {t(`roles.matrix.modules.${row.module}`, {
                      defaultValue: row.module,
                    })}
                  </span>
                </div>
              </TableCell>
              {availableActions.map((action) => {
                const permission = row.byAction[action]
                return (
                  <TableCell key={action} className={cn("text-center")}>
                    {permission ? (
                      <Checkbox
                        checked={checkedPermissions.has(permission.name)}
                        disabled={disabled}
                        onCheckedChange={() => onTogglePermission(permission.name)}
                        aria-label={`${row.module}.${action}`}
                      />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
