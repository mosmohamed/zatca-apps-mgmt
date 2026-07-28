import type { ReactElement } from "react"
import { Link } from "react-router-dom"

import { cn } from "@/lib/utils"

type PreviewTriggerOptions = {
  name: string
  /** Accessible name; must contain the visible name. */
  ariaLabel: string
  /** Detail route. When omitted the trigger only toggles the preview. */
  to?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  className?: string
}

const TRIGGER_CLASSES =
  "inline-flex max-w-full cursor-pointer items-center rounded-sm text-start font-medium text-inherit underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"

/**
 * Builds the focusable element a preview card is anchored to. Radix clones this
 * element through `HoverCardTrigger asChild`, so it must be a host element.
 */
export function createPreviewTrigger({
  name,
  ariaLabel,
  to,
  open,
  onOpenChange,
  className,
}: PreviewTriggerOptions): ReactElement {
  const classes = cn(TRIGGER_CLASSES, className)

  if (to) {
    return (
      <Link to={to} className={classes} aria-label={ariaLabel} title={name}>
        <span className="truncate">{name}</span>
      </Link>
    )
  }

  return (
    <button
      type="button"
      className={classes}
      aria-label={ariaLabel}
      aria-expanded={open}
      title={name}
      onClick={(event) => {
        event.stopPropagation()
        onOpenChange(!open)
      }}
    >
      <span className="truncate">{name}</span>
    </button>
  )
}
