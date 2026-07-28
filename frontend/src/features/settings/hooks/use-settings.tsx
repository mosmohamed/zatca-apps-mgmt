import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import { toast } from "sonner"

import { useAuth } from "@/features/auth/hooks/use-auth"
import { settingsService } from "@/features/settings/services/settings-service"
import type {
  PublicSettings,
  UpdateSettingsPayload,
} from "@/features/settings/types/settings"
import { getApiErrorMessage } from "@/lib/api-errors"
import i18n from "@/lib/i18n"
import { DEFAULT_DASHBOARD_WIDGETS } from "@/features/dashboard/types/dashboard-widgets"
import { DEFAULT_DASHBOARD_WIDGET_LAYOUT } from "@/features/dashboard/types/widget-layout-config"

type SettingsContextValue = {
  settings: PublicSettings
  isLoading: boolean
  isSaving: boolean
  updateSettings: (payload: UpdateSettingsPayload) => Promise<void>
  refreshSettings: () => Promise<void>
}

export const DEFAULT_SETTINGS: PublicSettings = {
  company_name: "CENTRIX",
  sidebar_tagline_en: "",
  sidebar_tagline_ar: "",
  header_subtitle_en: "ZATCA Applications Operations",
  header_subtitle_ar:
    "نظام ادارة التطبيقات في هيئة الزكاة والضريبة والجمارك",
  default_timezone: "Asia/Riyadh",
  default_pagination_size: 15,
  session_timeout_minutes: 120,
  dashboard_widgets: DEFAULT_DASHBOARD_WIDGETS,
  dashboard_widget_layout: DEFAULT_DASHBOARD_WIDGET_LAYOUT,
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth()
  const [settings, setSettings] = useState<PublicSettings>(DEFAULT_SETTINGS)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const refreshSettings = useCallback(async () => {
    const data = await settingsService.get()
    setSettings(data)
  }, [])

  useEffect(() => {
    let cancelled = false

    setIsLoading(true)

    async function bootstrap() {
      try {
        const data = await settingsService.get()
        if (!cancelled) {
          setSettings(data)
        }
      } catch {
        // Keep sane defaults if settings cannot be loaded (e.g. backend not deployed yet).
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated])

  const updateSettings = useCallback(async (payload: UpdateSettingsPayload) => {
    setIsSaving(true)
    try {
      const updated = await settingsService.update(payload)
      setSettings(updated)
      toast.success(i18n.t("settings.toast.updated"))
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, i18n.t("settings.toast.updateFailed"))
      )
      throw error
    } finally {
      setIsSaving(false)
    }
  }, [])

  const value = useMemo<SettingsContextValue>(
    () => ({
      settings,
      isLoading,
      isSaving,
      updateSettings,
      refreshSettings,
    }),
    [settings, isLoading, isSaving, updateSettings, refreshSettings]
  )

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error("useSettings must be used within SettingsProvider")
  }
  return context
}
