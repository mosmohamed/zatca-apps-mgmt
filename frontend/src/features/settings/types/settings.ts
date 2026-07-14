export type PublicSettings = {
  company_name: string
  default_timezone: string
  default_pagination_size: number
  session_timeout_minutes: number
}

export type UpdateSettingsPayload = Partial<
  Omit<PublicSettings, "session_timeout_minutes">
>
