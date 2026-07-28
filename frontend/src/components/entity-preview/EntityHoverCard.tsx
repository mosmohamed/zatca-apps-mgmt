import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react"
import { useTranslation } from "react-i18next"
import { TriangleAlert } from "lucide-react"

import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const DEFAULT_OPEN_DELAY = 400
const DEFAULT_CLOSE_DELAY = 180

export type PreviewTriggerState = {
  isOpen: boolean
  open: () => void
  close: () => void
}

export type EntityHoverCardProps = {
  /**
   * Focusable element (link or button) the preview is anchored to. Pass a
   * function to react to the open state or to reveal the card on activation.
   */
  trigger: ReactNode | ((state: PreviewTriggerState) => ReactNode)
  /** Card body rendered once the preview data is available. */
  children: ReactNode
  /** Accessible name of the preview dialog. */
  label: string
  isLoading?: boolean
  isError?: boolean
  errorMessage?: string
  disabled?: boolean
  openDelay?: number
  closeDelay?: number
  align?: "start" | "center" | "end"
  side?: "top" | "right" | "bottom" | "left"
  className?: string
  contentClassName?: string
  onOpenChange?: (open: boolean) => void
}

/**
 * Hover/focus triggered preview surface.
 *
 * Built on the Popover primitive rather than the hover-card primitive because
 * the preview body contains interactive controls (copy buttons, links) that
 * must stay reachable — the hover-card primitive removes every descendant from
 * the tab order by design. Hover, focus, pointer-grace-period and dismissal
 * are therefore driven manually here.
 */
export function EntityHoverCard({
  trigger,
  children,
  label,
  isLoading = false,
  isError = false,
  errorMessage,
  disabled = false,
  openDelay = DEFAULT_OPEN_DELAY,
  closeDelay = DEFAULT_CLOSE_DELAY,
  align = "start",
  side = "bottom",
  className,
  contentClassName,
  onOpenChange,
}: EntityHoverCardProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLSpanElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const openTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const suppressFocusOpen = useRef(false)

  const clearTimers = useCallback(() => {
    if (openTimer.current) {
      clearTimeout(openTimer.current)
      openTimer.current = null
    }
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }, [])

  useEffect(() => clearTimers, [clearTimers])

  const changeOpen = useCallback(
    (next: boolean) => {
      setOpen(next)
      onOpenChange?.(next)
    },
    [onOpenChange]
  )

  const openNow = useCallback(() => {
    if (disabled) {
      return
    }
    clearTimers()
    changeOpen(true)
  }, [changeOpen, clearTimers, disabled])

  const closeNow = useCallback(() => {
    clearTimers()
    changeOpen(false)
  }, [changeOpen, clearTimers])

  const scheduleOpen = useCallback(() => {
    if (disabled) {
      return
    }
    clearTimers()
    openTimer.current = setTimeout(() => changeOpen(true), openDelay)
  }, [changeOpen, clearTimers, disabled, openDelay])

  const scheduleClose = useCallback(() => {
    clearTimers()
    closeTimer.current = setTimeout(() => changeOpen(false), closeDelay)
  }, [changeOpen, clearTimers, closeDelay])

  /**
   * Returning focus to the trigger after a dismissal would immediately
   * re-open the card through the focus handler, so the next focus event is
   * ignored once.
   */
  const focusTrigger = useCallback(() => {
    const target = anchorRef.current?.querySelector<HTMLElement>(
      "a[href], button, [tabindex]:not([tabindex='-1'])"
    )

    if (!target) {
      return
    }

    suppressFocusOpen.current = true
    target.focus()
  }, [])

  function handleAnchorFocus() {
    if (suppressFocusOpen.current) {
      suppressFocusOpen.current = false
      return
    }
    openNow()
  }

  function handleAnchorPointerEnter(event: PointerEvent<HTMLSpanElement>) {
    if (event.pointerType === "touch") {
      return
    }
    scheduleOpen()
  }

  function handleAnchorPointerLeave(event: PointerEvent<HTMLSpanElement>) {
    if (event.pointerType === "touch") {
      return
    }
    scheduleClose()
  }

  function handleAnchorKeyDown(event: KeyboardEvent<HTMLSpanElement>) {
    if (!open) {
      return
    }

    if (event.key === "Escape") {
      event.stopPropagation()
      closeNow()
      return
    }

    // Move focus into the preview so its copy buttons and links stay usable
    // for keyboard users, since the portalled card is outside the tab order.
    if (event.key === "Tab" && !event.shiftKey && contentRef.current) {
      event.preventDefault()
      contentRef.current.focus()
    }
  }

  function isInsidePreview(element: Element | null): boolean {
    if (!element) {
      return false
    }
    return (
      Boolean(contentRef.current?.contains(element)) ||
      Boolean(anchorRef.current?.contains(element))
    )
  }

  function handleBlur(event: FocusEvent<HTMLElement>) {
    if (isInsidePreview(event.relatedTarget)) {
      return
    }
    scheduleClose()
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        clearTimers()
        changeOpen(next)
      }}
    >
      <PopoverAnchor asChild>
        <span
          ref={anchorRef}
          className={cn("inline-flex min-w-0 max-w-full align-middle", className)}
          onPointerEnter={handleAnchorPointerEnter}
          onPointerLeave={handleAnchorPointerLeave}
          onFocus={handleAnchorFocus}
          onBlur={handleBlur}
          onKeyDown={handleAnchorKeyDown}
        >
          {typeof trigger === "function"
            ? trigger({ isOpen: open, open: openNow, close: closeNow })
            : trigger}
        </span>
      </PopoverAnchor>

      <PopoverContent
        ref={contentRef}
        role="dialog"
        aria-label={label}
        aria-busy={isLoading}
        tabIndex={-1}
        align={align}
        side={side}
        sideOffset={10}
        collisionPadding={16}
        onOpenAutoFocus={(event) => event.preventDefault()}
        onCloseAutoFocus={(event) => event.preventDefault()}
        onEscapeKeyDown={() => {
          closeNow()
          focusTrigger()
        }}
        onPointerEnter={clearTimers}
        onPointerLeave={scheduleClose}
        onFocusCapture={clearTimers}
        onBlur={handleBlur}
        className={cn(
          "w-80 max-w-[calc(100vw-2rem)] overflow-y-auto p-0 shadow-lg",
          "max-h-[var(--radix-popover-content-available-height)]",
          "duration-200",
          contentClassName
        )}
      >
        {isLoading ? (
          <EntityPreviewSkeleton />
        ) : isError ? (
          <div className="flex items-start gap-2.5 p-4 text-sm text-muted-foreground">
            <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p>{errorMessage ?? t("entityPreview.loadFailed")}</p>
          </div>
        ) : (
          children
        )}
      </PopoverContent>
    </Popover>
  )
}

export function EntityPreviewSkeleton() {
  return (
    <div className="space-y-3 p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <Skeleton className="h-px w-full" />
      <div className="space-y-2.5">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
        <Skeleton className="h-3 w-3/5" />
      </div>
    </div>
  )
}
