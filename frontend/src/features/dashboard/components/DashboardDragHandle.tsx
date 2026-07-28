import {
  createContext,
  useContext,
  type ReactNode,
} from "react"
import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core"
import { GripVertical } from "lucide-react"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"

type DashboardDragHandleContextValue = {
  setActivatorNodeRef: (element: HTMLElement | null) => void
  attributes: DraggableAttributes
  listeners: DraggableSyntheticListeners
}

const DashboardDragHandleContext =
  createContext<DashboardDragHandleContextValue | null>(null)

export function DashboardDragHandleProvider({
  value,
  children,
}: {
  value: DashboardDragHandleContextValue
  children: ReactNode
}) {
  return (
    <DashboardDragHandleContext.Provider value={value}>
      {children}
    </DashboardDragHandleContext.Provider>
  )
}

/**
 * Renders the drag grip only when the widget is inside a sortable context.
 * Place this in the card header so it never overlays titles or chart controls.
 */
export function DashboardDragHandle({ className }: { className?: string }) {
  const { t } = useTranslation()
  const context = useContext(DashboardDragHandleContext)

  if (!context) {
    return null
  }

  return (
    <button
      type="button"
      ref={context.setActivatorNodeRef}
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-stroke/80 bg-background/90 text-muted-foreground shadow-sm",
        "cursor-grab touch-none hover:bg-muted hover:text-foreground active:cursor-grabbing",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      aria-label={t("dashboard.layout.dragHandle")}
      {...context.attributes}
      {...context.listeners}
    >
      <GripVertical className="size-4" />
    </button>
  )
}
