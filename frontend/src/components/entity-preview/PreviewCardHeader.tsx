import type { ReactNode } from "react"

import { PreviewAvatar } from "@/components/entity-preview/PreviewAvatar"
import { cn } from "@/lib/utils"

type PreviewCardHeaderProps = {
  initials: string
  title: string
  subtitle?: string | null
  tone?: "primary" | "violet" | "emerald"
  badges?: ReactNode
  className?: string
}

export function PreviewCardHeader({
  initials,
  title,
  subtitle,
  tone,
  badges,
  className,
}: PreviewCardHeaderProps) {
  return (
    <header
      className={cn(
        "flex items-start gap-3 border-b border-border/60 bg-muted/25 p-4",
        className
      )}
    >
      <PreviewAvatar initials={initials} tone={tone} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-tight" title={title}>
          {title}
        </p>
        {subtitle ? (
          <p className="mt-0.5 truncate text-xs text-muted-foreground" title={subtitle}>
            {subtitle}
          </p>
        ) : null}
        {badges ? (
          <div className="mt-2 flex flex-wrap items-center gap-1">{badges}</div>
        ) : null}
      </div>
    </header>
  )
}
