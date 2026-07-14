import { cn } from "@/lib/utils"

type WeatherAnimatedIconProps = {
  weatherKey: string
  className?: string
}

export function WeatherAnimatedIcon({
  weatherKey,
  className,
}: WeatherAnimatedIconProps) {
  return (
    <div className={cn("relative size-14 shrink-0 sm:size-16", className)} aria-hidden>
      {(weatherKey === "clear" || weatherKey === "partlyCloudy") && (
        <div className="weather-icon-sun absolute inset-[22%] rounded-full bg-gradient-to-br from-amber-200/90 via-amber-300/80 to-orange-300/70 shadow-[0_0_12px_rgba(251,191,36,0.25)]" />
      )}

      {(weatherKey === "partlyCloudy" ||
        weatherKey === "fog" ||
        weatherKey === "rain" ||
        weatherKey === "showers" ||
        weatherKey === "snow" ||
        weatherKey === "thunder" ||
        weatherKey === "unknown") && (
        <>
          <div className="weather-icon-cloud absolute start-[10%] top-[46%] h-[30%] w-[54%] rounded-full bg-muted-foreground/20 dark:bg-muted-foreground/30" />
          <div className="weather-icon-cloud-slow absolute end-[8%] top-[38%] h-[36%] w-[58%] rounded-full bg-muted-foreground/15 dark:bg-muted-foreground/25" />
        </>
      )}

      {(weatherKey === "rain" ||
        weatherKey === "showers" ||
        weatherKey === "thunder") && (
        <div className="absolute inset-x-[30%] bottom-[10%] top-[70%] overflow-hidden">
          <span className="weather-icon-drop absolute start-[12%] top-0 h-2 w-px rounded-full bg-sky-500/50" />
          <span className="weather-icon-drop-delay absolute start-[48%] top-0 h-2 w-px rounded-full bg-sky-500/40" />
          <span className="weather-icon-drop absolute end-[12%] top-0 h-2 w-px rounded-full bg-sky-500/45" />
        </div>
      )}

      {weatherKey === "snow" && (
        <div className="absolute inset-x-[26%] bottom-[8%] top-[68%]">
          <span className="weather-icon-flake absolute start-[18%] size-1 rounded-full bg-muted-foreground/40" />
          <span className="weather-icon-flake-delay absolute start-[52%] size-1 rounded-full bg-muted-foreground/35" />
          <span className="weather-icon-flake absolute end-[20%] size-1 rounded-full bg-muted-foreground/40" />
        </div>
      )}

      {weatherKey === "thunder" && (
        <div className="weather-icon-bolt absolute start-1/2 top-[56%] h-5 w-2 -translate-x-1/2 bg-amber-400/70 [clip-path:polygon(40%_0,75%_0,55%_40%,85%_40%,25%_100%,40%_48%,10%_48%)]" />
      )}

      {weatherKey === "fog" && (
        <div className="absolute inset-x-[20%] top-[64%] space-y-1">
          <div className="weather-icon-fog h-0.5 rounded-full bg-muted-foreground/30" />
          <div className="weather-icon-fog-delay mx-[8%] h-0.5 rounded-full bg-muted-foreground/25" />
          <div className="weather-icon-fog mx-[4%] h-0.5 rounded-full bg-muted-foreground/30" />
        </div>
      )}
    </div>
  )
}
