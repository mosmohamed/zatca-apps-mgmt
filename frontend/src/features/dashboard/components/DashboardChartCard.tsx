import type { CSSProperties, ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DashboardDragHandle } from "@/features/dashboard/components/DashboardDragHandle"
import { useDashboardWidgetLayout } from "@/features/dashboard/hooks/use-widget-layout"
import type { DashboardWidgetKey } from "@/features/dashboard/types/dashboard-widgets"
import { dashboardWidgetContentOverflowClass } from "@/features/dashboard/utils/widget-layout"
import { cn } from "@/lib/utils"

type DashboardChartCardProps = {
  widgetKey?: DashboardWidgetKey
  title: string
  description: string
  icon?: LucideIcon
  accentClassName?: string
  className?: string
  headerExtra?: ReactNode
  children: ReactNode
}

export function DashboardChartCard({
  widgetKey,
  title,
  description,
  icon: Icon,
  accentClassName = "from-sky-500/15 via-transparent to-transparent",
  className,
  headerExtra,
  children,
}: DashboardChartCardProps) {
  const layoutConfig = useDashboardWidgetLayout()
  const layout = widgetKey ? layoutConfig.widgets[widgetKey] : null

  const showHeader = layout?.show_header ?? true
  const showDescription = layout?.show_description ?? true
  const showFilters = layout?.show_filters ?? true
  const chartHeight = layout?.chart_height_px
  const overflowClass = layout
    ? dashboardWidgetContentOverflowClass(layout.overflow)
    : undefined

  const contentStyle: CSSProperties | undefined = chartHeight
    ? { ["--dashboard-chart-height" as string]: `${chartHeight}px` }
    : undefined

  return (
    <Card
      className={cn(
        "relative h-full overflow-hidden border-stroke/80 py-0 shadow-sm",
        "transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-md",
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
      {showHeader ? (
        <CardHeader className="relative z-10 flex flex-row items-start justify-between gap-3 border-b border-stroke/60 bg-card/40 px-5 pb-4 pt-5 backdrop-blur-sm">
          <div className="min-w-0 flex-1 space-y-1 pe-1">
            <CardTitle className="flex items-center gap-2 text-base">
              {Icon ? (
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-background/80 text-foreground shadow-sm ring-1 ring-border/60">
                  <Icon className="size-4" />
                </span>
              ) : null}
              <span className="truncate">{title}</span>
            </CardTitle>
            {showDescription ? (
              <CardDescription className="text-xs leading-relaxed sm:text-sm">
                {description}
              </CardDescription>
            ) : null}
          </div>
          <div className="flex shrink-0 items-start gap-2">
            {showFilters ? headerExtra : null}
            <DashboardDragHandle />
          </div>
        </CardHeader>
      ) : (
        <div className="absolute end-3 top-3 z-20">
          <DashboardDragHandle />
        </div>
      )}
      <CardContent
        className={cn("relative z-10 px-5 pb-5 pt-4", overflowClass)}
        style={contentStyle}
      >
        {children}
      </CardContent>
    </Card>
  )
}
