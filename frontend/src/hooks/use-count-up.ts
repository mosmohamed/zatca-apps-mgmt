import { useEffect, useState } from "react"

/**
 * Animates from 0 to `target` with an ease-out curve.
 * Respects prefers-reduced-motion.
 */
export function useCountUp(
  target: number,
  options?: { durationMs?: number; enabled?: boolean }
): number {
  const durationMs = options?.durationMs ?? 850
  const enabled = options?.enabled ?? true
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!enabled) {
      setValue(target)
      return
    }

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setValue(target)
      return
    }

    let frameId = 0
    const start = performance.now()

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / durationMs)
      const eased = 1 - (1 - progress) ** 3
      setValue(Math.round(target * eased))
      if (progress < 1) {
        frameId = window.requestAnimationFrame(tick)
      }
    }

    frameId = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frameId)
  }, [target, durationMs, enabled])

  return value
}
