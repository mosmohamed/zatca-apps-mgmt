import {
  DATABASE_ROLES,
  DNS_SCOPES,
  INTEGRATION_DIRECTIONS,
  LOAD_BALANCER_TYPES,
  VIP_VISIBILITIES,
  type InfrastructureCollectionKey,
  type InfrastructureSectionKey,
} from "@/features/applications/types/infrastructure"

/**
 * Field kinds map one-to-one onto the backend validation rules documented in
 * `backend/docs/APPLICATION_INFRASTRUCTURE.md`, so a single descriptor drives
 * the editor inputs, the client side validation and the read-only renderer.
 */
export type InfraFieldKind =
  | "text"
  | "notes"
  | "number"
  | "port"
  | "boolean"
  | "select"
  | "ip"
  | "hostname"
  | "url"
  | "cidr"
  | "date"

export type InfraFieldDef = {
  name: string
  kind: InfraFieldKind
  maxLength?: number
  options?: readonly string[]
  /** Rendered with a copy-to-clipboard affordance in read-only views. */
  copyable?: boolean
  /** Spans the full width of the field grid. */
  wide?: boolean
}

export type InfraSectionDef = {
  key: InfrastructureSectionKey
  fields: readonly InfraFieldDef[]
}

export type InfraCollectionDef = {
  key: InfrastructureCollectionKey
  /** Field used as the row heading when it has a value. */
  titleField: string
  /** Secondary fields shown in the collapsed row summary. */
  summaryFields: readonly string[]
  fields: readonly InfraFieldDef[]
}

const NOTES_MAX = 5000
const URL_MAX = 2048

export const HOSTING_FIELDS: readonly InfraFieldDef[] = [
  { name: "hosting_model", kind: "text" },
  { name: "deployment_type", kind: "text" },
  { name: "cloud_provider", kind: "text" },
  { name: "cloud_account", kind: "text" },
  { name: "region", kind: "text" },
  { name: "availability_zone", kind: "text" },
  { name: "data_center", kind: "text" },
  { name: "cluster_name", kind: "text" },
  { name: "cluster_ip", kind: "ip", copyable: true },
  { name: "namespace", kind: "text", copyable: true },
  { name: "resource_group", kind: "text" },
  { name: "tenant", kind: "text" },
  { name: "network_zone", kind: "text" },
  { name: "notes", kind: "notes", maxLength: NOTES_MAX, wide: true },
]

export const INTERNET_FIELDS: readonly InfraFieldDef[] = [
  { name: "published_to_internet", kind: "boolean" },
  { name: "public_ip", kind: "ip", copyable: true },
  { name: "public_domain", kind: "hostname", copyable: true },
  { name: "public_url", kind: "url", maxLength: URL_MAX, copyable: true },
  { name: "internet_facing_lb", kind: "text" },
  { name: "waf_enabled", kind: "boolean" },
  { name: "waf_provider", kind: "text" },
  { name: "cdn_enabled", kind: "boolean" },
  { name: "cdn_provider", kind: "text" },
  { name: "tls_certificate", kind: "text" },
  { name: "external_port", kind: "port" },
  { name: "exposure_type", kind: "text" },
  { name: "publication_owner", kind: "text" },
  { name: "internet_notes", kind: "notes", maxLength: NOTES_MAX, wide: true },
]

export const OPERATIONAL_FIELDS: readonly InfraFieldDef[] = [
  { name: "monitoring_enabled", kind: "boolean" },
  { name: "monitoring_tool", kind: "text" },
  { name: "logging_enabled", kind: "boolean" },
  { name: "logging_platform", kind: "text" },
  { name: "apm_tool", kind: "text" },
  { name: "dashboard_url", kind: "url", maxLength: URL_MAX, copyable: true },
  { name: "health_check_url", kind: "url", maxLength: URL_MAX, copyable: true },
  { name: "support_team", kind: "text" },
  { name: "operations_owner", kind: "text" },
  { name: "on_call_group", kind: "text" },
  { name: "runbook_url", kind: "url", maxLength: URL_MAX, copyable: true },
  {
    name: "documentation_url",
    kind: "url",
    maxLength: URL_MAX,
    copyable: true,
  },
  { name: "repository_url", kind: "url", maxLength: URL_MAX, copyable: true },
  {
    name: "cicd_pipeline_url",
    kind: "url",
    maxLength: URL_MAX,
    copyable: true,
  },
  { name: "backup_enabled", kind: "boolean" },
  { name: "disaster_recovery_enabled", kind: "boolean" },
  { name: "disaster_recovery_environment", kind: "text" },
  { name: "rpo", kind: "text", maxLength: 50 },
  { name: "rto", kind: "text", maxLength: 50 },
  { name: "operational_notes", kind: "notes", maxLength: NOTES_MAX, wide: true },
]

export const INFRASTRUCTURE_SECTIONS: readonly InfraSectionDef[] = [
  { key: "hosting", fields: HOSTING_FIELDS },
  { key: "internet", fields: INTERNET_FIELDS },
  { key: "operational", fields: OPERATIONAL_FIELDS },
]

export const INFRASTRUCTURE_COLLECTIONS: readonly InfraCollectionDef[] = [
  {
    key: "servers",
    titleField: "server_name",
    summaryFields: ["private_ip", "server_role", "status"],
    fields: [
      { name: "server_name", kind: "text" },
      { name: "node_name", kind: "text" },
      { name: "private_ip", kind: "ip", copyable: true },
      { name: "public_ip", kind: "ip", copyable: true },
      { name: "management_ip", kind: "ip", copyable: true },
      { name: "operating_system", kind: "text" },
      { name: "server_role", kind: "text" },
      { name: "cpu", kind: "text", maxLength: 100 },
      { name: "memory", kind: "text", maxLength: 100 },
      { name: "storage", kind: "text", maxLength: 100 },
      { name: "vm_name", kind: "text" },
      { name: "hostname", kind: "hostname", copyable: true },
      { name: "availability_zone", kind: "text" },
      { name: "status", kind: "text", maxLength: 100 },
      { name: "notes", kind: "notes", maxLength: NOTES_MAX, wide: true },
    ],
  },
  {
    key: "databases",
    titleField: "database_name",
    summaryFields: ["database_engine", "database_role", "hostname"],
    fields: [
      { name: "database_name", kind: "text" },
      { name: "database_type", kind: "text" },
      { name: "database_engine", kind: "text" },
      { name: "database_version", kind: "text", maxLength: 100 },
      { name: "database_role", kind: "select", options: DATABASE_ROLES },
      { name: "cluster_name", kind: "text" },
      { name: "cluster_ip", kind: "ip", copyable: true },
      { name: "hostname", kind: "hostname", copyable: true },
      { name: "private_ip", kind: "ip", copyable: true },
      { name: "port", kind: "port" },
      { name: "instance_name", kind: "text" },
      { name: "service_name", kind: "text" },
      { name: "database_schema", kind: "text" },
      { name: "ha_model", kind: "text" },
      { name: "read_write_role", kind: "text" },
      { name: "connection_type", kind: "text" },
      { name: "backup_policy", kind: "text" },
      { name: "database_owner", kind: "text" },
      { name: "secret_reference", kind: "text" },
      { name: "notes", kind: "notes", maxLength: NOTES_MAX, wide: true },
    ],
  },
  {
    key: "networks",
    titleField: "network_name",
    summaryFields: ["cidr", "security_zone", "port"],
    fields: [
      { name: "network_name", kind: "text" },
      { name: "network_type", kind: "text" },
      { name: "network_ip", kind: "ip", copyable: true },
      { name: "cidr", kind: "cidr", maxLength: 60, copyable: true },
      { name: "subnet", kind: "text", copyable: true },
      { name: "vlan", kind: "text", maxLength: 50 },
      { name: "security_zone", kind: "text" },
      { name: "source_network", kind: "text" },
      { name: "destination_network", kind: "text" },
      { name: "protocol", kind: "text", maxLength: 30 },
      { name: "port", kind: "port" },
      { name: "firewall_requirement", kind: "text" },
      { name: "network_route", kind: "text" },
      { name: "gateway", kind: "ip", copyable: true },
      { name: "dns_server", kind: "ip", copyable: true },
      { name: "notes", kind: "notes", maxLength: NOTES_MAX, wide: true },
    ],
  },
  {
    key: "dns_records",
    titleField: "dns_name",
    summaryFields: ["fqdn", "record_type", "dns_scope"],
    fields: [
      { name: "dns_name", kind: "text", copyable: true },
      { name: "fqdn", kind: "hostname", copyable: true },
      { name: "record_type", kind: "text", maxLength: 20 },
      { name: "dns_scope", kind: "select", options: DNS_SCOPES },
      { name: "target", kind: "text", copyable: true },
      { name: "port", kind: "port" },
      { name: "protocol", kind: "text", maxLength: 30 },
      { name: "tls_enabled", kind: "boolean" },
      { name: "certificate_name", kind: "text" },
      { name: "certificate_expires_at", kind: "date" },
      { name: "notes", kind: "notes", maxLength: NOTES_MAX, wide: true },
    ],
  },
  {
    key: "listeners",
    titleField: "listener_name",
    summaryFields: ["listener_ip", "port", "protocol"],
    fields: [
      { name: "listener_name", kind: "text" },
      { name: "listener_ip", kind: "ip", copyable: true },
      { name: "port", kind: "port" },
      { name: "protocol", kind: "text", maxLength: 30 },
      { name: "tls_enabled", kind: "boolean" },
      { name: "certificate_reference", kind: "text" },
      { name: "backend_pool", kind: "text" },
      { name: "health_check_path", kind: "text" },
      { name: "health_check_port", kind: "port" },
      { name: "health_check_protocol", kind: "text", maxLength: 30 },
      {
        name: "persistence_config",
        kind: "notes",
        maxLength: NOTES_MAX,
        wide: true,
      },
      { name: "notes", kind: "notes", maxLength: NOTES_MAX, wide: true },
    ],
  },
  {
    key: "load_balancers",
    titleField: "lb_name",
    summaryFields: ["lb_type", "vip_ip", "vip_visibility"],
    fields: [
      { name: "lb_type", kind: "select", options: LOAD_BALANCER_TYPES },
      { name: "lb_name", kind: "text" },
      { name: "f5_partition", kind: "text" },
      { name: "vip_name", kind: "text" },
      { name: "vip_ip", kind: "ip", copyable: true },
      { name: "vip_visibility", kind: "select", options: VIP_VISIBILITIES },
      { name: "listener_port", kind: "port" },
      { name: "protocol", kind: "text", maxLength: 30 },
      { name: "pool_name", kind: "text" },
      {
        name: "pool_members",
        kind: "notes",
        maxLength: NOTES_MAX,
        wide: true,
      },
      { name: "health_monitor", kind: "text" },
      { name: "ssl_profile", kind: "text" },
      { name: "persistence_profile", kind: "text" },
      { name: "lb_method", kind: "text" },
      { name: "active_standby_status", kind: "text" },
      { name: "notes", kind: "notes", maxLength: NOTES_MAX, wide: true },
    ],
  },
  {
    key: "integrations",
    titleField: "integration_name",
    summaryFields: ["source_system", "destination_system", "direction"],
    fields: [
      { name: "integration_name", kind: "text" },
      { name: "source_system", kind: "text" },
      { name: "destination_system", kind: "text" },
      {
        name: "direction",
        kind: "select",
        options: INTEGRATION_DIRECTIONS,
      },
      { name: "api_url", kind: "url", maxLength: URL_MAX, copyable: true },
      { name: "api_gateway", kind: "text" },
      { name: "protocol", kind: "text", maxLength: 30 },
      { name: "port", kind: "port" },
      { name: "authentication_type", kind: "text" },
      { name: "data_classification", kind: "text" },
      { name: "timeout", kind: "number" },
      { name: "retry_policy", kind: "text" },
      { name: "owner", kind: "text" },
      { name: "secret_reference", kind: "text" },
      { name: "notes", kind: "notes", maxLength: NOTES_MAX, wide: true },
    ],
  },
  {
    key: "message_brokers",
    titleField: "broker_name",
    summaryFields: ["broker_type", "topic", "queue"],
    fields: [
      { name: "broker_name", kind: "text" },
      { name: "broker_type", kind: "text" },
      { name: "cluster_name", kind: "text" },
      { name: "broker_url", kind: "text", maxLength: URL_MAX, copyable: true },
      { name: "topic", kind: "text", copyable: true },
      { name: "queue", kind: "text", copyable: true },
      { name: "consumer_group", kind: "text" },
      { name: "port", kind: "port" },
      { name: "tls_enabled", kind: "boolean" },
      { name: "owner", kind: "text" },
      { name: "notes", kind: "notes", maxLength: NOTES_MAX, wide: true },
    ],
  },
  {
    key: "storage_resources",
    titleField: "storage_name",
    summaryFields: ["storage_type", "capacity", "mount_path"],
    fields: [
      { name: "storage_name", kind: "text" },
      { name: "storage_type", kind: "text" },
      {
        name: "storage_endpoint",
        kind: "text",
        maxLength: URL_MAX,
        copyable: true,
      },
      { name: "mount_path", kind: "text", maxLength: 500, copyable: true },
      { name: "capacity", kind: "text", maxLength: 100 },
      { name: "replication", kind: "text" },
      { name: "backup_enabled", kind: "boolean" },
      { name: "retention_period", kind: "text", maxLength: 100 },
      { name: "owner", kind: "text" },
      { name: "notes", kind: "notes", maxLength: NOTES_MAX, wide: true },
    ],
  },
]

/**
 * Fields the API omits from `internet` without
 * `application-infrastructure.view-public`.
 */
export const PUBLIC_ENDPOINT_FIELDS: readonly string[] = [
  "public_ip",
  "public_domain",
  "public_url",
]

/**
 * Fields the API omits from `operational` without
 * `application-infrastructure.view-operational`.
 */
export const OPERATIONAL_MONITORING_FIELDS: readonly string[] = [
  "monitoring_enabled",
  "monitoring_tool",
  "logging_enabled",
  "logging_platform",
  "apm_tool",
  "dashboard_url",
  "health_check_url",
  "runbook_url",
  "cicd_pipeline_url",
  "operational_notes",
]

export type InfrastructureFieldVisibility = {
  canViewPublic: boolean
  canViewOperational: boolean
}

export function visibleSectionFields(
  section: InfraSectionDef,
  visibility: InfrastructureFieldVisibility
): readonly InfraFieldDef[] {
  if (section.key === "internet" && !visibility.canViewPublic) {
    return section.fields.filter(
      (field) => !PUBLIC_ENDPOINT_FIELDS.includes(field.name)
    )
  }

  if (section.key === "operational" && !visibility.canViewOperational) {
    return section.fields.filter(
      (field) => !OPERATIONAL_MONITORING_FIELDS.includes(field.name)
    )
  }

  return section.fields
}

/** Options rendered by `select` fields, grouped by the enum they belong to. */
export const INFRA_ENUM_TRANSLATION_GROUPS: Record<string, string> = {
  database_role: "databaseRole",
  dns_scope: "dnsScope",
  lb_type: "loadBalancerType",
  vip_visibility: "vipVisibility",
  direction: "integrationDirection",
}

export function defaultFieldMaxLength(field: InfraFieldDef): number {
  if (field.maxLength) {
    return field.maxLength
  }

  if (field.kind === "notes") {
    return NOTES_MAX
  }

  if (field.kind === "url") {
    return URL_MAX
  }

  if (field.kind === "hostname") {
    return 253
  }

  return 255
}
