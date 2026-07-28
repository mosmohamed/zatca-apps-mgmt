import { useEffect } from "react"

/**
 * Asks the browser to confirm a full page unload (reload, tab close, external
 * link) while a form still holds unsaved changes. In-app navigation is guarded
 * separately because the router is not a data router.
 */
export function useUnsavedChangesWarning(enabled: boolean): void {
  useEffect(() => {
    if (!enabled) {
      return
    }

    function handleBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault()
      event.returnValue = ""
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [enabled])
}
