import { Navigate, Outlet } from "react-router-dom"

import { LoadingSkeleton } from "@/components/LoadingSkeleton"
import { useAuth } from "@/features/auth/hooks/use-auth"

type RequirePermissionProps = {
  /** One or more Spatie permission names. */
  permission: string | string[]
  /** `any` = at least one permission; `all` = every permission. */
  mode?: "any" | "all"
}

/**
 * Nested route guard for authenticated users. Redirects to /403 when the
 * signed-in user lacks the required permission(s).
 */
export function RequirePermission({
  permission,
  mode = "any",
}: RequirePermissionProps) {
  const { can, isBootstrapping } = useAuth()
  const required = Array.isArray(permission) ? permission : [permission]

  if (isBootstrapping) {
    return (
      <div className="min-h-[40vh] p-6">
        <LoadingSkeleton variant="page" />
      </div>
    )
  }

  const allowed =
    mode === "all"
      ? required.every((item) => can(item))
      : required.some((item) => can(item))

  if (!allowed) {
    return <Navigate to="/403" replace />
  }

  return <Outlet />
}
