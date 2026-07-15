import type { Props as RechartsTextProps } from "recharts/types/component/Text"

import type { DashboardChartItem } from "@/features/dashboard/services/dashboard-service"

const CHART_PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "#0EA5E9",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#EF4444",
  "#14B8A6",
  "#EC4899",
]

/** Shared tick style so Arabic/Latin labels inherit app fonts in SVG. */
export const CHART_TICK_STYLE = {
  fontFamily:
    "'Geist Variable', 'Noto Sans Arabic Variable', 'Noto Sans Arabic', sans-serif",
  fontSize: 11,
} as RechartsTextProps

export function colorForIndex(index: number): string {
  return CHART_PALETTE[index % CHART_PALETTE.length]
}

export function localizeChartName(
  item: Pick<DashboardChartItem, "name" | "name_en" | "name_ar" | "key">,
  isArabic: boolean
): string {
  if (isArabic) {
    return item.name_ar || item.name || item.name_en || item.key || ""
  }
  return item.name_en || item.name || item.name_ar || item.key || ""
}

export function toChartKey(
  item: Pick<DashboardChartItem, "name" | "name_en" | "key">,
  index: number
): string {
  if (item.key && item.key.trim() !== "") {
    return item.key
  }

  const source = item.name_en || item.name || `item-${index}`
  const slug = source
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

  return slug || `item-${index}`
}

export function truncateLabel(value: string, maxChars = 18): string {
  const chars = Array.from(value)
  if (chars.length <= maxChars) {
    return value
  }
  return `${chars.slice(0, maxChars).join("")}…`
}

export function withLocalizedColors(
  items: DashboardChartItem[],
  isArabic: boolean
) {
  return items.map((item, index) => {
    const key = toChartKey(item, index)
    const name = localizeChartName(item, isArabic)
    return {
      ...item,
      key,
      name,
      fill: colorForIndex(index),
    }
  })
}
