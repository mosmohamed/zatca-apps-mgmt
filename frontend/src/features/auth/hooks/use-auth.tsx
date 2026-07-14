import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import axios from "axios"
import { toast } from "sonner"

import { authService } from "@/features/auth/services/auth-service"
import type { AuthUser, LoginPayload } from "@/features/auth/types/auth"
import { authStorage } from "@/lib/auth-storage"

type AuthContextValue = {
  user: AuthUser | null
  token: string | null
  isAuthenticated: boolean
  isBootstrapping: boolean
  isSuperAdmin: boolean
  isEmployee: boolean
  can: (permission: string) => boolean
  login: (payload: LoginPayload) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function getApiErrorMessage(error: unknown, fallback: string): string {
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(
    () => authStorage.getUser<AuthUser>()
  )
  const [token, setToken] = useState<string | null>(() => authStorage.getToken())
  const [isBootstrapping, setIsBootstrapping] = useState(
    () => Boolean(authStorage.getToken())
  )

  const refreshUser = useCallback(async () => {
    const currentUser = await authService.me()
    setUser(currentUser)
    authStorage.setUser(currentUser)
  }, [])

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      if (!authStorage.getToken()) {
        setIsBootstrapping(false)
        return
      }

      try {
        await refreshUser()
      } catch {
        if (!cancelled) {
          authStorage.clear()
          setUser(null)
          setToken(null)
        }
      } finally {
        if (!cancelled) {
          setIsBootstrapping(false)
        }
      }
    }

    void bootstrap()

    return () => {
      cancelled = true
    }
  }, [refreshUser])

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await authService.login(payload)
    authStorage.setToken(response.token)
    authStorage.setUser(response.user)
    setToken(response.token)
    setUser(response.user)
    toast.success("Logged in successfully.")
  }, [])

  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Logout failed."))
    } finally {
      authStorage.clear()
      setToken(null)
      setUser(null)
      toast.success("Logged out successfully.")
    }
  }, [])

  const isSuperAdmin = Boolean(user?.roles.includes("super_admin"))

  const can = useCallback(
    (permission: string) => {
      if (isSuperAdmin) {
        return true
      }
      return Boolean(user?.permissions?.includes(permission))
    },
    [isSuperAdmin, user]
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token && user),
      isBootstrapping,
      isSuperAdmin,
      isEmployee: Boolean(user?.roles.includes("employee")),
      can,
      login,
      logout,
      refreshUser,
    }),
    [user, token, isBootstrapping, isSuperAdmin, can, login, logout, refreshUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }

  return context
}

export { getApiErrorMessage }
