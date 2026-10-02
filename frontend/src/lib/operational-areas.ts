export const OPERATIONAL_AREAS = [
  "application",
  "infra",
  "service_desk",
  "network_ops",
  "release_management",
  "smart_facilities",
] as const

export type OperationalAreaCode = (typeof OPERATIONAL_AREAS)[number]

export function isOperationalArea(value: string): value is OperationalAreaCode {
  return (OPERATIONAL_AREAS as readonly string[]).includes(value)
}
