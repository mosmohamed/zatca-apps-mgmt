import { cn } from "@/lib/utils"

type PreviewAvatarProps = {
  initials: string
  tone?: "primary" | "violet" | "emerald"
  className?: string
}

const TONE_STYLES = {
  primary: "bg-primary/10 text-primary",
  violet: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  emerald: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
} as const

export function PreviewAvatar({
  initials,
  tone = "primary",
  className,
}: PreviewAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
        TONE_STYLES[tone],
        className
      )}
    >
      {initials}
    </span>
  )
}
