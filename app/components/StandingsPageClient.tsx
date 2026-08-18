/**
 * League standings.
 *
 * A real table, edited by hand from the admin panel one team at a time --
 * the league runs on reported results rather than every game being logged
 * with a final score, so the numbers here are entered directly instead of
 * being computed from `games`. Goal difference and points are computed at
 * read time (see lib/standings.ts) so they can never drift from the games
 * played/wins/draws/losses/goals a row was built from.
 *
 * What shows depends on `league_config.phase`: signups and draft have no
 * current-season games yet, so this shows last season's final table
 * (read-only, from the archive) instead of an empty live one. Season shows
 * the live editable table. Playoffs shows the bracket above the live table.
 */

'use client'

import { useEffect, useState } from 'react'
import {
  getStandings,
  getLeagueConfig,
  getLatestArchiveSeason,
  getArchiveStandings,
} from '@/lib/supabaseData'
import { useAdmin } from '@/lib/adminContext'
import { Standing } from '@/types/standing'
import { LeaguePhase } from '@/lib/supabase'
import { PageHeader } from './PageHeader'
import { EditStandingModal } from './EditStandingModal'
import { PlayoffBracket } from './PlayoffBracket'
import { StandingsTable } from './StandingsTable'

export function StandingsPageClient() {
  const { isAdmin } = useAdmin()
  const [standings, setStandings] = useState<Standing[]>([])
  const [phase, setPhase] = useState<LeaguePhase>('season')
  const [eyebrow, setEyebrow] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [editing, setEditing] = useState<Standing | null>(null)

  useEffect(() => {
    const load = async () => {
      const config = await getLeagueConfig()
      const currentPhase = config?.phase ?? 'season'
      setPhase(currentPhase)

      // Before this season has games, show last season's final table instead
      // of an empty live one.
      if (currentPhase === 'signups' || currentPhase === 'draft') {
        const archive = await getLatestArchiveSeason()
        if (archive) {
          setEyebrow(`Last season · ${archive.label}`)
          setStandings(await getArchiveStandings(archive.id))
        } else {
          setEyebrow(null)
          setStandings([])
        }
      } else {
        setEyebrow(config?.season ?? null)
        setStandings(await getStandings())
      }

      setIsLoading(false)
    }

    load()
    window.addEventListener('dataUpdated', load)
    return () => window.removeEventListener('dataUpdated', load)
  }, [])

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-[15px] text-ink-tertiary">Loading…</p>
      </div>
    )
  }

  const isArchiveView = phase === 'signups' || phase === 'draft'

  // The play-in format below is specific to an 8-team field (top 4 bye,
  // bottom 4 play in). Shown only once there actually are 8 teams, so it
  // doesn't say something untrue about a smaller field.
  const eightTeamPlayoffs = standings.length === 8

  return (
    <>
      <PageHeader
        eyebrow={eyebrow ?? undefined}
        title="Standings"
        description={
          isArchiveView
            ? "Last season's final table, shown until this season's games begin."
            : undefined
        }
      />

      {phase === 'playoffs' && <PlayoffBracket />}

      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <StandingsTable
          standings={standings}
          onEdit={!isArchiveView && isAdmin ? setEditing : undefined}
          showPlayoffFormat={!isArchiveView && eightTeamPlayoffs}
          emptyTitle={isArchiveView ? 'Nothing archived yet' : undefined}
          emptyMessage={
            isArchiveView
              ? 'Past seasons show up here once one has been archived from the admin bar.'
              : undefined
          }
        />
      </div>

      {!isArchiveView && (
        <EditStandingModal
          standing={editing}
          isOpen={editing !== null}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}
