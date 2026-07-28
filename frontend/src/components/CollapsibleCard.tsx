import { useId, useState, type ReactNode } from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"

type CollapsibleCardProps = {
  title: string
  description?: string
  icon?: ReactNode
  badge?: ReactNode
  actions?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
  className?: string
  contentClassName?: string
}

/**
 * Card shell with a disclosure header. Used instead of an accordion so several
 * sections can stay expanded at once while a page is being edited.
 */
export function CollapsibleCard({
  title,
  description,
  icon,
  badge,
  actions,
  defaultOpen = false,
  children,
  className,
  contentClassName,
}: CollapsibleCardProps) {
  const [open, setOpen] = useState(defaultOpen)
  const contentId = useId()

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-stroke/80 bg-card shadow-sm",
        className
      )}
    >
      <div className="flex items-center gap-2 border-b border-stroke/60 bg-muted/20 px-3 py-2.5 sm:px-4">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          aria-controls={contentId}
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-md text-start outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronDown
            className={cn(
              "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
              open ? "rotate-0" : "-rotate-90 rtl:rotate-90"
            )}
          />
          {icon ? (
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {icon}
            </span>
          ) : null}
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span className="truncate text-sm font-semibold">{title}</span>
              {badge}
            </span>
            {description ? (
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                {description}
              </span>
            ) : null}
          </span>
        </button>
        {actions ? (
          <div className="flex shrink-0 items-center gap-1.5">{actions}</div>
        ) : null}
      </div>
      {open ? (
        <div id={contentId} className={cn("p-3 sm:p-4", contentClassName)}>
          {children}
        </div>
      ) : null}
    </div>
  )
}
