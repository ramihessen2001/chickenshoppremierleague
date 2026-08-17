/**
 * Generates the regular-season schedule: a round robin across the teams
 * currently in the league, spread two games per Monday and Wednesday
 * starting the week of the season's start date. Also turns on the
 * homepage's fixtures and stat leaders, which stay off until there's a
 * real schedule for them to show (see league_config.show_home_fixtures /
 * show_home_stats).
 *
 * Requires exactly 8 teams. Not because the pairing math needs it --
 * roundRobinSchedule works for any even count -- but because the league
 * is between seasons: last year's 6 teams are still sitting in the
 * database until this year's 8 replace them, and generating a "season"
 * against the old roster would just be wrong.
 */

'use client'

import { useState } from 'react'
import { useAdmin } from '@/lib/adminContext'
import { useTeams } from '@/lib/teamsContext'
import {
  createGame,
  getLeagueConfig,
  updateLeagueConfig,
  notifyDataUpdated,
} from '@/lib/supabaseData'
import { roundRobinSchedule, mondayOnOrBefore, addDays, toISODate } from '@/lib/scheduler'

const REQUIRED_TEAMS = 8
const DEFAULT_LOCATION = 'Islamic Center of Northeast Florida (ICNEF)'
const GAME_TIMES = ['6:00 PM', '7:30 PM']

interface SeasonSchedulerProps {
  /** Only offered before any games exist, so it can't create a duplicate schedule. */
  hasGames: boolean
}

export function SeasonScheduler({ hasGames }: SeasonSchedulerProps) {
  const { isAdmin } = useAdmin()
  const { teams } = useTeams()
  const [isWorking, setIsWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isAdmin || hasGames) return null

  const ready = teams.length === REQUIRED_TEAMS
  const roundCount = teams.length - 1

  const handleGenerate = async () => {
    if (
      !confirm(
        `Generate a ${roundCount}-week round-robin schedule for ${teams.length} teams? This creates ${(teams.length / 2) * roundCount} games and turns on the homepage's fixtures and stats.`
      )
    ) {
      return
    }

    setError(null)
    setIsWorking(true)
    try {
      const config = await getLeagueConfig()
      const seasonStart = config?.start_date
        ? mondayOnOrBefore(new Date(`${config.start_date}T00:00:00`))
        : mondayOnOrBefore(new Date())

      const fixtures = roundRobinSchedule(teams.map((t) => t.id))
      const roundIndexes = new Map<number, number>()

      for (const fixture of fixtures) {
        const indexInRound = roundIndexes.get(fixture.round) ?? 0
        roundIndexes.set(fixture.round, indexInRound + 1)

        const weekMonday = addDays(seasonStart, (fixture.round - 1) * 7)
        // Two games each on Monday and Wednesday, staggered kickoff times.
        const gameDate = indexInRound % 2 === 0 ? weekMonday : addDays(weekMonday, 2)
        const time = GAME_TIMES[Math.floor(indexInRound / 2) % GAME_TIMES.length]

        await createGame({
          weekNumber: fixture.round,
          date: toISODate(gameDate),
          time,
          location: DEFAULT_LOCATION,
          homeTeamId: fixture.homeTeamId,
          awayTeamId: fixture.awayTeamId,
          isPlayoff: false,
        })
      }

      await updateLeagueConfig({
        totalWeeks: roundCount,
        showHomeFixtures: true,
        showHomeStats: true,
      })

      notifyDataUpdated()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to generate the schedule')
    } finally {
      setIsWorking(false)
    }
  }

  return (
    <div className="mb-8 rounded-lg border border-hairline-strong bg-surface-sunken px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[13px] font-semibold text-ink">Generate the season schedule</p>
          <p className="mt-1 text-[13px] text-ink-secondary">
            {ready
              ? `A ${roundCount}-week round robin, two games each Monday and Wednesday.`
              : `Needs exactly ${REQUIRED_TEAMS} teams — there ${teams.length === 1 ? 'is' : 'are'} currently ${teams.length}.`}
          </p>
        </div>
        {ready && (
          <button
            onClick={handleGenerate}
            disabled={isWorking}
            className="shrink-0 rounded-pill bg-surface-inverse px-4 py-2 text-[13px] font-medium text-ink-inverse transition-opacity hover:opacity-85 disabled:opacity-50"
          >
            {isWorking ? 'Generating…' : 'Generate schedule'}
          </button>
        )}
      </div>
      {error && <p className="mt-3 text-[13px] text-negative">{error}</p>}
    </div>
  )
}
