import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Clock3, MapPin, MoonStar } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import { PremiumWeatherWidget } from "@/features/dashboard/components/PremiumWeatherWidget"
import { usePrayerTimesWidget } from "@/features/dashboard/hooks/use-location-widgets"
import { locationWidgetsService } from "@/features/dashboard/services/location-widgets-service"
import {
  formatCountdown,
  formatPrayerTime12h,
  getNextPrayer,
  type PrayerEntry,
  type PrayerKey,
} from "@/features/dashboard/utils/prayer-time"
import { cn } from "@/lib/utils"

const sectionCardClass =
  "relative flex h-full min-h-[11.5rem] flex-col overflow-hidden rounded-xl border border-stroke/80 bg-card p-3.5 shadow-sm"

function AnimatedClock({ className }: { className?: string }) {
  const [now, setNow] = useState(() => new Date())
  const [colonVisible, setColonVisible] = useState(true)

  useEffect(() => {
    const tick = window.setInterval(() => {
      setNow(new Date())
      setColonVisible((current) => !current)
    }, 500)

    return () => window.clearInterval(tick)
  }, [])

  const parts = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).formatToParts(now)

  const partValue = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? ""

  const hourPart = partValue("hour")
  const minutePart = partValue("minute")
  const seconds = partValue("second")
  const period = partValue("dayPeriod")
  const dateLabel = now.toLocaleDateString(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
  })

  return (
    <div className={cn("min-w-0", className)}>
      <p className="flex flex-wrap items-baseline gap-x-2 font-mono text-3xl font-semibold tracking-tight tabular-nums leading-none sm:text-4xl">
        <span>{hourPart}</span>
        <span
          className={cn(
            "inline-block transition-opacity duration-200",
            colonVisible ? "opacity-100" : "opacity-30"
          )}
        >
          :
        </span>
        <span>{minutePart}</span>
        <span className="ms-0.5 text-sm font-medium text-muted-foreground tabular-nums">
          {seconds}
        </span>
        {period ? (
          <span className="ms-1 rounded-md bg-muted px-2 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {period}
          </span>
        ) : null}
      </p>
      <p className="mt-2.5 text-sm text-muted-foreground">{dateLabel}</p>
    </div>
  )
}

export function DashboardLiveHeader() {
  const { t, i18n } = useTranslation()
  const prayerQuery = usePrayerTimesWidget()
  const locationLabel = locationWidgetsService.getLocationLabel()
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const prayerEntries = useMemo<PrayerEntry[]>(() => {
    if (!prayerQuery.data) {
      return []
    }

    return (
      [
        ["fajr", prayerQuery.data.Fajr],
        ["dhuhr", prayerQuery.data.Dhuhr],
        ["asr", prayerQuery.data.Asr],
        ["maghrib", prayerQuery.data.Maghrib],
        ["isha", prayerQuery.data.Isha],
      ] as const
    ).map(([key, time24]) => ({
      key,
      labelKey: key,
      time24,
    }))
  }, [prayerQuery.data])

  const nextPrayer = useMemo(
    () => getNextPrayer(prayerEntries, now),
    [prayerEntries, now]
  )

  return (
    <div className="grid items-stretch gap-3 lg:grid-cols-3">
      <PremiumWeatherWidget />

      <div className={sectionCardClass}>
        <div className="pointer-events-none absolute -end-4 -bottom-6 opacity-[0.07]">
          <Clock3 className="size-28 text-foreground" strokeWidth={1.25} />
        </div>

        <div className="relative z-[1] flex h-full flex-col">
          <div className="flex items-center gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <MapPin className="size-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {t("dashboard.widgets.localTime")}
              </p>
              <p className="truncate text-xs text-muted-foreground/90">
                {locationLabel}
              </p>
            </div>
          </div>

          <div className="mt-auto pt-5">
            <AnimatedClock />
          </div>
        </div>
      </div>

      <div className={sectionCardClass}>
        <div className="pointer-events-none absolute -end-3 -bottom-5 opacity-[0.07]">
          <MoonStar className="size-28 text-foreground" strokeWidth={1.25} />
        </div>

        <div className="relative z-[1] flex h-full flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <MoonStar className="size-4" />
            </div>
            <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("dashboard.widgets.prayerTimes")}
            </p>
            {prayerQuery.data?.HijriDate ? (
              <span className="ms-auto truncate text-xs text-muted-foreground">
                {prayerQuery.data.HijriDate}
              </span>
            ) : null}
          </div>

          {prayerQuery.isLoading ? (
            <div className="grid flex-1 grid-cols-5 gap-1.5">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-full min-h-14 w-full" />
              ))}
            </div>
          ) : prayerQuery.isError || !prayerQuery.data ? (
            <p className="text-sm text-muted-foreground">
              {t("dashboard.widgets.prayerUnavailable")}
            </p>
          ) : (
            <>
              {nextPrayer ? (
                <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/45 px-3 py-2">
                  <p className="text-xs text-muted-foreground sm:text-sm">
                    {t("dashboard.widgets.nextPrayer", {
                      prayer: t(
                        `dashboard.widgets.prayers.${nextPrayer.key as PrayerKey}`
                      ),
                    })}
                  </p>
                  <p className="font-mono text-sm font-semibold tabular-nums text-foreground sm:text-base">
                    {formatCountdown(nextPrayer.msRemaining)}
                  </p>
                </div>
              ) : null}

              <div className="mt-auto grid grid-cols-5 gap-1.5">
                {prayerEntries.map((entry) => {
                  const isNext = nextPrayer?.key === entry.key
                  return (
                    <div
                      key={entry.key}
                      className={cn(
                        "rounded-lg px-1 py-2 text-center transition-colors",
                        isNext
                          ? "bg-muted ring-1 ring-border"
                          : "bg-muted/40 hover:bg-muted/70"
                      )}
                    >
                      <p className="truncate text-[10px] font-medium uppercase tracking-wide text-muted-foreground sm:text-[11px]">
                        {t(`dashboard.widgets.prayers.${entry.key}`)}
                      </p>
                      <p className="mt-1 font-mono text-xs font-semibold leading-tight tabular-nums sm:text-sm">
                        {formatPrayerTime12h(entry.time24, i18n.language)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
