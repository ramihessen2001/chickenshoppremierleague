/**
 * Last season, read-only.
 *
 * Pulls from the archive_* tables written by "archive & reset season" (see
 * ArchiveSeasonControl.tsx) -- entirely separate from the live standings,
 * schedule and stats, so nothing here ever changes once it's written.
 */

'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import {
  getLatestArchiveSeason,
  getArchiveStandings,
  getArchiveGames,
  getArchiveStatLeaders,
} from '@/lib/supabaseData'
import { fallbackTeamLogo } from '@/config/league'
import { ArchiveSeason, ArchiveStanding, ArchiveGame } from '@/types/archive'
import { LeaderboardEntry } from '@/types/statistic'
import { PageHeader } from './PageHeader'
import { StatLeaders } from './StatLeaders'
import { formatDate, formatTime } from '@/lib/dateUtils'

export function ArchivePageClient() {
  const [season, setSeason] = useState<ArchiveSeason | null>(null)
  const [standings, setStandings] = useState<ArchiveStanding[]>([])
  const [games, setGames] = useState<ArchiveGame[]>([])
  const [goals, setGoals] = useState<LeaderboardEntry[]>([])
  const [assists, setAssists] = useState<LeaderboardEntry[]>([])
  const [saves, setSaves] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    getLatestArchiveSeason().then(async (latest) => {
      if (cancelled) return
      setSeason(latest)
      if (!latest) {
        setIsLoading(false)
        return
      }

      const [standingsRows, gameRows, goalLeaders, assistLeaders, saveLeaders] =
        await Promise.all([
          getArchiveStandings(latest.id),
          getArchiveGames(latest.id),
          getArchiveStatLeaders(latest.id, 'goal'),
          getArchiveStatLeaders(latest.id, 'assist'),
          getArchiveStatLeaders(latest.id, 'save'),
        ])

      if (cancelled) return
      setStandings(standingsRows)
      setGames(gameRows)
      setGoals(goalLeaders)
      setAssists(assistLeaders)
      setSaves(saveLeaders)
      setIsLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [])

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-[15px] text-ink-tertiary">Loading…</p>
      </div>
    )
  }

  if (!season) {
    return (
      <>
        <PageHeader title="Archive" />
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <div className="rounded-lg border border-dashed border-hairline-strong px-6 py-20 text-center">
            <p className="text-[17px] font-medium text-ink">Nothing archived yet</p>
            <p className="mx-auto mt-2 max-w-sm text-[15px] text-ink-secondary">
              Past seasons show up here once one has been archived from the admin bar.
            </p>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <PageHeader
        eyebrow={season.label}
        title="Archive"
        description="Final standings, results and stat leaders -- unchanged from when the season ended."
      />

      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        {/* Standings ------------------------------------------------------ */}
        <section aria-labelledby="archive-standings-heading">
          <h2
            id="archive-standings-heading"
            className="text-[17px] font-semibold text-ink"
          >
            Final standings
          </h2>

          {standings.length === 0 ? (
            <p className="mt-4 text-[14px] text-ink-tertiary">No standings were recorded.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[34rem] border-collapse">
                <thead>
                  <tr className="border-b border-hairline-strong">
                    <th className="py-2.5 pr-3 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-tertiary">
                      #
                    </th>
                    <th className="py-2.5 pr-4 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-tertiary">
                      Team
                    </th>
                    {['GP', 'W', 'D', 'L', 'GD', 'Pts'].map((label) => (
                      <th
                        key={label}
                        className="py-2.5 px-2 text-right text-[11px] font-semibold uppercase tracking-wider text-ink-tertiary"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row, index) => (
                    <tr key={row.teamId} className="border-b border-hairline">
                      <td className="tabular py-2.5 pr-3 text-[13px] text-ink-tertiary">
                        {index + 1}
                      </td>
                      <td className="py-2.5 pr-4">
                        <div className="flex min-w-0 items-center gap-2">
                          <Image
                            src={row.logoUrl || fallbackTeamLogo(row.teamSlug)}
                            alt=""
                            width={20}
                            height={20}
                            className="h-5 w-5 shrink-0 object-contain"
                          />
                          <span className="truncate text-[13px] font-medium text-ink">
                            {row.teamName}
                          </span>
                        </div>
                      </td>
                      <td className="tabular py-2.5 px-2 text-right text-[13px] text-ink">
                        {row.gamesPlayed}
                      </td>
                      <td className="tabular py-2.5 px-2 text-right text-[13px] text-ink">
                        {row.wins}
                      </td>
                      <td className="tabular py-2.5 px-2 text-right text-[13px] text-ink">
                        {row.draws}
                      </td>
                      <td className="tabular py-2.5 px-2 text-right text-[13px] text-ink">
                        {row.losses}
                      </td>
                      <td className="tabular py-2.5 px-2 text-right text-[13px] text-ink">
                        {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                      </td>
                      <td className="tabular py-2.5 px-2 text-right text-[13px] font-semibold text-ink">
                        {row.points}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Results --------------------------------------------------------- */}
        <section className="mt-14" aria-labelledby="archive-results-heading">
          <h2 id="archive-results-heading" className="text-[17px] font-semibold text-ink">
            Results
          </h2>

          {games.length === 0 ? (
            <p className="mt-4 text-[14px] text-ink-tertiary">No games were recorded.</p>
          ) : (
            <ol className="mt-4 space-y-2">
              {games.map((game) => (
                <li
                  key={game.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg border border-hairline bg-surface px-4 py-2.5"
                >
                  <span className="tabular w-24 shrink-0 text-[12px] text-ink-tertiary">
                    {formatDate(game.date)}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[14px] text-ink">
                    {game.homeTeamName}
                    {game.homeScore !== null && game.awayScore !== null && (
                      <span className="tabular font-semibold"> {game.homeScore}</span>
                    )}
                    <span className="text-ink-tertiary"> v </span>
                    {game.awayTeamName}
                    {game.homeScore !== null && game.awayScore !== null && (
                      <span className="tabular font-semibold"> {game.awayScore}</span>
                    )}
                  </span>
                  {game.isPlayoff && game.playoffRound && (
                    <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wider text-ink-tertiary">
                      {game.playoffRound}
                    </span>
                  )}
                  <span className="tabular shrink-0 text-[12px] text-ink-tertiary">
                    {formatTime(game.time)}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <StatLeaders goals={goals} assists={assists} saves={saves} allPlayersHref={null} />
    </>
  )
}
