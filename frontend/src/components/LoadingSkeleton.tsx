import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

type LoadingSkeletonProps = {
  variant?: "page" | "table" | "cards" | "form"
  className?: string
  rows?: number
}

export function LoadingSkeleton({
  variant = "page",
  className,
  rows = 5,
}: LoadingSkeletonProps) {
  if (variant === "table") {
    return (
      <div className={cn("space-y-3 rounded-xl border border-stroke bg-card p-4", className)}>
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-28" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: rows }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (variant === "cards") {
    return (
      <div className={cn("grid gap-4 md:grid-cols-3", className)}>
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="space-y-3 rounded-xl border border-stroke bg-card p-5"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
    )
  }

  if (variant === "form") {
    return (
      <div className={cn("space-y-4 rounded-xl border border-stroke bg-card p-6", className)}>
        <Skeleton className="h-6 w-40" />
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-full" />
          </div>
        ))}
        <Skeleton className="h-9 w-32" />
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-80 max-w-full" />
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-28 w-full rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}
