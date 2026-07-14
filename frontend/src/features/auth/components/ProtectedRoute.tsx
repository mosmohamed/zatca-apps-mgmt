import { Navigate, Outlet, useLocation } from "react-router-dom"

import { LoadingSkeleton } from "@/components/LoadingSkeleton"
import { useAuth } from "@/features/auth/hooks/use-auth"

export function ProtectedRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth()
  const location = useLocation()

  if (isBootstrapping) {
    return (
      <div className="min-h-screen bg-body p-6">
        <LoadingSkeleton variant="page" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
