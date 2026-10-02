import { Info } from "lucide-react"
import { useTranslation } from "react-i18next"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

type ReleaseManagementLevelLike = {
  name_en: string
  name_ar: string
  note_en?: string | null
  note_ar?: string | null
}

type ReleaseManagementLevelNameProps = {
  level: ReleaseManagementLevelLike
  className?: string
  showIcon?: boolean
  /** Force which language to display (defaults to current UI language). */
  locale?: "en" | "ar"
}

export function ReleaseManagementLevelName({
  level,
  className,
  showIcon = true,
  locale,
}: ReleaseManagementLevelNameProps) {
  const { i18n } = useTranslation()
  const isArabic =
    locale === "ar" ||
    (locale !== "en" && i18n.language.startsWith("ar"))
  const name = isArabic ? level.name_ar : level.name_en
  const note = (isArabic ? level.note_ar : level.note_en)?.trim() || null

  if (!note) {
    return <span className={cn(className)}>{name}</span>
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex max-w-full cursor-default items-center gap-1 rounded-sm",
            "underline decoration-dotted underline-offset-4",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            className
          )}
          tabIndex={0}
        >
          <span className="truncate">{name}</span>
          {showIcon ? (
            <Info className="size-3.5 shrink-0 text-muted-foreground" />
          ) : null}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs text-start">{note}</TooltipContent>
    </Tooltip>
  )
}
