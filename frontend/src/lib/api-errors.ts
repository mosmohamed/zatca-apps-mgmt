import axios from "axios"

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message
    if (typeof message === "string" && message.length > 0) {
      return message
    }
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

export function getApiFieldErrors(
  error: unknown
): Record<string, string[]> | null {
  if (!axios.isAxiosError(error)) {
    return null
  }

  const errors = error.response?.data?.errors
  if (!errors || typeof errors !== "object") {
    return null
  }

  return errors as Record<string, string[]>
}
