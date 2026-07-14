/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_LOCATION_CITY?: string
  readonly VITE_LOCATION_COUNTRY?: string
  readonly VITE_WEATHER_LAT?: string
  readonly VITE_WEATHER_LON?: string
  readonly VITE_PRAYER_METHOD?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
