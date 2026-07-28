import type { TFunction } from "i18next"

import { INFRA_ENUM_TRANSLATION_GROUPS } from "@/features/applications/types/infrastructure-fields"
import type {
  InfrastructureCollectionKey,
  InfrastructureSectionKey,
} from "@/features/applications/types/infrastructure"

function humanize(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function infraFieldLabel(t: TFunction, name: string): string {
  return t(`applications.infrastructure.fields.${name}`, {
    defaultValue: humanize(name),
  })
}

export function infraSectionTitle(
  t: TFunction,
  key: InfrastructureSectionKey
): string {
  return t(`applications.infrastructure.sections.${key}.title`, {
    defaultValue: humanize(key),
  })
}

export function infraSectionDescription(
  t: TFunction,
  key: InfrastructureSectionKey
): string {
  return t(`applications.infrastructure.sections.${key}.description`, {
    defaultValue: "",
  })
}

export function infraCollectionTitle(
  t: TFunction,
  key: InfrastructureCollectionKey
): string {
  return t(`applications.infrastructure.collections.${key}.title`, {
    defaultValue: humanize(key),
  })
}

export function infraCollectionDescription(
  t: TFunction,
  key: InfrastructureCollectionKey
): string {
  return t(`applications.infrastructure.collections.${key}.description`, {
    defaultValue: "",
  })
}

export function infraCollectionItemLabel(
  t: TFunction,
  key: InfrastructureCollectionKey
): string {
  return t(`applications.infrastructure.collections.${key}.item`, {
    defaultValue: humanize(key),
  })
}

export function infraOptionLabel(
  t: TFunction,
  fieldName: string,
  option: string
): string {
  const group = INFRA_ENUM_TRANSLATION_GROUPS[fieldName]

  if (!group) {
    return humanize(option)
  }

  return t(`applications.infrastructure.options.${group}.${option}`, {
    defaultValue: humanize(option),
  })
}
