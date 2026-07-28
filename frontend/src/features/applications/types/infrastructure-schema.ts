import type { TFunction } from "i18next"
import { z } from "zod"

import {
  INFRASTRUCTURE_COLLECTIONS,
  INFRASTRUCTURE_SECTIONS,
  defaultFieldMaxLength,
  visibleSectionFields,
  type InfraFieldDef,
  type InfrastructureFieldVisibility,
} from "@/features/applications/types/infrastructure-fields"
import type {
  ApplicationEnvironmentProfile,
  InfrastructureCollectionKey,
  UpsertEnvironmentPayload,
  UpsertEnvironmentRowPayload,
  UpsertEnvironmentSectionPayload,
} from "@/features/applications/types/infrastructure"

export type InfraFieldValue = string | number | boolean | null

export type InfraSectionValues = Record<string, InfraFieldValue>

export type InfraRowValues = Record<string, InfraFieldValue>

export type EnvironmentProfileFormValues = {
  hosting: InfraSectionValues
  internet: InfraSectionValues
  operational: InfraSectionValues
  servers: InfraRowValues[]
  databases: InfraRowValues[]
  networks: InfraRowValues[]
  dns_records: InfraRowValues[]
  listeners: InfraRowValues[]
  load_balancers: InfraRowValues[]
  integrations: InfraRowValues[]
  message_brokers: InfraRowValues[]
  storage_resources: InfraRowValues[]
}

/** Form key holding the persisted row id, kept out of the way of `useFieldArray`. */
export const ROW_ID_KEY = "record_id"

const IPV4_PATTERN =
  /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/
const IPV6_SEGMENT = "[0-9a-fA-F]{1,4}"
const IPV6_PATTERN = new RegExp(
  `^(` +
    `(${IPV6_SEGMENT}:){7}${IPV6_SEGMENT}|` +
    `(${IPV6_SEGMENT}:){1,7}:|` +
    `(${IPV6_SEGMENT}:){1,6}:${IPV6_SEGMENT}|` +
    `(${IPV6_SEGMENT}:){1,5}(:${IPV6_SEGMENT}){1,2}|` +
    `(${IPV6_SEGMENT}:){1,4}(:${IPV6_SEGMENT}){1,3}|` +
    `(${IPV6_SEGMENT}:){1,3}(:${IPV6_SEGMENT}){1,4}|` +
    `(${IPV6_SEGMENT}:){1,2}(:${IPV6_SEGMENT}){1,5}|` +
    `${IPV6_SEGMENT}:(:${IPV6_SEGMENT}){1,6}|` +
    `:((:${IPV6_SEGMENT}){1,7}|:)` +
    `)$`
)
const HOSTNAME_PATTERN =
  /^(?!-)[A-Za-z0-9-]{1,63}(?<!-)(\.(?!-)[A-Za-z0-9-]{1,63}(?<!-))*\.?$/
const URL_PATTERN = /^https?:\/\/[^\s]+$/i

function isIpAddress(value: string): boolean {
  return IPV4_PATTERN.test(value) || IPV6_PATTERN.test(value)
}

function isHostname(value: string): boolean {
  return value.length <= 253 && HOSTNAME_PATTERN.test(value)
}

function isCidr(value: string): boolean {
  const [address, prefix] = value.split("/")

  if (!address || prefix === undefined || !/^\d{1,3}$/.test(prefix)) {
    return false
  }

  const prefixLength = Number(prefix)

  if (IPV4_PATTERN.test(address)) {
    return prefixLength <= 32
  }

  if (IPV6_PATTERN.test(address)) {
    return prefixLength <= 128
  }

  return false
}

function asTrimmedString(value: InfraFieldValue): string {
  if (typeof value === "string") {
    return value.trim()
  }

  if (typeof value === "number") {
    return String(value)
  }

  return ""
}

const fieldValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
])

const sectionSchema = z.record(z.string(), fieldValueSchema)
const rowSchema = z.record(z.string(), fieldValueSchema)

type IssueContext = {
  addIssue: (path: (string | number)[], message: string) => void
}

function validateField(
  field: InfraFieldDef,
  value: InfraFieldValue,
  path: (string | number)[],
  t: TFunction,
  ctx: IssueContext
): void {
  if (field.kind === "boolean") {
    return
  }

  const raw = asTrimmedString(value)

  if (raw === "") {
    return
  }

  const maxLength = defaultFieldMaxLength(field)

  switch (field.kind) {
    case "ip":
      if (!isIpAddress(raw)) {
        ctx.addIssue(path, t("validation.ipInvalid"))
      }
      return
    case "hostname":
      if (!isHostname(raw)) {
        ctx.addIssue(path, t("validation.hostnameInvalid"))
      }
      return
    case "cidr":
      if (!isCidr(raw)) {
        ctx.addIssue(path, t("validation.cidrInvalid"))
      }
      return
    case "url":
      if (!URL_PATTERN.test(raw)) {
        ctx.addIssue(path, t("validation.urlInvalid"))
      } else if (raw.length > maxLength) {
        ctx.addIssue(path, t("validation.maxLength", { max: maxLength }))
      }
      return
    case "port": {
      const port = Number(raw)
      if (!Number.isInteger(port) || port < 1 || port > 65535) {
        ctx.addIssue(path, t("validation.portInvalid"))
      }
      return
    }
    case "number": {
      const numeric = Number(raw)
      if (!Number.isInteger(numeric) || numeric < 0) {
        ctx.addIssue(path, t("validation.integerInvalid"))
      }
      return
    }
    case "date":
      if (Number.isNaN(Date.parse(raw))) {
        ctx.addIssue(path, t("validation.dateInvalid"))
      }
      return
    case "select":
      if (field.options && !field.options.includes(raw)) {
        ctx.addIssue(path, t("validation.optionInvalid"))
      }
      return
    default:
      if (raw.length > maxLength) {
        ctx.addIssue(path, t("validation.maxLength", { max: maxLength }))
      }
  }
}

export function createEnvironmentProfileSchema(
  t: TFunction,
  visibility: InfrastructureFieldVisibility
) {
  return z
    .object({
      hosting: sectionSchema,
      internet: sectionSchema,
      operational: sectionSchema,
      servers: z.array(rowSchema),
      databases: z.array(rowSchema),
      networks: z.array(rowSchema),
      dns_records: z.array(rowSchema),
      listeners: z.array(rowSchema),
      load_balancers: z.array(rowSchema),
      integrations: z.array(rowSchema),
      message_brokers: z.array(rowSchema),
      storage_resources: z.array(rowSchema),
    })
    .superRefine((values, zodCtx) => {
      const ctx: IssueContext = {
        addIssue: (path, message) => {
          zodCtx.addIssue({ code: "custom", path, message })
        },
      }

      for (const section of INFRASTRUCTURE_SECTIONS) {
        const sectionValues = values[section.key]

        for (const field of visibleSectionFields(section, visibility)) {
          validateField(
            field,
            sectionValues[field.name] ?? null,
            [section.key, field.name],
            t,
            ctx
          )
        }
      }

      for (const collection of INFRASTRUCTURE_COLLECTIONS) {
        const rows = values[collection.key]

        rows.forEach((row, index) => {
          for (const field of collection.fields) {
            validateField(
              field,
              row[field.name] ?? null,
              [collection.key, index, field.name],
              t,
              ctx
            )
          }
        })
      }

      if (values.internet.published_to_internet !== true) {
        return
      }

      const requiredWhenPublished = visibility.canViewPublic
        ? ["public_domain", "public_url", "exposure_type"]
        : ["exposure_type"]

      for (const field of requiredWhenPublished) {
        if (asTrimmedString(values.internet[field] ?? null) === "") {
          ctx.addIssue(
            ["internet", field],
            t("validation.requiredWhenPublished")
          )
        }
      }
    })
}

function emptySectionValues(fields: readonly InfraFieldDef[]): InfraSectionValues {
  const values: InfraSectionValues = {}

  for (const field of fields) {
    values[field.name] = field.kind === "boolean" ? false : ""
  }

  return values
}

function toSectionValues(
  fields: readonly InfraFieldDef[],
  source: Record<string, unknown> | undefined
): InfraSectionValues {
  const values = emptySectionValues(fields)

  if (!source) {
    return values
  }

  for (const field of fields) {
    const value = source[field.name]

    if (field.kind === "boolean") {
      values[field.name] = value === true
      continue
    }

    values[field.name] =
      value === null || value === undefined ? "" : String(value)
  }

  return values
}

export function createEmptyRow(fields: readonly InfraFieldDef[]): InfraRowValues {
  const row: InfraRowValues = { [ROW_ID_KEY]: null }

  for (const field of fields) {
    row[field.name] = field.kind === "boolean" ? false : ""
  }

  return row
}

function toRowValues(
  fields: readonly InfraFieldDef[],
  source: Record<string, unknown>
): InfraRowValues {
  const row = createEmptyRow(fields)
  const id = source.id

  row[ROW_ID_KEY] = typeof id === "number" ? id : null

  for (const field of fields) {
    const value = source[field.name]

    if (field.kind === "boolean") {
      row[field.name] = value === true
      continue
    }

    if (field.kind === "date" && typeof value === "string") {
      row[field.name] = value.slice(0, 10)
      continue
    }

    row[field.name] = value === null || value === undefined ? "" : String(value)
  }

  return row
}

export function toEnvironmentProfileFormValues(
  profile: ApplicationEnvironmentProfile | null
): EnvironmentProfileFormValues {
  const sections = INFRASTRUCTURE_SECTIONS.reduce<
    Record<string, InfraSectionValues>
  >((accumulator, section) => {
    accumulator[section.key] = toSectionValues(
      section.fields,
      profile
        ? (profile[section.key] as unknown as Record<string, unknown>)
        : undefined
    )
    return accumulator
  }, {})

  const collections = INFRASTRUCTURE_COLLECTIONS.reduce<
    Record<string, InfraRowValues[]>
  >((accumulator, collection) => {
    const rows = profile
      ? (profile[collection.key] as unknown as Record<string, unknown>[])
      : []

    accumulator[collection.key] = rows.map((row) =>
      toRowValues(collection.fields, row)
    )
    return accumulator
  }, {})

  return {
    hosting: sections.hosting,
    internet: sections.internet,
    operational: sections.operational,
    servers: collections.servers,
    databases: collections.databases,
    networks: collections.networks,
    dns_records: collections.dns_records,
    listeners: collections.listeners,
    load_balancers: collections.load_balancers,
    integrations: collections.integrations,
    message_brokers: collections.message_brokers,
    storage_resources: collections.storage_resources,
  }
}

function toPayloadValue(
  field: InfraFieldDef,
  value: InfraFieldValue
): string | number | boolean | null {
  if (field.kind === "boolean") {
    return value === true
  }

  const raw = asTrimmedString(value)

  if (raw === "") {
    return null
  }

  if (field.kind === "port" || field.kind === "number") {
    return Number(raw)
  }

  return raw
}

export function toUpsertEnvironmentPayload(
  values: EnvironmentProfileFormValues,
  visibility: InfrastructureFieldVisibility
): UpsertEnvironmentPayload {
  const sections: Record<string, UpsertEnvironmentSectionPayload> = {}

  for (const section of INFRASTRUCTURE_SECTIONS) {
    const payload: UpsertEnvironmentSectionPayload = {}

    for (const field of visibleSectionFields(section, visibility)) {
      payload[field.name] = toPayloadValue(
        field,
        values[section.key][field.name] ?? null
      )
    }

    sections[section.key] = payload
  }

  const collections = {} as Record<
    InfrastructureCollectionKey,
    UpsertEnvironmentRowPayload[]
  >

  for (const collection of INFRASTRUCTURE_COLLECTIONS) {
    collections[collection.key] = values[collection.key].map((row, index) => {
      const payload: UpsertEnvironmentRowPayload = { sort_order: index }
      const id = row[ROW_ID_KEY]

      if (typeof id === "number" && id > 0) {
        payload.id = id
      }

      for (const field of collection.fields) {
        payload[field.name] = toPayloadValue(field, row[field.name] ?? null)
      }

      return payload
    })
  }

  return {
    sync: true,
    hosting: sections.hosting,
    internet: sections.internet,
    operational: sections.operational,
    ...collections,
  }
}
