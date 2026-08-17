/**
 * League standings.
 *
 * A real table, edited by hand from the admin panel one team at a time --
 * the league runs on reported results rather than every game being logged
 * with a final score, so the numbers here are entered directly instead of
 * being computed from `games`. Goal difference and points are computed at
 * read time (see lib/standings.ts) so they can never drift from the games
 * played/wins/draws/losses/goals a row was built from.
 */

'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Pencil } from 'lucide-react'
import { getStandings, getLeagueConfig } from '@/lib/supabaseData'
import { useAdmin } from '@/lib/adminContext'
import { fallbackTeamLogo } from '@/config/league'
import { Standing } from '@/types/standing'
import { PageHeader } from './PageHeader'
import { EditStandingModal } from './EditStandingModal'

/** Column abbreviation -> what it means, for the key under the table. */
const KEY: [string, string][] = [
  ['GP', 'Games played'],
  ['W', 'Wins'],
  ['D', 'Draws'],
  ['L', 'Losses'],
  ['GF', 'Goals for'],
  ['GA', 'Goals against'],
  ['GD', 'Goal difference'],
  ['Pts', 'Points (3 for a win, 1 for a draw)'],
]

export function StandingsPageClient() {
  const { isAdmin } = useAdmin()
  const [standings, setStandings] = useState<Standing[]>([])
  const [season, setSeason] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [editing, setEditing] = useState<Standing | null>(null)

  useEffect(() => {
    const load = () => {
      Promise.all([getStandings(), getLeagueConfig()])
        .then(([rows, config]) => {
          setStandings(rows)
          setSeason(config?.season ?? null)
        })
        .finally(() => setIsLoading(false))
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

  // The play-in format below is specific to an 8-team field (top 4 bye,
  // bottom 4 play in). Shown only once there actually are 8 teams, so it
  // doesn't say something untrue about this season's current 6.
  const eightTeamPlayoffs = standings.length === 8

  return (
    <>
      <PageHeader eyebrow={season ?? undefined} title="Standings" />

      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        {standings.length === 0 ? (
          <div className="rounded-lg border border-dashed border-hairline-strong px-6 py-20 text-center">
            <p className="text-[17px] font-medium text-ink">No teams yet</p>
            <p className="mx-auto mt-2 max-w-sm text-[15px] text-ink-secondary">
              The table will appear here once teams are added.
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[38rem] border-collapse">
                <thead>
                  <tr className="border-b border-hairline-strong">
                    <th
                      scope="col"
                      className="py-3 pr-3 text-left text-[12px] font-semibold uppercase tracking-wider text-ink-tertiary"
                    >
                      #
                    </th>
                    <th
                      scope="col"
                      className="py-3 pr-4 text-left text-[12px] font-semibold uppercase tracking-wider text-ink-tertiary"
                    >
                      Team
                    </th>
                    {KEY.map(([abbr]) => (
                      <th
                        key={abbr}
                        scope="col"
                        className="py-3 px-2 text-right text-[12px] font-semibold uppercase tracking-wider text-ink-tertiary"
                      >
                        {abbr}
                      </th>
                    ))}
                    {isAdmin && (
                      <th scope="col" className="py-3 pl-2">
                        <span className="sr-only">Edit</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row, index) => (
                    <tr
                      key={row.teamId}
                      className={`transition-colors hover:bg-surface-hover ${
                        eightTeamPlayoffs && index === 3
                          ? 'border-b-2 border-ink-tertiary'
                          : 'border-b border-hairline'
                      }`}
                    >
                      <td className="tabular py-3 pr-3 text-[14px] text-ink-tertiary">
                        {index + 1}
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <Image
                            src={row.logoUrl || fallbackTeamLogo(row.teamSlug)}
                            alt=""
                            width={22}
                            height={22}
                            className="h-[22px] w-[22px] shrink-0 object-contain"
                          />
                          <span className="truncate text-[14px] font-medium text-ink">
                            {row.teamName}
                          </span>
                        </div>
                      </td>
                      <Cell value={row.gamesPlayed} />
                      <Cell value={row.wins} />
                      <Cell value={row.draws} />
                      <Cell value={row.losses} />
                      <Cell value={row.goalsFor} />
                      <Cell value={row.goalsAgainst} />
                      <Cell value={row.goalDifference} signed />
                      <td className="tabular py-3 px-2 text-right text-[14px] font-semibold text-ink">
                        {row.points}
                      </td>
                      {isAdmin && (
                        <td className="py-3 pl-2 text-right">
                          <button
                            onClick={() => setEditing(row)}
                            className="rounded-md p-1.5 text-ink-tertiary transition-colors hover:bg-surface-sunken hover:text-ink"
                            aria-label={`Edit ${row.teamName}`}
                          >
                            <Pencil size={14} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Key ---------------------------------------------------------- */}
            <div className="mt-8 rounded-lg border border-hairline bg-surface-sunken px-5 py-4">
              <p className="eyebrow">Key</p>
              <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
                {KEY.map(([abbr, meaning]) => (
                  <div key={abbr} className="flex items-baseline gap-1.5">
                    <dt className="text-[13px] font-semibold text-ink">{abbr}</dt>
                    <dd className="text-[13px] text-ink-tertiary">{meaning}</dd>
                  </div>
                ))}
              </dl>

              {eightTeamPlayoffs && (
                <p className="mt-4 border-t border-hairline pt-4 text-[13px] leading-relaxed text-ink-secondary">
                  <span className="font-semibold text-ink">Playoffs.</span>{' '}
                  The top 4 go straight through. 5th–8th play a knockout
                  round first (5th v 8th, 6th v 7th) for the final two spots.
                </p>
              )}
            </div>
          </>
        )}
      </div>

      <EditStandingModal
        standing={editing}
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
      />
    </>
  )
}

/** A zero is greyed so the eye lands on teams that have actually played. */
function Cell({ value, signed }: { value: number; signed?: boolean }) {
  const display = signed && value > 0 ? `+${value}` : String(value)
  return (
    <td className="py-3 px-2 text-right">
      <span
        className={`tabular text-[14px] ${value === 0 ? 'text-ink-tertiary' : 'text-ink'}`}
      >
        {display}
      </span>
    </td>
  )
}
