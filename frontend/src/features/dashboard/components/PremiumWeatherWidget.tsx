import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  CloudRain,
  Droplets,
  Eye,
  Gauge,
  MapPin,
  Sunrise,
  Sunset,
  Thermometer,
  Wind,
} from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { WeatherAnimatedIcon } from "@/features/dashboard/components/WeatherAnimatedIcon"
import { useWeatherWidget } from "@/features/dashboard/hooks/use-location-widgets"
import {
  formatIsoTime12h,
  locationWidgetsService,
  weatherCodeToKey,
  type WeatherSnapshot,
} from "@/features/dashboard/services/location-widgets-service"
import { cn } from "@/lib/utils"

function metricValue(value: number | null, suffix = "", digits = 0): string {
  if (value === null || !Number.isFinite(value)) {
    return "—"
  }
  const rounded =
    digits > 0 ? value.toFixed(digits) : Math.round(value).toString()
  return `${rounded}${suffix}`
}

function WeatherMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Wind
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border border-border/60 bg-background/55 px-2 py-1.5 backdrop-blur-sm transition-colors hover:bg-muted/50">
      <p className="flex items-center gap-1 text-[9px] font-medium uppercase tracking-wide text-muted-foreground">
        <Icon className="size-2.5 shrink-0" />
        <span className="truncate">{label}</span>
      </p>
      <p className="mt-0.5 text-xs font-semibold tabular-nums text-foreground">
        {value}
      </p>
    </div>
  )
}

function weatherSurface(key: string): string {
  switch (key) {
    case "clear":
      return "from-card via-card to-amber-500/[0.06]"
    case "partlyCloudy":
      return "from-card via-card to-sky-500/[0.07]"
    case "fog":
      return "from-card via-card to-slate-500/[0.08]"
    case "rain":
    case "showers":
      return "from-card via-card to-blue-500/[0.08]"
    case "snow":
      return "from-card via-card to-sky-400/[0.08]"
    case "thunder":
      return "from-card via-card to-violet-500/[0.08]"
    default:
      return "from-card via-card to-muted/40"
  }
}

function WeatherLoadedCard({
  weather,
  locale,
  className,
}: {
  weather: WeatherSnapshot
  locale: string
  className?: string
}) {
  const { t } = useTranslation()
  const [now, setNow] = useState(() => new Date())
  const weatherKey = weatherCodeToKey(weather.weatherCode)
  const locationLabel = locationWidgetsService.getLocationLabel()

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000)
    return () => window.clearInterval(timer)
  }, [])

  const dateLabel = now.toLocaleDateString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
  })
  const timeLabel = now.toLocaleTimeString(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })

  return (
    <div
      className={cn(
        "relative flex h-full min-h-[11.5rem] flex-col overflow-hidden rounded-xl border border-stroke/80 bg-gradient-to-br p-3.5 shadow-sm",
        "transition-colors duration-300",
        weatherSurface(weatherKey),
        className
      )}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 overflow-hidden opacity-40",
          `weather-scene-${weatherKey}`
        )}
      />
      <div className="pointer-events-none absolute -end-6 -top-8 size-20 rounded-full bg-foreground/[0.03] blur-2xl" />

      <div className="relative z-[1] flex h-full flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <MapPin className="size-3.5 shrink-0" />
              <span className="truncate">{locationLabel}</span>
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground/80">
              {dateLabel} · {timeLabel}
            </p>

            <div className="mt-3 flex items-end gap-2.5">
              <p className="text-3xl font-semibold tracking-tight tabular-nums leading-none sm:text-4xl">
                {Math.round(weather.temperatureC)}°
              </p>
              <div className="mb-0.5 min-w-0">
                <p className="truncate text-sm font-medium text-foreground/90">
                  {t(`dashboard.widgets.weatherCodes.${weatherKey}`)}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {t("dashboard.widgets.feelsLike")}{" "}
                  {metricValue(weather.feelsLikeC, "°")}
                  {" · "}
                  H {metricValue(weather.highC, "°")} / L{" "}
                  {metricValue(weather.lowC, "°")}
                </p>
              </div>
            </div>
          </div>

          <WeatherAnimatedIcon
            weatherKey={weatherKey}
            className="size-14 sm:size-16"
          />
        </div>

        <div className="mt-auto grid grid-cols-4 gap-1.5">
          <WeatherMetric
            icon={Droplets}
            label={t("dashboard.widgets.humidity")}
            value={metricValue(weather.humidity, "%")}
          />
          <WeatherMetric
            icon={Wind}
            label={t("dashboard.widgets.wind")}
            value={metricValue(weather.windSpeedKmh, "")}
          />
          <WeatherMetric
            icon={Gauge}
            label={t("dashboard.widgets.uvIndex")}
            value={metricValue(weather.uvIndex, "", 1)}
          />
          <WeatherMetric
            icon={Eye}
            label={t("dashboard.widgets.visibility")}
            value={metricValue(weather.visibilityKm, "", 1)}
          />
          <WeatherMetric
            icon={CloudRain}
            label={t("dashboard.widgets.rainChance")}
            value={metricValue(weather.rainChancePercent, "%")}
          />
          <WeatherMetric
            icon={Thermometer}
            label={t("dashboard.widgets.precipitation")}
            value={metricValue(weather.precipitationMm, "", 1)}
          />
          <WeatherMetric
            icon={Sunrise}
            label={t("dashboard.widgets.sunrise")}
            value={formatIsoTime12h(weather.sunrise, locale)}
          />
          <WeatherMetric
            icon={Sunset}
            label={t("dashboard.widgets.sunset")}
            value={formatIsoTime12h(weather.sunset, locale)}
          />
        </div>
      </div>
    </div>
  )
}

export function PremiumWeatherWidget({ className }: { className?: string }) {
  const { t, i18n } = useTranslation()
  const weatherQuery = useWeatherWidget()

  if (weatherQuery.isLoading) {
    return (
      <div
        className={cn(
          "flex h-full min-h-[11.5rem] flex-col rounded-xl border border-stroke/80 bg-card p-3.5 shadow-sm",
          className
        )}
      >
        <div className="flex items-center justify-between">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="size-14 rounded-full" />
        </div>
        <Skeleton className="mt-3 h-9 w-20" />
        <div className="mt-auto grid grid-cols-4 gap-1.5 pt-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-11 w-full rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (weatherQuery.isError || !weatherQuery.data) {
    return (
      <div
        className={cn(
          "flex h-full min-h-[11.5rem] items-center rounded-xl border border-stroke/80 bg-card p-3.5 text-sm text-muted-foreground shadow-sm",
          className
        )}
      >
        {t("dashboard.widgets.weatherUnavailable")}
      </div>
    )
  }

  return (
    <WeatherLoadedCard
      weather={weatherQuery.data}
      locale={i18n.language}
      className={className}
    />
  )
}
