import type { CSSProperties, ReactNode } from "react"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { DashboardDragHandleProvider } from "@/features/dashboard/components/DashboardDragHandle"
import { cn } from "@/lib/utils"

type SortableDashboardWidgetProps = {
  id: string
  children: ReactNode
  className?: string
  style?: CSSProperties
}

export function SortableDashboardWidget({
  id,
  children,
  className,
  style,
}: SortableDashboardWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const mergedStyle: CSSProperties = {
    ...style,
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={mergedStyle}
      className={cn(
        "min-w-0",
        isDragging && "z-20 opacity-90 shadow-lg ring-2 ring-primary/30",
        className
      )}
    >
      <DashboardDragHandleProvider
        value={{
          setActivatorNodeRef,
          attributes,
          listeners,
        }}
      >
        {children}
      </DashboardDragHandleProvider>
    </div>
  )
}
