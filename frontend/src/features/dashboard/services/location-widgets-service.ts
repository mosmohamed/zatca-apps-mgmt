export type WeatherSnapshot = {
  temperatureC: number
  feelsLikeC: number | null
  weatherCode: number
  humidity: number | null
  windSpeedKmh: number | null
  visibilityKm: number | null
  cloudCover: number | null
  precipitationMm: number | null
  highC: number | null
  lowC: number | null
  uvIndex: number | null
  rainChancePercent: number | null
  sunrise: string | null
  sunset: string | null
  fetchedAt: string
}

export type PrayerTimings = {
  Fajr: string
  Sunrise: string
  Dhuhr: string
  Asr: string
  Maghrib: string
  Isha: string
  HijriDate: string
  GregorianDate: string
}

function locationConfig() {
  return {
    city: import.meta.env.VITE_LOCATION_CITY || "Riyadh",
    country: import.meta.env.VITE_LOCATION_COUNTRY || "Saudi Arabia",
    latitude: Number(import.meta.env.VITE_WEATHER_LAT || 24.7136),
    longitude: Number(import.meta.env.VITE_WEATHER_LON || 46.6753),
    prayerMethod: Number(import.meta.env.VITE_PRAYER_METHOD || 4),
  }
}

type OpenMeteoResponse = {
  current?: {
    temperature_2m?: number
    apparent_temperature?: number
    weather_code?: number
    relative_humidity_2m?: number
    wind_speed_10m?: number
    visibility?: number
    cloud_cover?: number
    precipitation?: number
    time?: string
  }
  daily?: {
    temperature_2m_max?: number[]
    temperature_2m_min?: number[]
    sunrise?: string[]
    sunset?: string[]
    uv_index_max?: number[]
    precipitation_probability_max?: number[]
  }
}

type AladhanResponse = {
  data?: {
    timings?: Record<string, string>
    date?: {
      readable?: string
      hijri?: {
        date?: string
        weekday?: { en?: string }
      }
    }
  }
}

function firstNumber(values: number[] | undefined): number | null {
  const value = values?.[0]
  return typeof value === "number" && Number.isFinite(value) ? value : null
}

function firstString(values: string[] | undefined): string | null {
  const value = values?.[0]
  return typeof value === "string" && value.trim() !== "" ? value : null
}

export const locationWidgetsService = {
  getLocationLabel(): string {
    const { city, country } = locationConfig()
    return `${city}, ${country}`
  },

  async fetchWeather(): Promise<WeatherSnapshot> {
    const { latitude, longitude } = locationConfig()
    const url = new URL("https://api.open-meteo.com/v1/forecast")
    url.searchParams.set("latitude", String(latitude))
    url.searchParams.set("longitude", String(longitude))
    url.searchParams.set(
      "current",
      [
        "temperature_2m",
        "apparent_temperature",
        "relative_humidity_2m",
        "precipitation",
        "weather_code",
        "cloud_cover",
        "wind_speed_10m",
        "visibility",
      ].join(",")
    )
    url.searchParams.set(
      "daily",
      [
        "temperature_2m_max",
        "temperature_2m_min",
        "sunrise",
        "sunset",
        "uv_index_max",
        "precipitation_probability_max",
      ].join(",")
    )
    url.searchParams.set("forecast_days", "1")
    url.searchParams.set("timezone", "Asia/Riyadh")

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Weather request failed (${response.status})`)
    }

    const payload = (await response.json()) as OpenMeteoResponse
    const current = payload.current
    const daily = payload.daily

    if (
      typeof current?.temperature_2m !== "number" ||
      typeof current.weather_code !== "number"
    ) {
      throw new Error("Weather payload incomplete")
    }

    const visibilityMeters =
      typeof current.visibility === "number" ? current.visibility : null

    return {
      temperatureC: current.temperature_2m,
      feelsLikeC:
        typeof current.apparent_temperature === "number"
          ? current.apparent_temperature
          : null,
      weatherCode: current.weather_code,
      humidity:
        typeof current.relative_humidity_2m === "number"
          ? current.relative_humidity_2m
          : null,
      windSpeedKmh:
        typeof current.wind_speed_10m === "number"
          ? current.wind_speed_10m
          : null,
      visibilityKm:
        visibilityMeters !== null
          ? Math.round((visibilityMeters / 1000) * 10) / 10
          : null,
      cloudCover:
        typeof current.cloud_cover === "number" ? current.cloud_cover : null,
      precipitationMm:
        typeof current.precipitation === "number" ? current.precipitation : null,
      highC: firstNumber(daily?.temperature_2m_max),
      lowC: firstNumber(daily?.temperature_2m_min),
      uvIndex: firstNumber(daily?.uv_index_max),
      rainChancePercent: firstNumber(daily?.precipitation_probability_max),
      sunrise: firstString(daily?.sunrise),
      sunset: firstString(daily?.sunset),
      fetchedAt: current.time ?? new Date().toISOString(),
    }
  },

  async fetchPrayerTimes(): Promise<PrayerTimings> {
    const { city, country, prayerMethod } = locationConfig()
    const url = new URL("https://api.aladhan.com/v1/timingsByCity")
    url.searchParams.set("city", city)
    url.searchParams.set("country", country)
    url.searchParams.set("method", String(prayerMethod))

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Prayer times request failed (${response.status})`)
    }

    const payload = (await response.json()) as AladhanResponse
    const timings = payload.data?.timings

    if (
      !timings?.Fajr ||
      !timings.Dhuhr ||
      !timings.Asr ||
      !timings.Maghrib ||
      !timings.Isha
    ) {
      throw new Error("Prayer timings payload incomplete")
    }

    return {
      Fajr: timings.Fajr.slice(0, 5),
      Sunrise: (timings.Sunrise ?? "").slice(0, 5),
      Dhuhr: timings.Dhuhr.slice(0, 5),
      Asr: timings.Asr.slice(0, 5),
      Maghrib: timings.Maghrib.slice(0, 5),
      Isha: timings.Isha.slice(0, 5),
      HijriDate: payload.data?.date?.hijri?.date ?? "",
      GregorianDate: payload.data?.date?.readable ?? "",
    }
  },
}

/** WMO weather interpretation codes (Open-Meteo). */
export function weatherCodeToKey(code: number): string {
  if (code === 0) return "clear"
  if (code <= 3) return "partlyCloudy"
  if (code <= 48) return "fog"
  if (code <= 67) return "rain"
  if (code <= 77) return "snow"
  if (code <= 82) return "showers"
  if (code <= 99) return "thunder"
  return "unknown"
}

export function formatIsoTime12h(
  iso: string | null,
  locale?: string
): string {
  if (!iso) {
    return "—"
  }

  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) {
    return "—"
  }

  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date)
}
