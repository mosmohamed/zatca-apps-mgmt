import { useEffect, useRef, useState, type MouseEvent } from "react"
import { useTranslation } from "react-i18next"
import { Check, Copy, ExternalLink, type LucideIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { writeToClipboard } from "@/lib/clipboard"
import { cn } from "@/lib/utils"

type CopyableFieldProps = {
  label: string
  value: string | null | undefined
  /** Optional link target such as `mailto:`, `tel:` or an absolute URL. */
  href?: string
  icon?: LucideIcon
  monospace?: boolean
  className?: string
}

/**
 * Label + value row with an inline copy action.
 *
 * Pointer and keyboard events on the copy button are stopped so that copying a
 * value never bubbles up to the surrounding hover card, table row or link.
 */
export function CopyableField({
  label,
  value,
  href,
  icon: Icon,
  monospace = false,
  className,
}: CopyableFieldProps) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (resetTimer.current) {
        clearTimeout(resetTimer.current)
      }
    },
    []
  )

  const hasValue = typeof value === "string" && value.trim() !== ""

  async function copyValue() {
    if (typeof value !== "string" || value.trim() === "") {
      return
    }

    const succeeded = await writeToClipboard(value)

    if (!succeeded) {
      toast.error(t("common.copyFailed"))
      return
    }

    setCopied(true)
    toast.success(t("entityPreview.copiedField", { label }))

    if (resetTimer.current) {
      clearTimeout(resetTimer.current)
    }
    resetTimer.current = setTimeout(() => setCopied(false), 2000)
  }

  function handleCopyClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()
    void copyValue()
  }

  return (
    <div className={cn("flex min-w-0 items-start gap-2", className)}>
      {Icon ? (
        <Icon className="mt-2 size-3.5 shrink-0 text-muted-foreground" />
      ) : null}

      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>

        {hasValue ? (
          <div className="flex min-w-0 items-center gap-1">
            {href ? (
              <a
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel="noreferrer"
                onClick={(event) => event.stopPropagation()}
                className={cn(
                  "inline-flex min-w-0 items-center gap-1 text-sm text-primary underline-offset-4 hover:underline",
                  monospace && "font-mono text-xs"
                )}
                title={value}
              >
                <span className="truncate">{value}</span>
                {href.startsWith("http") ? (
                  <ExternalLink className="size-3 shrink-0" />
                ) : null}
              </a>
            ) : (
              <span
                className={cn(
                  "min-w-0 truncate text-sm",
                  monospace && "font-mono text-xs"
                )}
                title={value}
              >
                {value}
              </span>
            )}

            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="shrink-0 text-muted-foreground hover:text-foreground"
              onClick={handleCopyClick}
              onPointerDown={(event) => event.stopPropagation()}
              aria-label={t("common.copyValue", { label })}
            >
              {copied ? (
                <Check className="text-emerald-600 dark:text-emerald-400" />
              ) : (
                <Copy />
              )}
            </Button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">—</p>
        )}
      </div>
    </div>
  )
}
