/**
 * Writes a value to the system clipboard.
 *
 * Returns `false` instead of throwing when the Clipboard API is unavailable
 * (insecure origin, unsupported browser) or the user denied permission, so
 * callers can surface a localized error message.
 */
export async function writeToClipboard(value: string): Promise<boolean> {
  if (!navigator.clipboard?.writeText) {
    return false
  }

  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    return false
  }
}
