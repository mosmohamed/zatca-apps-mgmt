# Application Infrastructure

## Purpose

Describes where an application actually runs, per environment. For every application and every
environment (DEV / TEST / STG / PROD) the system stores one *environment profile* covering hosting,
internet exposure and operations, plus nine normalized child collections: servers, databases,
networks, DNS records, listeners, load balancers, integrations, message brokers and storage
resources.

The module is read as one tree, written one environment at a time, and a completed environment can
be cloned into another environment so that PROD does not have to be typed from scratch after STG is
finished.

**No secret values are ever stored or returned.** `secret_reference` on databases and integrations
is an opaque pointer into the secret store (a vault path, a key name), never a password, token or
API key.

## Database changes

### Master data: `environments`

Migration `2026_07_28_140000_create_environments_table.php`.

| Column | Notes |
|---|---|
| `id` | auto increment |
| `code` | unique, `DEV` / `TEST` / `STG` / `PROD` |
| `name_en`, `name_ar` | localized labels |
| `sort_order` | indexed, drives the display order |
| `is_active` | indexed |
| `created_at` / `updated_at` | timestamps |

Seeded by `EnvironmentSeeder`, which runs from `DatabaseSeeder` right after `PermissionSeeder`.

### Environment profile: `application_environments`

Migration `2026_07_28_140100_create_application_environments_table.php`. One row per
application/environment pair, with a unique index on `(application_id, environment_id)`. Soft
deleted, and `created_by` / `updated_by` track ownership.

| Group | Columns |
|---|---|
| Hosting | `hosting_model`, `deployment_type`, `cloud_provider`, `cloud_account`, `region`, `availability_zone`, `data_center`, `cluster_name`, `cluster_ip`, `namespace`, `resource_group`, `tenant`, `network_zone`, `notes` |
| Internet publishing | `published_to_internet` (indexed), `public_ip`, `public_domain`, `public_url`, `internet_facing_lb`, `waf_enabled`, `waf_provider`, `cdn_enabled`, `cdn_provider`, `tls_certificate`, `external_port`, `exposure_type`, `publication_owner`, `internet_notes` |
| Monitoring & operations | `monitoring_enabled`, `monitoring_tool`, `logging_enabled`, `logging_platform`, `apm_tool`, `dashboard_url`, `health_check_url`, `support_team`, `operations_owner`, `on_call_group`, `runbook_url`, `documentation_url`, `repository_url`, `cicd_pipeline_url`, `backup_enabled`, `disaster_recovery_enabled`, `disaster_recovery_environment`, `rpo`, `rto`, `operational_notes` |

`application_id` cascades on delete, `environment_id` is restricted so master data cannot be
removed while it is still referenced. URL columns are `TEXT` rather than long `VARCHAR`s to keep the
InnoDB row size within limits.

### Child tables

Migration `2026_07_28_140200_create_application_infrastructure_tables.php` creates the nine child
tables. Each one carries `application_environment_id` (FK, cascade on delete), `sort_order`,
`created_by`, `updated_by`, timestamps, soft deletes and a composite index on
`(application_environment_id, sort_order)`.

| Table | Columns |
|---|---|
| `application_servers` | `server_name`, `node_name`, `private_ip`, `public_ip`, `management_ip`, `operating_system`, `server_role`, `cpu`, `memory`, `storage`, `vm_name`, `hostname`, `availability_zone`, `status`, `notes` |
| `application_databases` | `database_name`, `database_type`, `database_engine`, `database_version`, `database_role`, `cluster_name`, `cluster_ip`, `hostname`, `private_ip`, `port`, `instance_name`, `service_name`, `database_schema`, `ha_model`, `read_write_role`, `connection_type`, `backup_policy`, `database_owner`, `secret_reference`, `notes` |
| `application_networks` | `network_name`, `network_type`, `network_ip`, `cidr`, `subnet`, `vlan`, `security_zone`, `source_network`, `destination_network`, `protocol`, `port`, `firewall_requirement`, `network_route`, `gateway`, `dns_server`, `notes` |
| `application_dns_records` | `dns_name`, `fqdn`, `record_type`, `dns_scope`, `target`, `port`, `protocol`, `tls_enabled`, `certificate_name`, `certificate_expires_at`, `notes` |
| `application_listeners` | `listener_name`, `listener_ip`, `port`, `protocol`, `tls_enabled`, `certificate_reference`, `backend_pool`, `health_check_path`, `health_check_port`, `health_check_protocol`, `persistence_config`, `notes` |
| `application_load_balancers` | `lb_type`, `lb_name`, `f5_partition`, `vip_name`, `vip_ip`, `vip_visibility`, `listener_port`, `protocol`, `pool_name`, `pool_members`, `health_monitor`, `ssl_profile`, `persistence_profile`, `lb_method`, `active_standby_status`, `notes` |
| `application_integrations` | `integration_name`, `source_system`, `destination_system`, `direction`, `api_url`, `api_gateway`, `protocol`, `port`, `authentication_type`, `data_classification`, `timeout`, `retry_policy`, `owner`, `secret_reference`, `notes` |
| `application_message_brokers` | `broker_name`, `broker_type`, `cluster_name`, `broker_url`, `topic`, `queue`, `consumer_group`, `port`, `tls_enabled`, `owner`, `notes` |
| `application_storage_resources` | `storage_name`, `storage_type`, `storage_endpoint`, `mount_path`, `capacity`, `replication`, `backup_enabled`, `retention_period`, `owner`, `notes` |

### Constrained values

Backed enums keep the constrained columns honest:

| Column | Enum | Values |
|---|---|---|
| `database_role` | `App\Enums\DatabaseRole` | `primary`, `replica`, `standby` |
| `dns_scope` | `App\Enums\DnsScope` | `internal`, `external` |
| `lb_type` | `App\Enums\LoadBalancerType` | `f5`, `cloud`, `nginx`, `haproxy`, `other` |
| `vip_visibility` | `App\Enums\VipVisibility` | `private`, `public` |
| `direction` | `App\Enums\IntegrationDirection` | `inbound`, `outbound`, `bidirectional` |

## API endpoints

All endpoints live under `/api/v1` and require `auth:sanctum`.

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/applications/{application}/infrastructure` | Full tree: every environment with its profile or `null` |
| `PUT` | `/applications/{application}/environments/{environment}` | Upserts one environment profile and synchronises the nested collections |
| `DELETE` | `/applications/{application}/environments/{environment}` | Soft deletes one environment profile with all its components |
| `POST` | `/applications/{application}/infrastructure/copy-environment` | Clones one environment profile into another |

### GET the infrastructure tree

```json
{
  "success": true,
  "message": "Application infrastructure retrieved successfully.",
  "data": {
    "application": { "id": 12, "code": "APP-001", "name_en": "Taxpayer Portal", "name_ar": "بوابة المكلفين" },
    "environments": [
      {
        "environment": { "id": 1, "code": "DEV", "name_en": "Development", "name_ar": "التطوير", "sort_order": 1, "is_active": true },
        "profile": null
      },
      {
        "environment": { "id": 4, "code": "PROD", "name_en": "Production", "name_ar": "الإنتاج", "sort_order": 4, "is_active": true },
        "profile": {
          "id": 7,
          "application_id": 12,
          "environment_id": 4,
          "hosting": { "hosting_model": "Private Cloud", "cluster_ip": "10.20.30.40", "namespace": "zatca-prod" },
          "internet": { "published_to_internet": true, "public_url": "https://portal.zatca.gov.sa" },
          "operational": { "monitoring_enabled": true, "monitoring_tool": "Zabbix" },
          "servers": [ { "id": 31, "server_name": "prod-app-01", "private_ip": "10.20.30.41", "sort_order": 0 } ],
          "databases": [], "networks": [], "dns_records": [], "listeners": [],
          "load_balancers": [], "integrations": [], "message_brokers": [], "storage_resources": []
        }
      }
    ],
    "errors": null
  }
}
```

The environment list comes from the master table: every active environment, plus any inactive
environment that already has a profile, ordered by `sort_order` then `code`. Nested collections are
ordered by `sort_order` then `id`.

### PUT an environment profile

The body accepts the three flat sections and the nine collections. Every key is optional, so a
partial save only touches what it sends.

```json
{
  "sync": true,
  "hosting": { "hosting_model": "Private Cloud", "cluster_ip": "10.20.30.40", "namespace": "zatca-prod" },
  "internet": {
    "published_to_internet": true,
    "public_ip": "203.0.113.10",
    "public_domain": "portal.zatca.gov.sa",
    "public_url": "https://portal.zatca.gov.sa",
    "exposure_type": "Reverse Proxy",
    "waf_enabled": true,
    "external_port": 443
  },
  "operational": { "monitoring_enabled": true, "monitoring_tool": "Zabbix", "rpo": "15 minutes", "rto": "1 hour" },
  "servers": [
    { "id": 31, "server_name": "prod-app-01", "private_ip": "10.20.30.41", "sort_order": 0 },
    { "server_name": "prod-app-02", "private_ip": "10.20.30.42", "sort_order": 1 }
  ],
  "databases": [ { "database_name": "PORTALDB", "database_role": "primary", "port": 1521, "secret_reference": "vault://prod/portal/db" } ],
  "networks": [], "dns_records": [], "listeners": [],
  "load_balancers": [], "integrations": [], "message_brokers": [], "storage_resources": []
}
```

The response is the saved profile in the same shape as the `profile` object above.

#### Collection synchronisation

A collection is only touched when its key is present in the body. For a collection that is present:

- a row **with** `id` updates that row,
- a row **without** `id` creates a new one,
- rows that exist in the database but are missing from the payload are **soft deleted**.

`sync: false` disables the last step, so a payload can add and update rows without removing
anything. `sync` defaults to `true`.

`sort_order` is taken from the payload when supplied, otherwise from the position of the row in the
array.

An `id` is only accepted when the row already belongs to this exact application/environment profile,
so ids cannot be used to reach into another application's data.

### DELETE an environment profile

Soft deletes the profile and every component underneath it, so the removal is auditable and the rows
remain restorable. A later `PUT` on the same environment restores the profile in place and keeps its
original id. Deleting an environment that has no profile is rejected with `422`.

### POST copy-environment

```json
{
  "source_environment_id": 3,
  "target_environment_id": 4,
  "overwrite": true
}
```

The source profile is copied field by field into the target, and the target's existing child rows
are soft deleted and replaced with copies of the source rows. `created_by` / `updated_by` on the
copies point at the user who performed the copy.

The operation is rejected with `422` when:

- the source and target are the same environment (`different` validation rule),
- the source environment has no profile yet,
- the target environment already has a profile and `overwrite` is not `true`.

## Validation

All validation lives in `App\Http\Requests\ApplicationInfrastructure\*` and every message is
localized through `messages.validation.*`.

| Kind | Rule |
|---|---|
| IP addresses | `ip` — `cluster_ip`, `public_ip`, `private_ip`, `management_ip`, `gateway`, `dns_server`, `listener_ip`, `vip_ip`, `network_ip` |
| Networks | `App\Rules\Cidr` — IPv4 and IPv6 CIDR notation with a plausible prefix length |
| Host names | `App\Rules\Hostname` — `public_domain`, `hostname`, `fqdn`; max 253 characters |
| Ports | integer between `1` and `65535` |
| URLs | `url`, max 2048 characters |
| Constrained values | `in` against the matching enum |
| Notes / free text | max 5000 characters |

Publishing to the internet is guarded: when `internet.published_to_internet` is `true`, the fields
`public_domain`, `public_url` and `exposure_type` become required.

Loosely typed booleans (`"1"`, `"true"`, `"on"`, `0`) are normalized to real booleans before
validation by `App\Http\Requests\Concerns\NormalizesBooleanInput`, so conditional rules behave the
same for every client.

## Permissions

| Permission | Grants |
|---|---|
| `application-infrastructure.view` | Read the infrastructure tree |
| `application-infrastructure.create` | `PUT` an environment that has no profile yet |
| `application-infrastructure.update` | `PUT` an environment that already has a profile |
| `application-infrastructure.delete` | `DELETE` an environment profile |
| `application-infrastructure.view-public` | See `public_ip`, `public_domain`, `public_url` |
| `application-infrastructure.view-operational` | See the monitoring and observability fields |
| `application-infrastructure.copy-environment` | `POST` copy-environment |

Authorization is resolved through `App\Policies\ApplicationInfrastructurePolicy`, registered against
`App\Models\ApplicationEnvironment` in `AppServiceProvider`. `super_admin` holds all of them;
`employee` holds only `application-infrastructure.view`.

`PUT` picks its ability from the current state: describing an environment for the first time needs
`create`, changing an environment that already has an active profile needs `update`. Restoring a soft
deleted profile counts as a create.

### Field level masking

`ApplicationEnvironmentResource` removes fields the caller may not see, rather than nulling them, so
the frontend can distinguish "not permitted" from "not filled in":

- without `view-public`: `public_ip`, `public_domain`, `public_url` are omitted from `internet`,
- without `view-operational`: `monitoring_enabled`, `monitoring_tool`, `logging_enabled`,
  `logging_platform`, `apm_tool`, `dashboard_url`, `health_check_url`, `runbook_url`,
  `cicd_pipeline_url` and `operational_notes` are omitted from `operational`.

Ownership fields (`support_team`, `operations_owner`, `on_call_group`) stay visible, because knowing
who to contact is not sensitive.

## Audit logging

`ApplicationEnvironment` and every component model use `spatie/laravel-activitylog` with
`logFillable()`, `logOnlyDirty()` and `dontSubmitEmptyLogs()`, so creates, updates, soft deletes and
restores of profiles and components are recorded automatically under the default log name.

The copy operation additionally writes an explicit entry under the `application_infrastructure` log
name with the description `application_infrastructure.environment_copied`, carrying the application
id, both environment ids and the `overwrite` flag in its properties.

## Backend components

| Layer | Files |
|---|---|
| Migrations | `2026_07_28_140000_create_environments_table.php`, `2026_07_28_140100_create_application_environments_table.php`, `2026_07_28_140200_create_application_infrastructure_tables.php` |
| Models | `Environment`, `ApplicationEnvironment`, abstract `InfrastructureComponent`, and `ApplicationServer`, `ApplicationDatabase`, `ApplicationNetwork`, `ApplicationDnsRecord`, `ApplicationListener`, `ApplicationLoadBalancer`, `ApplicationIntegration`, `ApplicationMessageBroker`, `ApplicationStorageResource`; `Application::applicationEnvironments()` |
| Enums | `DatabaseRole`, `DnsScope`, `LoadBalancerType`, `VipVisibility`, `IntegrationDirection` |
| Rules | `App\Rules\Cidr`, `App\Rules\Hostname` |
| Requests | `UpsertApplicationEnvironmentRequest`, `CopyApplicationEnvironmentRequest`, concerns `HasInfrastructureValidationMessages` and `NormalizesBooleanInput` |
| Service | `App\Services\ApplicationInfrastructureService` |
| Policy | `App\Policies\ApplicationInfrastructurePolicy` |
| Resources | `ApplicationInfrastructureResource`, `ApplicationEnvironmentResource`, `EnvironmentResource`, one resource per component, concern `SerializesInfrastructureComponent` |
| Controller | `App\Http\Controllers\Api\V1\ApplicationInfrastructureController` |
| Seeder | `Database\Seeders\EnvironmentSeeder` |
| Tests | `tests/Feature/ApplicationInfrastructureFeatureTest.php` |

Every multi-row write (profile upsert with nested sync, environment copy) runs inside
`DB::transaction`. Reads eager load all nine collections in a single pass, so the tree endpoint
stays free of N+1 queries under `Model::preventLazyLoading`.
