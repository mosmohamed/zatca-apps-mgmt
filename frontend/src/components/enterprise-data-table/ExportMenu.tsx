import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Download, FileJson, FileSpreadsheet, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import type {
  EnterpriseExportConfig,
  ExportFormat,
  ExportScope,
} from "@/components/enterprise-data-table/types"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { exportService } from "@/features/exports/services/export-service"
import { getApiErrorMessage } from "@/lib/api-errors"

type ExportMenuProps = {
  config: EnterpriseExportConfig
  hasData: boolean
}

type ExportJob = {
  scope: ExportScope
  format: ExportFormat
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export function ExportMenu({ config, hasData }: ExportMenuProps) {
  const { t } = useTranslation()
  const { can } = useAuth()
  const [pendingJob, setPendingJob] = useState<ExportJob | null>(null)

  const permissionGranted = config.permission ? can(config.permission) : true
  const menuDisabled = Boolean(config.disabled) || !hasData || !permissionGranted
  const hasSelection = config.selectedIds.length > 0
  const isBusy = pendingJob !== null

  async function runExport(scope: ExportScope, format: ExportFormat) {
    setPendingJob({ scope, format })

    try {
      const context = config.getContext()
      const date = new Date().toISOString().slice(0, 10)
      const extension = format === "xlsx" ? "xlsx" : "json"
      const fallbackFilename = `${config.filenamePrefix}_${date}.${extension}`

      const { blob, filename } = await exportService.export(
        config.entity,
        {
          format,
          scope,
          columns: config.columns.map((column) => column.key),
          ...context,
          ...(scope === "selected" ? { ids: config.selectedIds } : {}),
        },
        fallbackFilename
      )

      downloadBlob(blob, filename)
      toast.success(t("export.success"))
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("export.failed")))
    } finally {
      setPendingJob(null)
    }
  }

  function isRunning(scope: ExportScope, format: ExportFormat) {
    return pendingJob?.scope === scope && pendingJob.format === format
  }

  function ScopeGroup({
    scope,
    label,
    disabled = false,
  }: {
    scope: ExportScope
    label: string
    disabled?: boolean
  }) {
    return (
      <>
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <DropdownMenuItem
          disabled={disabled || isBusy}
          onSelect={() => void runExport(scope, "xlsx")}
        >
          {isRunning(scope, "xlsx") ? (
            <Loader2 className="animate-spin" />
          ) : (
            <FileSpreadsheet />
          )}
          {t("export.excel")}
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={disabled || isBusy}
          onSelect={() => void runExport(scope, "json")}
        >
          {isRunning(scope, "json") ? (
            <Loader2 className="animate-spin" />
          ) : (
            <FileJson />
          )}
          {t("export.json")}
        </DropdownMenuItem>
      </>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={menuDisabled || isBusy}
        >
          {isBusy ? <Loader2 className="animate-spin" /> : <Download />}
          {t("export.label")}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64">
        <ScopeGroup scope="current_page" label={t("export.scopes.currentPage")} />
        <DropdownMenuSeparator />
        <ScopeGroup
          scope="selected"
          label={t("export.scopes.selected")}
          disabled={!hasSelection}
        />
        <DropdownMenuSeparator />
        <ScopeGroup scope="filtered" label={t("export.scopes.filtered")} />
        <DropdownMenuSeparator />
        <ScopeGroup scope="all" label={t("export.scopes.all")} />
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
