import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

export function PreviewAvatar({
  initials,
  className,
}: {
  initials: string
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary",
        className
      )}
    >
      {initials}
    </span>
  )
}

export function PreviewHeader({
  visual,
  title,
  subtitle,
  trailing,
}: {
  visual: ReactNode
  title: ReactNode
  subtitle?: ReactNode
  trailing?: ReactNode
}) {
  return (
    <div className="flex items-start gap-3 border-b border-stroke/60 bg-muted/25 p-4">
      {visual}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold leading-tight">{title}</p>
        {subtitle ? (
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {subtitle}
          </p>
        ) : null}
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  )
}

export function PreviewBody({ children }: { children: ReactNode }) {
  return <dl className="space-y-2 p-4 text-sm">{children}</dl>
}

export function PreviewRow({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <dt className="w-24 shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 text-xs font-medium">{children}</dd>
    </div>
  )
}

export function PreviewFooter({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-stroke/60 bg-muted/20 px-4 py-2.5">
      {children}
    </div>
  )
}

export function PreviewStat({
  label,
  value,
}: {
  label: string
  value: number | string
}) {
  return (
    <p className="text-xs text-muted-foreground">
      <span className="font-semibold text-foreground">{value}</span>{" "}
      <span>{label}</span>
    </p>
  )
}

export function PreviewText({ value }: { value: string | null | undefined }) {
  if (!value) {
    return <span className="text-muted-foreground">—</span>
  }

  return <span className="break-words">{value}</span>
}
