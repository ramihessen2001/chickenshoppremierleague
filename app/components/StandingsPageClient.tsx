/**
 * League standings.
 *
 * The table is computed from completed games (see lib/standings.ts), never
 * hand-entered, so it can't drift out of sync with the scores a game's box
 * score was actually saved with.
 *
 * Always this season's table. Before any game is played that is every current
 * team on nil, which is the point: from registration onwards the teams are
 * already the ones being drafted to, so the table names them. It used to fall
 * back to last season's archived table during signups and draft, which now
 * would show a different set of clubs than the rest of the site.
 *
 * Playoffs additionally shows the bracket generator, then the bracket, above
 * the table -- the same order as the homepage's playoffs section.
 */

'use client'

import { useEffect, useState } from 'react'
import { getStandings, getLeagueConfig } from '@/lib/supabaseData'
import { Standing } from '@/types/standing'
import { LeaguePhase } from '@/lib/supabase'
import { PageHeader } from './PageHeader'
import { PlayoffBracket } from './PlayoffBracket'
import { PlayoffBracketGenerator } from './PlayoffBracketGenerator'
import { StandingsTable } from './StandingsTable'

export function StandingsPageClient() {
  const [standings, setStandings] = useState<Standing[]>([])
  const [phase, setPhase] = useState<LeaguePhase>('season')
  const [eyebrow, setEyebrow] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const config = await getLeagueConfig()
      const currentPhase = config?.phase ?? 'season'
      setPhase(currentPhase)

      setEyebrow(config?.season ?? null)
      setStandings(await getStandings())

      setIsLoading(false)
    }

    load()
    window.addEventListener('dataUpdated', load)
    return () => window.removeEventListener('dataUpdated', load)
  }, [])

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="loading">Loading</p>
      </div>
    )
  }

  // Nil across the board until the season starts. Saying so beats leaving a
  // table of zeroes to look like something failed to load.
  const beforeKickoff = phase === 'signups' || phase === 'draft'

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
          beforeKickoff
            ? 'This season\'s teams. The table fills in as results come in.'
            : undefined
        }
      />

      {phase === 'playoffs' && (
        <>
          <PlayoffBracketGenerator />
          <PlayoffBracket />
        </>
      )}

      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <StandingsTable standings={standings} showPlayoffFormat={eightTeamPlayoffs} />
      </div>
    </>
  )
}
