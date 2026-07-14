import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

type SidebarContextValue = {
  isExpanded: boolean
  isMobileOpen: boolean
  toggleExpanded: () => void
  toggleMobile: () => void
  closeMobile: () => void
}

const SidebarContext = createContext<SidebarContextValue | null>(null)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const toggleExpanded = useCallback(() => {
    setIsExpanded((value) => !value)
  }, [])

  const toggleMobile = useCallback(() => {
    setIsMobileOpen((value) => !value)
  }, [])

  const closeMobile = useCallback(() => {
    setIsMobileOpen(false)
  }, [])

  const value = useMemo(
    () => ({
      isExpanded,
      isMobileOpen,
      toggleExpanded,
      toggleMobile,
      closeMobile,
    }),
    [isExpanded, isMobileOpen, toggleExpanded, toggleMobile, closeMobile]
  )

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider")
  }
  return context
}
