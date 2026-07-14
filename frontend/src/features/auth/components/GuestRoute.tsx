import { Navigate } from "react-router-dom"
import type { ReactNode } from "react"

import { LoadingSkeleton } from "@/components/LoadingSkeleton"
import { useAuth } from "@/features/auth/hooks/use-auth"

export function GuestRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isBootstrapping } = useAuth()

  if (isBootstrapping) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-body p-6">
        <div className="w-full max-w-md">
          <LoadingSkeleton variant="form" rows={2} />
        </div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return children
}
