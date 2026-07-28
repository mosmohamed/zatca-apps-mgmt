import { Link } from "react-router-dom"

import { cn } from "@/lib/utils"

const TRIGGER_CLASSES =
  "inline-flex min-w-0 max-w-full items-center truncate rounded-sm text-start underline-offset-4 outline-none transition-colors hover:text-primary hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"

type PreviewTriggerProps = {
  name: string
  /** Detail route. When omitted the trigger only reveals the preview. */
  to?: string
  isOpen: boolean
  /** Called when a non-navigating trigger is activated. */
  onActivate: () => void
  className?: string
}

/**
 * Focusable label that anchors an entity preview. Renders a router link when a
 * detail route is available, otherwise a disclosure button.
 */
export function PreviewTrigger({
  name,
  to,
  isOpen,
  onActivate,
  className,
}: PreviewTriggerProps) {
  if (to) {
    return (
      <Link
        to={to}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={cn(TRIGGER_CLASSES, className)}
      >
        <span className="truncate">{name}</span>
      </Link>
    )
  }

  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      onClick={onActivate}
      className={cn(TRIGGER_CLASSES, "cursor-default", className)}
    >
      <span className="truncate">{name}</span>
    </button>
  )
}
