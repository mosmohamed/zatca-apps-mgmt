import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { ArrowDown, ArrowUp, LayoutGrid, RotateCcw, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  FormControl,
  FormDescription,
  FormItem,
  FormLabel,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DASHBOARD_HEADER_WIDGET_KEYS,
  type DashboardWidgetKey,
} from "@/features/dashboard/types/dashboard-widgets"
import {
  createDefaultDashboardWidgetLayout,
  createRecommendedDashboardWidgetLayout,
  sizePresetForSpan,
  spanForSizePreset,
  WIDGET_DESKTOP_SPANS,
  WIDGET_LEGEND_POSITIONS,
  WIDGET_OVERFLOWS,
  WIDGET_TABLET_SPANS,
  type DashboardWidgetLayoutConfig,
  type DashboardWidgetLayoutItem,
  type WidgetSizePreset,
} from "@/features/dashboard/types/widget-layout-config"
import {
  dashboardWidgetSpanClassFromItem,
  DASHBOARD_BOARD_GRID_CLASS,
} from "@/features/dashboard/utils/widget-layout"
import { cn } from "@/lib/utils"

type DashboardWidgetLayoutEditorProps = {
  value: DashboardWidgetLayoutConfig
  onChange: (next: DashboardWidgetLayoutConfig) => void
}

const HEADER_KEYS = new Set<string>(DASHBOARD_HEADER_WIDGET_KEYS)

export function DashboardWidgetLayoutEditor({
  value,
  onChange,
}: DashboardWidgetLayoutEditorProps) {
  const { t } = useTranslation()
  const [selectedKey, setSelectedKey] = useState<DashboardWidgetKey>(
    value.default_order.find((key) => !HEADER_KEYS.has(key)) ??
      value.default_order[0]
  )

  const boardOrder = useMemo(
    () => value.default_order.filter((key) => !HEADER_KEYS.has(key)),
    [value.default_order]
  )

  const selected = value.widgets[selectedKey]
  const preset = sizePresetForSpan(selected.span_desktop)

  function updateWidget(
    key: DashboardWidgetKey,
    patch: Partial<DashboardWidgetLayoutItem>
  ) {
    onChange({
      ...value,
      widgets: {
        ...value.widgets,
        [key]: {
          ...value.widgets[key],
          ...patch,
        },
      },
    })
  }

  function moveInDefaultOrder(key: DashboardWidgetKey, direction: -1 | 1) {
    const order = [...value.default_order]
    const index = order.indexOf(key)
    const target = index + direction
    if (index < 0 || target < 0 || target >= order.length) {
      return
    }
    ;[order[index], order[target]] = [order[target], order[index]]
    onChange({ ...value, default_order: order })
  }

  function applyPreset(nextPreset: WidgetSizePreset) {
    const span = spanForSizePreset(nextPreset)
    if (span == null) {
      return
    }
    updateWidget(selectedKey, {
      span_desktop: span,
      span_tablet: span >= 6 ? 2 : 1,
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium">
            {t("settings.dashboard.layoutTitle")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("settings.dashboard.layoutDescription")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onChange(createDefaultDashboardWidgetLayout())}
          >
            <RotateCcw className="size-3.5" />
            {t("settings.dashboard.resetLayout")}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onChange(createRecommendedDashboardWidgetLayout())}
          >
            <Sparkles className="size-3.5" />
            {t("settings.dashboard.recommendedLayout")}
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-stroke/80 bg-muted/20 p-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <LayoutGrid className="size-3.5" />
          {t("settings.dashboard.livePreview")}
        </div>
        <div className={cn(DASHBOARD_BOARD_GRID_CLASS, "gap-2")}>
          {boardOrder.map((key) => {
            const item = value.widgets[key]
            const active = key === selectedKey
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedKey(key)}
                className={cn(
                  dashboardWidgetSpanClassFromItem(item),
                  "flex min-h-16 flex-col justify-between rounded-lg border px-2.5 py-2 text-start transition-colors",
                  active
                    ? "border-primary bg-primary/10 shadow-sm"
                    : "border-stroke/70 bg-card/80 hover:border-primary/40"
                )}
                style={{ minHeight: Math.max(64, Math.round(item.min_height_px / 4)) }}
              >
                <span className="truncate text-xs font-medium">
                  {t(`settings.dashboard.widgets.${key}`)}
                </span>
                <span className="mt-1 flex flex-wrap gap-1">
                  <Badge variant="secondary" className="text-[10px]">
                    {t("settings.dashboard.spanLabel", {
                      value: item.span_desktop,
                    })}
                  </Badge>
                  <Badge variant="outline" className="text-[10px]">
                    {sizePresetForSpan(item.span_desktop)}
                  </Badge>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="space-y-2">
          <FormLabel>{t("settings.dashboard.defaultOrder")}</FormLabel>
          <FormDescription>
            {t("settings.dashboard.defaultOrderHint")}
          </FormDescription>
          <ul className="max-h-72 space-y-1 overflow-y-auto rounded-xl border border-stroke/80 p-2">
            {value.default_order.map((key, index) => (
              <li
                key={key}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-1.5",
                  key === selectedKey ? "bg-primary/10" : "hover:bg-muted/50"
                )}
              >
                <button
                  type="button"
                  className="min-w-0 flex-1 truncate text-start text-sm"
                  onClick={() => setSelectedKey(key)}
                >
                  {index + 1}. {t(`settings.dashboard.widgets.${key}`)}
                  {HEADER_KEYS.has(key) ? (
                    <span className="ms-1 text-xs text-muted-foreground">
                      ({t("settings.dashboard.headerWidget")})
                    </span>
                  ) : null}
                </button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  disabled={index === 0}
                  onClick={() => moveInDefaultOrder(key, -1)}
                  aria-label={t("settings.dashboard.moveUp")}
                >
                  <ArrowUp className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="ghost"
                  disabled={index === value.default_order.length - 1}
                  onClick={() => moveInDefaultOrder(key, 1)}
                  aria-label={t("settings.dashboard.moveDown")}
                >
                  <ArrowDown className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-4 rounded-xl border border-stroke/80 p-4">
          <div>
            <p className="text-sm font-medium">
              {t(`settings.dashboard.widgets.${selectedKey}`)}
            </p>
            <p className="text-xs text-muted-foreground">
              {t(`settings.dashboard.widgetHints.${selectedKey}`)}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <FormItem>
              <FormLabel>{t("settings.dashboard.sizePreset")}</FormLabel>
              <Select
                value={preset}
                onValueChange={(next) => applyPreset(next as WidgetSizePreset)}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="full">
                    {t("settings.dashboard.presets.full")}
                  </SelectItem>
                  <SelectItem value="half">
                    {t("settings.dashboard.presets.half")}
                  </SelectItem>
                  <SelectItem value="third">
                    {t("settings.dashboard.presets.third")}
                  </SelectItem>
                  <SelectItem value="custom">
                    {t("settings.dashboard.presets.custom")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </FormItem>

            <FormItem>
              <FormLabel>{t("settings.dashboard.spanDesktop")}</FormLabel>
              <Select
                value={String(selected.span_desktop)}
                onValueChange={(next) =>
                  updateWidget(selectedKey, {
                    span_desktop: Number(next) as DashboardWidgetLayoutItem["span_desktop"],
                  })
                }
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {WIDGET_DESKTOP_SPANS.map((span) => (
                    <SelectItem key={span} value={String(span)}>
                      {span}/6
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>

            <FormItem>
              <FormLabel>{t("settings.dashboard.spanTablet")}</FormLabel>
              <Select
                value={String(selected.span_tablet)}
                onValueChange={(next) =>
                  updateWidget(selectedKey, {
                    span_tablet: Number(next) as DashboardWidgetLayoutItem["span_tablet"],
                  })
                }
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {WIDGET_TABLET_SPANS.map((span) => (
                    <SelectItem key={span} value={String(span)}>
                      {span}/2
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>

            <FormItem>
              <FormLabel>{t("settings.dashboard.chartHeight")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={120}
                  max={640}
                  value={selected.chart_height_px}
                  onChange={(event) =>
                    updateWidget(selectedKey, {
                      chart_height_px: Number(event.target.value) || 240,
                    })
                  }
                />
              </FormControl>
            </FormItem>

            <FormItem>
              <FormLabel>{t("settings.dashboard.minHeight")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={160}
                  max={800}
                  value={selected.min_height_px}
                  onChange={(event) =>
                    updateWidget(selectedKey, {
                      min_height_px: Number(event.target.value) || 280,
                    })
                  }
                />
              </FormControl>
            </FormItem>

            <FormItem>
              <FormLabel>{t("settings.dashboard.maxHeight")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={160}
                  max={1600}
                  placeholder={t("settings.dashboard.maxHeightNone")}
                  value={selected.max_height_px ?? ""}
                  onChange={(event) => {
                    const raw = event.target.value
                    updateWidget(selectedKey, {
                      max_height_px: raw === "" ? null : Number(raw) || null,
                    })
                  }}
                />
              </FormControl>
            </FormItem>

            <FormItem>
              <FormLabel>{t("settings.dashboard.overflow")}</FormLabel>
              <Select
                value={selected.overflow}
                onValueChange={(next) =>
                  updateWidget(selectedKey, {
                    overflow: next as DashboardWidgetLayoutItem["overflow"],
                  })
                }
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {WIDGET_OVERFLOWS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {t(`settings.dashboard.overflowOptions.${option}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>

            <FormItem>
              <FormLabel>{t("settings.dashboard.legendPosition")}</FormLabel>
              <Select
                value={selected.legend_position}
                onValueChange={(next) =>
                  updateWidget(selectedKey, {
                    legend_position:
                      next as DashboardWidgetLayoutItem["legend_position"],
                  })
                }
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {WIDGET_LEGEND_POSITIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {t(`settings.dashboard.legendOptions.${option}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {(
              [
                ["show_header", "showHeader"],
                ["show_description", "showDescription"],
                ["show_legend", "showLegend"],
                ["show_filters", "showFilters"],
                ["show_statistics", "showStatistics"],
              ] as const
            ).map(([field, labelKey]) => (
              <label
                key={field}
                className="flex items-center gap-2 rounded-lg border border-stroke/70 px-3 py-2 text-sm"
              >
                <Checkbox
                  checked={selected[field]}
                  onCheckedChange={(checked) =>
                    updateWidget(selectedKey, { [field]: checked === true })
                  }
                />
                {t(`settings.dashboard.${labelKey}`)}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
