export type PrayerKey = "fajr" | "dhuhr" | "asr" | "maghrib" | "isha"

export type PrayerEntry = {
  key: PrayerKey
  labelKey: PrayerKey
  time24: string
}

export type NextPrayerInfo = {
  key: PrayerKey
  time24: string
  msRemaining: number
}

/** Parse "HH:mm" or "HH:mm:ss" into minutes from midnight. */
export function parseTimeToMinutes(time24: string): number {
  const [hoursRaw, minutesRaw] = time24.trim().split(":")
  const hours = Number(hoursRaw)
  const minutes = Number(minutesRaw)
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return 0
  }
  return hours * 60 + minutes
}

/** Convert "HH:mm" (24h) to locale 12-hour display with AM/PM. */
export function formatPrayerTime12h(time24: string, locale?: string): string {
  const [hoursRaw, minutesRaw] = time24.trim().split(":")
  const hours = Number(hoursRaw)
  const minutes = Number(minutesRaw)

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return time24
  }

  const date = new Date()
  date.setHours(hours, minutes, 0, 0)

  return new Intl.DateTimeFormat(locale, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(date)
}

export function getNextPrayer(
  entries: PrayerEntry[],
  now: Date = new Date()
): NextPrayerInfo | null {
  if (entries.length === 0) {
    return null
  }

  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  const nowSeconds = now.getSeconds()

  for (const entry of entries) {
    const prayerMinutes = parseTimeToMinutes(entry.time24)
    if (prayerMinutes > nowMinutes || (prayerMinutes === nowMinutes && nowSeconds === 0)) {
      const msRemaining =
        (prayerMinutes - nowMinutes) * 60_000 - nowSeconds * 1000
      return {
        key: entry.key,
        time24: entry.time24,
        msRemaining: Math.max(0, msRemaining),
      }
    }
  }

  // After Isha → next is tomorrow's Fajr
  const fajr = entries[0]
  const fajrMinutes = parseTimeToMinutes(fajr.time24)
  const minutesUntilMidnight = 24 * 60 - nowMinutes
  const msRemaining =
    (minutesUntilMidnight + fajrMinutes) * 60_000 - nowSeconds * 1000

  return {
    key: fajr.key,
    time24: fajr.time24,
    msRemaining: Math.max(0, msRemaining),
  }
}

export function formatCountdown(msRemaining: number): string {
  const totalSeconds = Math.max(0, Math.floor(msRemaining / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m ${String(seconds).padStart(2, "0")}s`
  }

  return `${minutes}m ${String(seconds).padStart(2, "0")}s`
}
