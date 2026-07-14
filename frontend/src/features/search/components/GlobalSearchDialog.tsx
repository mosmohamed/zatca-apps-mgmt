import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  AppWindow,
  Building2,
  Cpu,
  Loader2,
  Search,
  Truck,
  Users,
} from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useGlobalSearch } from "@/features/search/hooks/use-global-search"
import type {
  SearchEntityType,
  SearchResultItem,
} from "@/features/search/types/search"

type GlobalSearchDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const ENTITY_ICONS: Record<SearchEntityType, typeof AppWindow> = {
  applications: AppWindow,
  vendors: Truck,
  users: Users,
  technologies: Cpu,
  departments: Building2,
}

function resolveRoute(item: SearchResultItem): string {
  switch (item.type) {
    case "applications":
      return `/applications-details/${item.id}`
    case "vendors":
      return `/vendors?q=${encodeURIComponent(item.title)}`
    case "users":
      return `/users?q=${encodeURIComponent(item.title)}`
    case "technologies":
      return `/technologies?q=${encodeURIComponent(item.title)}`
    case "departments":
      return `/departments?q=${encodeURIComponent(item.title)}`
    default:
      return "/"
  }
}

export function GlobalSearchDialog({
  open,
  onOpenChange,
}: GlobalSearchDialogProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [query, setQuery] = useState("")

  const searchQuery = useGlobalSearch(query)
  const groups = searchQuery.data?.groups ?? []
  const hasQuery = query.trim().length >= 2
  const hasResults = groups.some((group) => group.items.length > 0)

  useEffect(() => {
    if (!open) {
      setQuery("")
    }
  }, [open])

  function handleSelect(item: SearchResultItem) {
    onOpenChange(false)
    navigate(resolveRoute(item))
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("search.dialogTitle")}
      description={t("search.dialogDescription")}
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder={t("search.placeholder")}
      />
      <CommandList>
        {!hasQuery ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
            <Search className="size-8 opacity-40" />
            <p>{t("search.hint")}</p>
          </div>
        ) : searchQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            {t("search.searching")}
          </div>
        ) : !hasResults ? (
          <CommandEmpty>{t("search.noResults", { query })}</CommandEmpty>
        ) : (
          groups
            .filter((group) => group.items.length > 0)
            .map((group) => {
              const Icon = ENTITY_ICONS[group.type]
              return (
                <CommandGroup
                  key={group.type}
                  heading={t(`search.groups.${group.type}`)}
                >
                  {group.items.map((item) => (
                    <CommandItem
                      key={`${item.type}-${item.id}`}
                      value={`${item.type}-${item.id}-${item.title}`}
                      onSelect={() => handleSelect(item)}
                    >
                      <Icon />
                      <div className="flex flex-col">
                        <span>{item.title}</span>
                        {item.subtitle ? (
                          <span className="text-xs text-muted-foreground">
                            {item.subtitle}
                          </span>
                        ) : null}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )
            })
        )}
      </CommandList>
    </CommandDialog>
  )
}
