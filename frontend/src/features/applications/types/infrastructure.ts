export const DATABASE_ROLES = ["primary", "replica", "standby"] as const
export const DNS_SCOPES = ["internal", "external"] as const
export const LOAD_BALANCER_TYPES = [
  "f5",
  "cloud",
  "nginx",
  "haproxy",
  "other",
] as const
export const VIP_VISIBILITIES = ["private", "public"] as const
export const INTEGRATION_DIRECTIONS = [
  "inbound",
  "outbound",
  "bidirectional",
] as const

export type DatabaseRole = (typeof DATABASE_ROLES)[number]
export type DnsScope = (typeof DNS_SCOPES)[number]
export type LoadBalancerType = (typeof LOAD_BALANCER_TYPES)[number]
export type VipVisibility = (typeof VIP_VISIBILITIES)[number]
export type IntegrationDirection = (typeof INTEGRATION_DIRECTIONS)[number]

export type EnvironmentSummary = {
  id: number
  code: string
  name_en: string
  name_ar: string
  sort_order: number
  is_active: boolean
}

export type InfrastructureComponentMeta = {
  id: number
  application_environment_id: number
  sort_order: number | null
  created_by: number | null
  updated_by: number | null
  created_at: string | null
  updated_at: string | null
}

export type ApplicationServer = InfrastructureComponentMeta & {
  server_name: string | null
  node_name: string | null
  private_ip: string | null
  public_ip: string | null
  management_ip: string | null
  operating_system: string | null
  server_role: string | null
  cpu: string | null
  memory: string | null
  storage: string | null
  vm_name: string | null
  hostname: string | null
  availability_zone: string | null
  status: string | null
  notes: string | null
}

export type ApplicationDatabase = InfrastructureComponentMeta & {
  database_name: string | null
  database_type: string | null
  database_engine: string | null
  database_version: string | null
  database_role: DatabaseRole | null
  cluster_name: string | null
  cluster_ip: string | null
  hostname: string | null
  private_ip: string | null
  port: number | null
  instance_name: string | null
  service_name: string | null
  database_schema: string | null
  ha_model: string | null
  read_write_role: string | null
  connection_type: string | null
  backup_policy: string | null
  database_owner: string | null
  secret_reference: string | null
  notes: string | null
}

export type ApplicationNetwork = InfrastructureComponentMeta & {
  network_name: string | null
  network_type: string | null
  network_ip: string | null
  cidr: string | null
  subnet: string | null
  vlan: string | null
  security_zone: string | null
  source_network: string | null
  destination_network: string | null
  protocol: string | null
  port: number | null
  firewall_requirement: string | null
  network_route: string | null
  gateway: string | null
  dns_server: string | null
  notes: string | null
}

export type ApplicationDnsRecord = InfrastructureComponentMeta & {
  dns_name: string | null
  fqdn: string | null
  record_type: string | null
  dns_scope: DnsScope | null
  target: string | null
  port: number | null
  protocol: string | null
  tls_enabled: boolean | null
  certificate_name: string | null
  certificate_expires_at: string | null
  notes: string | null
}

export type ApplicationListener = InfrastructureComponentMeta & {
  listener_name: string | null
  listener_ip: string | null
  port: number | null
  protocol: string | null
  tls_enabled: boolean | null
  certificate_reference: string | null
  backend_pool: string | null
  health_check_path: string | null
  health_check_port: number | null
  health_check_protocol: string | null
  persistence_config: string | null
  notes: string | null
}

export type ApplicationLoadBalancer = InfrastructureComponentMeta & {
  lb_type: LoadBalancerType | null
  lb_name: string | null
  f5_partition: string | null
  vip_name: string | null
  vip_ip: string | null
  vip_visibility: VipVisibility | null
  listener_port: number | null
  protocol: string | null
  pool_name: string | null
  pool_members: string | null
  health_monitor: string | null
  ssl_profile: string | null
  persistence_profile: string | null
  lb_method: string | null
  active_standby_status: string | null
  notes: string | null
}

export type ApplicationIntegration = InfrastructureComponentMeta & {
  integration_name: string | null
  source_system: string | null
  destination_system: string | null
  direction: IntegrationDirection | null
  api_url: string | null
  api_gateway: string | null
  protocol: string | null
  port: number | null
  authentication_type: string | null
  data_classification: string | null
  timeout: number | null
  retry_policy: string | null
  owner: string | null
  secret_reference: string | null
  notes: string | null
}

export type ApplicationMessageBroker = InfrastructureComponentMeta & {
  broker_name: string | null
  broker_type: string | null
  cluster_name: string | null
  broker_url: string | null
  topic: string | null
  queue: string | null
  consumer_group: string | null
  port: number | null
  tls_enabled: boolean | null
  owner: string | null
  notes: string | null
}

export type ApplicationStorageResource = InfrastructureComponentMeta & {
  storage_name: string | null
  storage_type: string | null
  storage_endpoint: string | null
  mount_path: string | null
  capacity: string | null
  replication: string | null
  backup_enabled: boolean | null
  retention_period: string | null
  owner: string | null
  notes: string | null
}

export type EnvironmentHostingSection = {
  hosting_model: string | null
  deployment_type: string | null
  cloud_provider: string | null
  cloud_account: string | null
  region: string | null
  availability_zone: string | null
  data_center: string | null
  cluster_name: string | null
  cluster_ip: string | null
  namespace: string | null
  resource_group: string | null
  tenant: string | null
  network_zone: string | null
  notes: string | null
}

/**
 * `public_ip`, `public_domain` and `public_url` are omitted by the API when the
 * caller lacks `application-infrastructure.view-public`, which is why they are
 * optional rather than nullable only.
 */
export type EnvironmentInternetSection = {
  published_to_internet: boolean | null
  public_ip?: string | null
  public_domain?: string | null
  public_url?: string | null
  internet_facing_lb: string | null
  waf_enabled: boolean | null
  waf_provider: string | null
  cdn_enabled: boolean | null
  cdn_provider: string | null
  tls_certificate: string | null
  external_port: number | null
  exposure_type: string | null
  publication_owner: string | null
  internet_notes: string | null
}

/**
 * Monitoring and observability fields are omitted by the API when the caller
 * lacks `application-infrastructure.view-operational`.
 */
export type EnvironmentOperationalSection = {
  monitoring_enabled?: boolean | null
  monitoring_tool?: string | null
  logging_enabled?: boolean | null
  logging_platform?: string | null
  apm_tool?: string | null
  dashboard_url?: string | null
  health_check_url?: string | null
  support_team: string | null
  operations_owner: string | null
  on_call_group: string | null
  runbook_url?: string | null
  documentation_url: string | null
  repository_url: string | null
  cicd_pipeline_url?: string | null
  backup_enabled: boolean | null
  disaster_recovery_enabled: boolean | null
  disaster_recovery_environment: string | null
  rpo: string | null
  rto: string | null
  operational_notes?: string | null
}

export type ApplicationEnvironmentProfile = {
  id: number
  application_id: number
  environment_id: number
  hosting: EnvironmentHostingSection
  internet: EnvironmentInternetSection
  operational: EnvironmentOperationalSection
  servers: ApplicationServer[]
  databases: ApplicationDatabase[]
  networks: ApplicationNetwork[]
  dns_records: ApplicationDnsRecord[]
  listeners: ApplicationListener[]
  load_balancers: ApplicationLoadBalancer[]
  integrations: ApplicationIntegration[]
  message_brokers: ApplicationMessageBroker[]
  storage_resources: ApplicationStorageResource[]
  created_by: number | null
  updated_by: number | null
  created_at: string | null
  updated_at: string | null
}

export type ApplicationInfrastructureEnvironment = {
  environment: EnvironmentSummary
  profile: ApplicationEnvironmentProfile | null
}

export type ApplicationInfrastructure = {
  application: {
    id: number
    code: string
    name_en: string
    name_ar: string
  }
  environments: ApplicationInfrastructureEnvironment[]
}

export type InfrastructureCollectionKey =
  | "servers"
  | "databases"
  | "networks"
  | "dns_records"
  | "listeners"
  | "load_balancers"
  | "integrations"
  | "message_brokers"
  | "storage_resources"

export type InfrastructureSectionKey = "hosting" | "internet" | "operational"

export type UpsertEnvironmentPayloadValue = string | number | boolean | null

export type UpsertEnvironmentSectionPayload = Record<
  string,
  UpsertEnvironmentPayloadValue
>

export type UpsertEnvironmentRowPayload = Record<
  string,
  UpsertEnvironmentPayloadValue | undefined
>

export type UpsertEnvironmentPayload = {
  sync: boolean
  hosting: UpsertEnvironmentSectionPayload
  internet: UpsertEnvironmentSectionPayload
  operational: UpsertEnvironmentSectionPayload
} & Record<InfrastructureCollectionKey, UpsertEnvironmentRowPayload[]>

export type CopyEnvironmentPayload = {
  source_environment_id: number
  target_environment_id: number
  overwrite: boolean
}

export function environmentLabel(
  environment: EnvironmentSummary,
  isArabic: boolean
): string {
  return isArabic ? environment.name_ar : environment.name_en
}
