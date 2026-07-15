import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

type DashboardChartCardProps = {
  title: string
  description: string
  icon?: LucideIcon
  accentClassName?: string
  className?: string
  headerExtra?: ReactNode
  children: ReactNode
}

export function DashboardChartCard({
  title,
  description,
  icon: Icon,
  accentClassName = "from-sky-500/15 via-transparent to-transparent",
  className,
  headerExtra,
  children,
}: DashboardChartCardProps) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden border-stroke/80 py-0 shadow-sm",
        "transition-shadow duration-300 hover:shadow-md",
        className
      )}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80",
          accentClassName
        )}
      />
      <CardHeader className="relative z-10 flex flex-row items-start justify-between gap-3 border-b border-stroke/60 bg-card/40 px-5 pb-4 pt-5 backdrop-blur-sm">
        <div className="min-w-0 space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            {Icon ? (
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background/80 text-foreground shadow-sm ring-1 ring-border/60">
                <Icon className="size-4" />
              </span>
            ) : null}
            <span className="truncate">{title}</span>
          </CardTitle>
          <CardDescription className="text-xs leading-relaxed sm:text-sm">
            {description}
          </CardDescription>
        </div>
        {headerExtra}
      </CardHeader>
      <CardContent className="relative z-10 px-5 pb-5 pt-4">{children}</CardContent>
    </Card>
  )
}
