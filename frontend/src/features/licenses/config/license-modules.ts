export type LicenseModuleId = "apps" | "infra" | "service-desk"

export type LicenseModuleConfig = {
  id: LicenseModuleId
  apiBase: string
  permissionPrefix: string
  exportEntity: string
  listPath: string
  detailPath: (id: number) => string
  titleKey: string
  descriptionKey: string
  queryKey: string
}

export const LICENSE_MODULES: Record<LicenseModuleId, LicenseModuleConfig> = {
  apps: {
    id: "apps",
    apiBase: "licenses",
    permissionPrefix: "licenses",
    exportEntity: "licenses",
    listPath: "/licenses",
    detailPath: (id) => `/licenses/${id}`,
    titleKey: "licenses.titleApps",
    descriptionKey: "licenses.descriptionApps",
    queryKey: "licenses",
  },
  infra: {
    id: "infra",
    apiBase: "infra-licenses",
    permissionPrefix: "infra-licenses",
    exportEntity: "infra-licenses",
    listPath: "/infra-licenses",
    detailPath: (id) => `/infra-licenses/${id}`,
    titleKey: "licenses.titleInfra",
    descriptionKey: "licenses.descriptionInfra",
    queryKey: "infra-licenses",
  },
  "service-desk": {
    id: "service-desk",
    apiBase: "service-desk-licenses",
    permissionPrefix: "service-desk-licenses",
    exportEntity: "service-desk-licenses",
    listPath: "/service-desk-licenses",
    detailPath: (id) => `/service-desk-licenses/${id}`,
    titleKey: "licenses.titleSd",
    descriptionKey: "licenses.descriptionSd",
    queryKey: "service-desk-licenses",
  },
}

export function licensePermission(
  module: LicenseModuleConfig,
  action: "view" | "create" | "update" | "delete" | "export"
): string {
  return `${module.permissionPrefix}.${action}`
}
