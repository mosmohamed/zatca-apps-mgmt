import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Download, Loader2, Network, Search } from "lucide-react"

import { EmptyState } from "@/components/EmptyState"
import { LoadingSkeleton } from "@/components/LoadingSkeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { InfraTeamStreamCard } from "@/features/operation-infra/components/InfraTeamStreamCard"
import { useInfraEscalationExport } from "@/features/operation-infra/hooks/use-infra-escalation-export"
import { useInfraTeamsDetails } from "@/features/operation-infra/hooks/use-operation-infra"
import { useDebouncedValue } from "@/hooks/use-debounced-value"

export function InfraTeamsDetailsPage() {
  const { t } = useTranslation()
  const { can } = useAuth()
  const canExport = can("infra-team-assignments.view")
  const { exportAll, isExportingAll } = useInfraEscalationExport()

  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search, 200)

  const detailsQuery = useInfraTeamsDetails()
  const cards = detailsQuery.data ?? []

  const filteredCards = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase()
    if (!query) {
      return cards
    }

    return cards.filter((card) => {
      const haystack = [
        card.title_en,
        card.title_ar,
        card.name_en,
        card.name_ar,
        card.code,
        card.parent?.name_en,
        card.parent?.name_ar,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return haystack.includes(query)
    })
  }, [cards, debouncedSearch])

  const isLoading = detailsQuery.isLoading

  return (
    <section className="space-y-5 animate-in fade-in-0 duration-300">
      <div className="relative overflow-hidden rounded-2xl border border-stroke/80 bg-gradient-to-br from-sky-50/80 via-card to-violet-50/60 p-5 shadow-sm dark:from-sky-950/30 dark:via-card dark:to-violet-950/20">
        <div className="pointer-events-none absolute -end-10 -top-10 size-32 rounded-full bg-sky-400/20 blur-2xl" />
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              {t("operationInfra.details.title")}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {t("operationInfra.details.description")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs font-medium text-muted-foreground">
              {t("operationInfra.details.showingCount", {
                shown: filteredCards.length,
                total: cards.length,
              })}
            </p>
            {canExport ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isExportingAll || cards.length === 0}
                onClick={() => void exportAll()}
              >
                {isExportingAll ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Download />
                )}
                {t("operationInfra.details.exportExcel")}
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="relative sm:max-w-sm">
        <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("operationInfra.details.searchPlaceholder")}
          className="h-9 ps-9"
        />
      </div>

      {isLoading ? <LoadingSkeleton variant="cards" /> : null}

      {!isLoading && filteredCards.length === 0 ? (
        <EmptyState
          icon={<Network className="size-6" />}
          title={t("operationInfra.details.emptyTitle")}
          description={
            debouncedSearch
              ? t("common.tryDifferentSearch")
              : t("operationInfra.details.emptyDescription")
          }
        />
      ) : null}

      {!isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredCards.map((card, index) => (
            <InfraTeamStreamCard
              key={card.id}
              card={card}
              accentIndex={index}
              style={{
                animationDelay: `${Math.min(index * 35, 420)}ms`,
                animationFillMode: "both",
              }}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}
