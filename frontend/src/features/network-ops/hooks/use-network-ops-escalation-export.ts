import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { networkOpsTeamAssignmentsService } from "@/features/network-ops/services/network-ops-service"
import { getApiErrorMessage } from "@/lib/api-errors"

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

export function useNetworkOpsEscalationExport() {
  const { t } = useTranslation()
  const [pendingKey, setPendingKey] = useState<string | null>(null)

  async function exportAll() {
    setPendingKey("all")
    try {
      const { blob, filename } = await networkOpsTeamAssignmentsService.exportAll()
      downloadBlob(blob, filename)
      toast.success(t("export.success"))
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("export.failed")))
    } finally {
      setPendingKey(null)
    }
  }

  async function exportCategory(categoryId: number) {
    setPendingKey(String(categoryId))
    try {
      const { blob, filename } =
        await networkOpsTeamAssignmentsService.exportCategory(categoryId)
      downloadBlob(blob, filename)
      toast.success(t("export.success"))
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("export.failed")))
    } finally {
      setPendingKey(null)
    }
  }

  return {
    exportAll,
    exportCategory,
    isExporting: pendingKey !== null,
    isExportingAll: pendingKey === "all",
    isExportingCategory: (categoryId: number) =>
      pendingKey === String(categoryId),
  }
}
