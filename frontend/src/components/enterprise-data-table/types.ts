export type ExportFormat = "xlsx" | "json"

export type ExportScope = "current_page" | "selected" | "filtered" | "all"

export type EnterpriseExportContext = {
  search?: string
  sort?: string
  page?: number
  per_page?: number
  filters_summary?: string
}

export type EnterpriseExportColumn = {
  key: string
  label: string
}

export type EnterpriseExportConfig = {
  entity: string
  filenamePrefix: string
  reportTitle: string
  columns: EnterpriseExportColumn[]
  getContext: () => EnterpriseExportContext
  selectedIds: Array<string | number>
  disabled?: boolean
  permission?: string
}
