import { api } from "@/lib/axios"
import type { ApiEnvelope } from "@/types/api"
import type {
  PublicSettings,
  UpdateSettingsPayload,
} from "@/features/settings/types/settings"

type SettingRecord = {
  key: string
  value: string | number | boolean | null
}

const DEFAULTS: PublicSettings = {
  company_name: "IT Portfolio System",
  default_timezone: "Asia/Riyadh",
  default_pagination_size: 15,
  session_timeout_minutes: 120,
}

function asPublicSettings(
  payload: Record<string, unknown> | SettingRecord[] | PublicSettings
): PublicSettings {
  const source: Record<string, unknown> = Array.isArray(payload)
    ? Object.fromEntries(payload.map((item) => [item.key, item.value]))
    : payload

  return {
    company_name:
      typeof source.company_name === "string"
        ? source.company_name
        : DEFAULTS.company_name,
    default_timezone:
      typeof source.default_timezone === "string"
        ? source.default_timezone
        : DEFAULTS.default_timezone,
    default_pagination_size:
      typeof source.default_pagination_size === "number"
        ? source.default_pagination_size
        : Number(source.default_pagination_size) ||
          DEFAULTS.default_pagination_size,
    session_timeout_minutes:
      typeof source.session_timeout_minutes === "number"
        ? source.session_timeout_minutes
        : Number(source.session_timeout_minutes) ||
          DEFAULTS.session_timeout_minutes,
  }
}

export const settingsService = {
  async get(): Promise<PublicSettings> {
    const { data } = await api.get<
      ApiEnvelope<Record<string, unknown> | SettingRecord[]>
    >("/settings/public")
    return asPublicSettings(data.data)
  },

  async update(payload: UpdateSettingsPayload): Promise<PublicSettings> {
    const { data } = await api.put<
      ApiEnvelope<Record<string, unknown> | SettingRecord[]>
    >("/settings", {
      settings: payload,
    })
    return asPublicSettings(data.data)
  },
}
