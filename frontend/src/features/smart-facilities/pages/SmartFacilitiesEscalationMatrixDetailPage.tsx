import { useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  ArrowLeft,
  ChevronDown,
  Download,
  Loader2,
  Mail,
  Phone,
  Users,
} from "lucide-react"

import { EmptyState } from "@/components/EmptyState"
import { LoadingSkeleton } from "@/components/LoadingSkeleton"
import { UserPreviewLink } from "@/components/entity-preview/UserPreviewLink"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useAuth } from "@/features/auth/hooks/use-auth"
import { SmartFacilitiesLevelName } from "@/features/smart-facilities/components/SmartFacilitiesLevelName"
import { useSmartFacilitiesEscalationExport } from "@/features/smart-facilities/hooks/use-smart-facilities-escalation-export"
import { useSmartFacilitiesTeamsDetails } from "@/features/smart-facilities/hooks/use-smart-facilities"
import type { SmartFacilitiesTeamDetailsLevel } from "@/features/smart-facilities/types/smart-facilities"
import { cn } from "@/lib/utils"

const LEVEL_ACCENTS = [
  "border-sky-400/60 bg-sky-500/10 text-sky-700 dark:text-sky-300",
  "border-cyan-400/60 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300",
  "border-emerald-400/60 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
  "border-amber-400/60 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  "border-violet-400/60 bg-violet-500/10 text-violet-700 dark:text-violet-300",
] as const

export function SmartFacilitiesEscalationMatrixDetailPage() {
  const { t, i18n } = useTranslation()
  const isArabic = i18n.language.startsWith("ar")
  const { can } = useAuth()
  const canExport = can("smart-facilities-escalation-matrix.view")
  const { exportCategory, isExportingCategory } = useSmartFacilitiesEscalationExport()
  const { id } = useParams()
  const numericId = id ? Number(id) : NaN

  const detailsQuery = useSmartFacilitiesTeamsDetails()
  const cards = detailsQuery.data ?? []

  const card = useMemo(
    () => cards.find((item) => item.id === numericId) ?? null,
    [cards, numericId]
  )

  const levelsWithMembers = useMemo(
    () => (card?.levels ?? []).filter((level) => level.members.length > 0),
    [card]
  )

  const [activeLevelId, setActiveLevelId] = useState<number | null>(null)
  const exporting = card ? isExportingCategory(card.id) : false

  useEffect(() => {
    if (levelsWithMembers.length === 0) {
      setActiveLevelId(null)
      return
    }
    setActiveLevelId((current) => {
      if (current && levelsWithMembers.some((level) => level.id === current)) {
        return current
      }
      return levelsWithMembers[0]?.id ?? null
    })
  }, [levelsWithMembers])

  if (detailsQuery.isLoading) {
    return (
      <section className="space-y-4">
        <LoadingSkeleton variant="page" />
      </section>
    )
  }

  if (Number.isNaN(numericId)) {
    return (
      <section className="space-y-4">
        <EmptyState
          title={t("smartFacilities.detail.invalidId")}
          description={t("smartFacilities.detail.invalidIdDescription")}
        />
      </section>
    )
  }

  if (!card) {
    return (
      <section className="space-y-4">
        <EmptyState
          title={t("smartFacilities.detail.notFoundTitle")}
          description={t("smartFacilities.detail.notFoundDescription")}
          actionLabel={t("smartFacilities.detail.backToList")}
          onAction={() => {
            window.location.href = "/smart-facilities-escalation-matrix"
          }}
        />
      </section>
    )
  }

  const title = isArabic ? card.title_ar : card.title_en
  const activeLevel =
    levelsWithMembers.find((level) => level.id === activeLevelId) ?? null

  return (
    <TooltipProvider>
      <section className="space-y-5 animate-in fade-in-0 duration-300">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ms-2 mb-2">
            <Link to="/smart-facilities-escalation-matrix">
              <ArrowLeft className="size-4 rtl:rotate-180" />
              {t("smartFacilities.detail.backToList")}
            </Link>
          </Button>

          <div className="relative overflow-hidden rounded-2xl border border-stroke/80 bg-gradient-to-br from-slate-50 via-card to-sky-50/70 p-5 shadow-sm dark:from-slate-950/40 dark:via-card dark:to-sky-950/20">
            <div className="pointer-events-none absolute -end-12 -top-12 size-40 rounded-full bg-sky-400/15 blur-3xl" />
            <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {t("smartFacilities.detail.escalationMatrix")}
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-tight">
                  {title}
                </h2>
                <p className="mt-1 font-mono text-xs text-muted-foreground">
                  {card.code}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="rounded-xl bg-background/70 px-3 py-2 text-sm text-muted-foreground shadow-sm">
                  <span className="font-semibold tabular-nums text-foreground">
                    {card.members_count}
                  </span>{" "}
                  {t("smartFacilities.details.metrics.members")}
                </div>
                {canExport ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={exporting}
                    onClick={() => void exportCategory(card.id)}
                  >
                    {exporting ? (
                      <Loader2 className="animate-spin" />
                    ) : (
                      <Download />
                    )}
                    {t("smartFacilities.details.exportCategory")}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        {levelsWithMembers.length === 0 ? (
          <EmptyState
            icon={<Users className="size-6" />}
            title={t("smartFacilities.detail.noMembersTitle")}
            description={t("smartFacilities.detail.noMembersDescription")}
          />
        ) : (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
            <div className="relative rounded-2xl border border-stroke/80 bg-card p-4 shadow-sm">
              <p className="mb-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("smartFacilities.detail.escalationPath")}
              </p>

              <ol className="relative space-y-0">
                {levelsWithMembers.map((level, index) => {
                  const levelName = isArabic ? level.name_ar : level.name_en
                  const isActive = level.id === activeLevelId
                  const accent =
                    LEVEL_ACCENTS[index % LEVEL_ACCENTS.length]

                  return (
                    <li key={level.id} className="relative flex gap-3 pb-5 last:pb-0">
                      {index < levelsWithMembers.length - 1 ? (
                        <span
                          aria-hidden
                          className="absolute start-[15px] top-8 h-[calc(100%-1.25rem)] w-px bg-gradient-to-b from-border to-border/30"
                        />
                      ) : null}

                      <button
                        type="button"
                        onClick={() => setActiveLevelId(level.id)}
                        className={cn(
                          "relative z-10 mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-all duration-300",
                          isActive
                            ? cn(accent, "scale-110 shadow-sm")
                            : "border-border bg-muted/50 text-muted-foreground hover:bg-muted"
                        )}
                        aria-pressed={isActive}
                        aria-label={levelName}
                      >
                        {index}
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveLevelId(level.id)}
                        className={cn(
                          "min-w-0 flex-1 rounded-xl border px-3 py-2.5 text-start transition-all duration-300",
                          isActive
                            ? "border-primary/30 bg-primary/5 shadow-sm"
                            : "border-transparent bg-muted/25 hover:bg-muted/45"
                        )}
                        style={{
                          animationDelay: `${index * 60}ms`,
                          animationFillMode: "both",
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <SmartFacilitiesLevelName
                              level={level}
                              className="text-sm font-semibold"
                            />
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              {t("smartFacilities.detail.memberCount", {
                                count: level.members.length,
                              })}
                            </p>
                          </div>
                          <ChevronDown
                            className={cn(
                              "mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-300 lg:hidden",
                              isActive && "rotate-180"
                            )}
                          />
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ol>
            </div>

            <div className="min-h-[280px] rounded-2xl border border-stroke/80 bg-card p-4 shadow-sm animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
              {activeLevel ? (
                <LevelMembersPanel
                  level={activeLevel}
                  isArabic={isArabic}
                />
              ) : null}
            </div>
          </div>
        )}
      </section>
    </TooltipProvider>
  )
}

function LevelMembersPanel({
  level,
  isArabic,
}: {
  level: SmartFacilitiesTeamDetailsLevel
  isArabic: boolean
}) {
  const { t } = useTranslation()
  const levelNote = isArabic ? level.note_ar : level.note_en

  return (
    <div key={level.id} className="animate-in fade-in-0 zoom-in-95 duration-300">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-stroke/70 pb-3">
        <div>
          <h3 className="text-base font-semibold">
            <SmartFacilitiesLevelName level={level} className="text-base font-semibold" />
          </h3>
          {levelNote ? (
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              {levelNote}
            </p>
          ) : null}
        </div>
        <Badge variant="muted">
          {t("smartFacilities.detail.memberCount", {
            count: level.members.length,
          })}
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {level.members.map((member, index) => (
          <div
            key={member.assignment_id}
            className="rounded-xl border border-stroke/70 bg-muted/20 p-3.5 transition-colors duration-200 hover:bg-muted/40 animate-in fade-in-0 slide-in-from-bottom-1"
            style={{
              animationDelay: `${Math.min(index * 40, 320)}ms`,
              animationFillMode: "both",
            }}
          >
            <UserPreviewLink
              userId={member.user_id}
              name={member.full_name}
              className="text-sm font-semibold"
            />
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              {member.email ? (
                <p className="flex items-center gap-1.5 truncate">
                  <Mail className="size-3 shrink-0" />
                  <span className="truncate">{member.email}</span>
                </p>
              ) : null}
              {member.phone ? (
                <p className="flex items-center gap-1.5">
                  <Phone className="size-3 shrink-0" />
                  {member.phone}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
