import { useNavigate } from "react-router-dom"
import type { LucideIcon } from "lucide-react"

import { useCountUp } from "@/hooks/use-count-up"
import { cn } from "@/lib/utils"

type DashboardKpiCardProps = {
  label: string
  value: number
  icon: LucideIcon
  to: string
  index: number
  accent: {
    card: string
    strip: string
    icon: string
  }
}

export function DashboardKpiCard({
  label,
  value,
  icon: Icon,
  to,
  index,
  accent,
}: DashboardKpiCardProps) {
  const navigate = useNavigate()
  const displayValue = useCountUp(value, { durationMs: 900 })

  return (
    <button
      type="button"
      onClick={() => navigate(to)}
      style={{ animationDelay: `${index * 75}ms` }}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-xl border p-4 text-start",
        "shadow-[0_1px_3px_rgba(15,23,42,0.06),0_1px_2px_rgba(15,23,42,0.04)]",
        "transition-all duration-200 ease-out",
        "hover:-translate-y-0.5 hover:shadow-[0_8px_20px_-10px_rgba(15,23,42,0.16)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "animate-in fade-in-0 slide-in-from-bottom-2 fill-mode-both duration-400",
        accent.card
      )}
    >
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-3 start-0 w-[3px] rounded-full",
          accent.strip
        )}
      />

      <Icon
        aria-hidden
        className={cn(
          "pointer-events-none absolute -bottom-3 -end-3 size-28 transition-opacity duration-200 group-hover:opacity-100",
          accent.icon
        )}
        strokeWidth={1.15}
      />

      <div className="relative ps-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums text-foreground">
          {displayValue}
        </p>
      </div>
    </button>
  )
}
