export type LicenseModuleId =
  | "apps"
  | "infra"
  | "service-desk"
  | "network-ops"
  | "smart-facilities"

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
  /** Column/detail label for the product field. */
  productKey: string
  /** Column/detail label for the licensed count field. */
  licensedKey: string
  /** Form label for the product field. */
  formProductKey: string
  /** Form label for the licensed count field. */
  formLicensedKey: string
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
    productKey: "licenses.columns.application",
    licensedKey: "licenses.columns.licensedNo",
    formProductKey: "licenses.form.application",
    formLicensedKey: "licenses.form.licensedNo",
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
    productKey: "licenses.columns.product",
    licensedKey: "licenses.columns.licensed",
    formProductKey: "licenses.form.product",
    formLicensedKey: "licenses.form.licensed",
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
    productKey: "licenses.columns.product",
    licensedKey: "licenses.columns.licensed",
    formProductKey: "licenses.form.product",
    formLicensedKey: "licenses.form.licensed",
  },
  "network-ops": {
    id: "network-ops",
    apiBase: "network-ops-licenses",
    permissionPrefix: "network-ops-licenses",
    exportEntity: "network-ops-licenses",
    listPath: "/network-ops-licenses",
    detailPath: (id) => `/network-ops-licenses/${id}`,
    titleKey: "licenses.titleNetworkOps",
    descriptionKey: "licenses.descriptionNetworkOps",
    queryKey: "network-ops-licenses",
    productKey: "licenses.columns.product",
    licensedKey: "licenses.columns.licensed",
    formProductKey: "licenses.form.product",
    formLicensedKey: "licenses.form.licensed",
  },
  "smart-facilities": {
    id: "smart-facilities",
    apiBase: "smart-facilities-licenses",
    permissionPrefix: "smart-facilities-licenses",
    exportEntity: "smart-facilities-licenses",
    listPath: "/smart-facilities-licenses",
    detailPath: (id) => `/smart-facilities-licenses/${id}`,
    titleKey: "licenses.titleSmartFacilities",
    descriptionKey: "licenses.descriptionSmartFacilities",
    queryKey: "smart-facilities-licenses",
    productKey: "licenses.columns.product",
    licensedKey: "licenses.columns.licensed",
    formProductKey: "licenses.form.product",
    formLicensedKey: "licenses.form.licensed",
  },
}

export function licensePermission(
  module: LicenseModuleConfig,
  action: "view" | "create" | "update" | "delete" | "export"
): string {
  return `${module.permissionPrefix}.${action}`
}
