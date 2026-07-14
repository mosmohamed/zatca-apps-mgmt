import axios from "axios"

import { api } from "@/lib/axios"
import type {
  EnterpriseExportContext,
  ExportFormat,
  ExportScope,
} from "@/components/enterprise-data-table/types"

export type ExportRequestPayload = EnterpriseExportContext & {
  format: ExportFormat
  scope: ExportScope
  columns?: string[]
  ids?: Array<string | number>
}

export type ExportResult = {
  blob: Blob
  filename: string
}

function extractFilename(
  contentDisposition: string | undefined,
  fallback: string
): string {
  if (!contentDisposition) {
    return fallback
  }

  const encodedMatch = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition)
  if (encodedMatch?.[1]) {
    try {
      return decodeURIComponent(encodedMatch[1])
    } catch {
      // fall through
    }
  }

  const plainMatch = /filename="?([^";]+)"?/i.exec(contentDisposition)
  return plainMatch?.[1] ?? fallback
}

async function readBlobErrorMessage(blob: Blob): Promise<string | null> {
  const looksLikeJson = blob.type.length === 0 || blob.type.includes("json")
  if (!looksLikeJson) {
    return null
  }

  try {
    const text = await blob.text()
    const parsed = JSON.parse(text) as { message?: string }
    return typeof parsed.message === "string" ? parsed.message : null
  } catch {
    return null
  }
}

export const exportService = {
  async export(
    entity: string,
    payload: ExportRequestPayload,
    fallbackFilename: string
  ): Promise<ExportResult> {
    try {
      const response = await api.post<Blob>(`/exports/${entity}`, payload, {
        responseType: "blob",
      })

      const contentDisposition = response.headers?.["content-disposition"] as
        | string
        | undefined

      return {
        blob: response.data,
        filename: extractFilename(contentDisposition, fallbackFilename),
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
        const message = await readBlobErrorMessage(error.response.data)
        if (message) {
          throw new Error(message)
        }
      }

      throw error
    }
  },
}
