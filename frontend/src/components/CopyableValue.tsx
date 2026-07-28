import { useEffect, useRef, useState, type MouseEvent } from "react"
import { Check, Copy, ExternalLink } from "lucide-react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { writeToClipboard } from "@/lib/clipboard"
import { cn } from "@/lib/utils"

type CopyableValueProps = {
  value: string
  /** Human readable name of the value, used for the accessible copy label. */
  label: string
  href?: string
  className?: string
  valueClassName?: string
  monospace?: boolean
}

export function CopyableValue({
  value,
  label,
  href,
  className,
  valueClassName,
  monospace = true,
}: CopyableValueProps) {
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

  async function handleCopy() {
    const succeeded = await writeToClipboard(value)

    if (!succeeded) {
      toast.error(t("common.copyFailed"))
      return
    }

    setCopied(true)
    toast.success(t("common.copied"))

    if (resetTimer.current) {
      clearTimeout(resetTimer.current)
    }
    resetTimer.current = setTimeout(() => setCopied(false), 2000)
  }

  function handleCopyClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault()
    event.stopPropagation()
    void handleCopy()
  }

  return (
    <div className={cn("flex min-w-0 items-center gap-1.5", className)}>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className={cn(
            "inline-flex min-w-0 items-center gap-1.5 text-primary underline-offset-4 hover:underline",
            monospace && "font-mono text-xs",
            valueClassName
          )}
        >
          <span className="truncate">{value}</span>
          <ExternalLink className="size-3.5 shrink-0" />
        </a>
      ) : (
        <span
          className={cn(
            "min-w-0 truncate",
            monospace && "font-mono text-xs",
            valueClassName
          )}
          title={value}
        >
          {value}
        </span>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="size-6 shrink-0 text-muted-foreground hover:text-foreground"
        onClick={handleCopyClick}
        onPointerDown={(event) => event.stopPropagation()}
        aria-label={t("common.copyValue", { label })}
      >
        {copied ? (
          <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <Copy className="size-3.5" />
        )}
      </Button>
    </div>
  )
}
