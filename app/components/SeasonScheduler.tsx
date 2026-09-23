/**
 * Generates the regular-season schedule: a round robin across the teams
 * currently in the league, spread across two slots each on Friday and
 * Saturday, starting the week of the season's start date. Also turns on
 * the homepage's fixtures and stat leaders, which stay off until there's
 * a real schedule for them to show (see league_config.show_home_fixtures /
 * show_home_stats).
 *
 * Requires exactly 8 teams. Not because the pairing math needs it --
 * roundRobinSchedule works for any even count -- but because the league
 * is between seasons: last year's 6 teams are still sitting in the
 * database until this year's 8 replace them, and generating a "season"
 * against the old roster would just be wrong. Exactly 8 teams also means
 * exactly 4 games per round, matching the 4 slots below one-for-one.
 *
 * Two placement rules apply on top of the round robin, both by team slug:
 * S.C Cairo plays only in an Isha'a slot, and S.C Mansoura plays only on
 * Friday. See `assignSlots` below for how a round with both constraints
 * active at once (Cairo vs. Mansoura) is resolved.
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
import {
  roundRobinSchedule,
  mondayOnOrBefore,
  addDays,
  toISODate,
  RoundRobinGame,
} from '@/lib/scheduler'

const REQUIRED_TEAMS = 8
const DEFAULT_LOCATION = 'Islamic Center of Northeast Florida (ICNEF)'
const CAIRO_SLUG = 'sccairo'
const MANSOURA_SLUG = 'scmansoura'

/** Friday/Saturday day offsets from the week's Monday, paired with the slot label. */
const SLOTS = [
  { dayOffset: 4, time: 'Maghrib' }, // Friday
  { dayOffset: 4, time: "Isha'a" }, // Friday
  { dayOffset: 5, time: 'Assr' }, // Saturday
  { dayOffset: 5, time: "Isha'a" }, // Saturday
] as const
const FRIDAY_ISHAA = 1
const FRIDAY_MAGHRIB = 0
const SATURDAY_ISHAA = 3

/**
 * Maps one round's games onto the 4 weekly slots, honoring the Cairo
 * (Isha'a only) and Mansoura (Friday only) placement rules. When the two
 * teams play each other that round, the single Friday-Isha'a slot
 * satisfies both at once; otherwise Mansoura takes Friday Maghrib and
 * Cairo takes Saturday Isha'a, leaving the remaining two games to fill
 * whatever slots are left over. Returns a slot index per game, aligned by
 * position with `games`.
 */
function assignSlots(games: RoundRobinGame[], cairoId: string, mansouraId: string): number[] {
  const involves = (game: RoundRobinGame, teamId: string) =>
    game.homeTeamId === teamId || game.awayTeamId === teamId

  const cairoIdx = games.findIndex((g) => involves(g, cairoId))
  const mansouraIdx = games.findIndex((g) => involves(g, mansouraId))

  const slotForGame: (number | null)[] = games.map(() => null)
  const usedSlots = new Set<number>()
  const place = (gameIdx: number, slotIdx: number) => {
    slotForGame[gameIdx] = slotIdx
    usedSlots.add(slotIdx)
  }

  if (cairoIdx !== -1 && cairoIdx === mansouraIdx) {
    place(cairoIdx, FRIDAY_ISHAA)
  } else {
    if (mansouraIdx !== -1) place(mansouraIdx, FRIDAY_MAGHRIB)
    if (cairoIdx !== -1) place(cairoIdx, SATURDAY_ISHAA)
  }

  let nextSlot = 0
  for (let i = 0; i < games.length; i++) {
    if (slotForGame[i] !== null) continue
    while (usedSlots.has(nextSlot)) nextSlot++
    place(i, nextSlot)
  }

  return slotForGame as number[]
}

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

      const cairoId = teams.find((t) => t.slug === CAIRO_SLUG)?.id ?? ''
      const mansouraId = teams.find((t) => t.slug === MANSOURA_SLUG)?.id ?? ''

      const fixtures = roundRobinSchedule(teams.map((t) => t.id))
      const gamesByRound = new Map<number, RoundRobinGame[]>()
      for (const fixture of fixtures) {
        const list = gamesByRound.get(fixture.round) ?? []
        list.push(fixture)
        gamesByRound.set(fixture.round, list)
      }

      for (const [round, roundGames] of gamesByRound) {
        const weekMonday = addDays(seasonStart, (round - 1) * 7)
        const slotIndexes = assignSlots(roundGames, cairoId, mansouraId)

        for (let i = 0; i < roundGames.length; i++) {
          const fixture = roundGames[i]
          const slot = SLOTS[slotIndexes[i]]

          await createGame({
            weekNumber: round,
            date: toISODate(addDays(weekMonday, slot.dayOffset)),
            time: slot.time,
            location: DEFAULT_LOCATION,
            homeTeamId: fixture.homeTeamId,
            awayTeamId: fixture.awayTeamId,
            isPlayoff: false,
          })
        }
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
              ? `A ${roundCount}-week round robin — Friday (Maghrib, Isha'a) and Saturday (Assr, Isha'a).`
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
