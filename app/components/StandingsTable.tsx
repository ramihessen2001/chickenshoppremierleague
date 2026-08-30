/**
 * League table: rank, team, and the usual GP/W/D/L/GF/GA/GD/Pts columns.
 *
 * Shared between the live standings page and the archive, which show the
 * same shape of data -- `Standing` and `ArchiveStanding` are structurally
 * identical, both computed from games rather than stored.
 */

import Image from 'next/image'
import { fallbackTeamLogo } from '@/config/league'
import { Standing } from '@/types/standing'

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

interface StandingsTableProps {
  standings: Standing[]
  /** True once there are exactly 8 teams -- shows the playoff-line divider and blurb. */
  showPlayoffFormat?: boolean
  emptyTitle?: string
  emptyMessage?: string
}

export function StandingsTable({
  standings,
  showPlayoffFormat = false,
  emptyTitle = 'No standings yet',
  emptyMessage = 'The table will appear here once teams are added.',
}: StandingsTableProps) {
  if (standings.length === 0) {
    return (
      <div className="border border-hairline px-5 py-8 text-left">
        <p className="text-[17px] font-medium text-ink">{emptyTitle}</p>
        <p className="mx-auto mt-2 max-w-sm text-[15px] text-ink-secondary">{emptyMessage}</p>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto border border-hairline">
        <table className="w-full min-w-[38rem] border-collapse">
          <thead>
            <tr className="border-b-[2.5px] border-hairline-strong">
              <th
                scope="col"
                className="py-2 pl-3 pr-2 text-left font-util text-[9.5px] font-normal uppercase tracking-[0.1em] text-ink-secondary"
              >
                #
              </th>
              <th
                scope="col"
                className="py-2 pr-4 text-left font-util text-[9.5px] font-normal uppercase tracking-[0.1em] text-ink-secondary"
              >
                Team
              </th>
              {KEY.map(([abbr]) => (
                <th
                  key={abbr}
                  scope="col"
                  className="py-2 px-[7px] text-right font-util text-[9.5px] font-normal uppercase tracking-[0.1em] text-ink-secondary"
                >
                  {abbr}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {standings.map((row, index) => (
              <tr
                key={row.teamId}
                className={`transition-colors hover:bg-ink/[0.04] ${
                  showPlayoffFormat && index === 3
                    ? 'border-b-[2.5px] border-hairline-strong'
                    : 'border-b border-hairline last:border-b-0'
                }`}
              >
                <td className="w-[26px] py-2 pl-3 pr-2 text-left font-util text-[12px] text-ink-tertiary">
                  {index + 1}
                </td>
                {/* A club is a thing, not a section, so the name is upright
                    condensed rather than the oblique used for headings. */}
                <td className="py-2 pr-4">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center border border-hairline">
                      <Image
                        src={row.logoUrl || fallbackTeamLogo(row.teamSlug)}
                        alt=""
                        width={22}
                        height={22}
                        className="h-[18px] w-[18px] object-contain"
                      />
                    </span>
                    <span
                      className="truncate font-display text-[14px] font-bold uppercase tracking-[0.01em] text-ink"
                      title={row.teamName}
                    >
                      {row.teamShortName}
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
                <td className="py-2 px-[7px] text-right font-util text-[12px] font-bold text-ink">
                  {row.points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Key ---------------------------------------------------------- */}
      <div className="mt-8 border border-hairline px-5 py-4">
        <p className="eyebrow">Key</p>
        <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
          {KEY.map(([abbr, meaning]) => (
            <div key={abbr} className="flex items-baseline gap-1.5">
              <dt className="font-util text-[12px] font-bold text-ink">{abbr}</dt>
              <dd className="text-[13px] text-ink-secondary">{meaning}</dd>
            </div>
          ))}
        </dl>

        {showPlayoffFormat && (
          <p className="mt-4 border-t border-hairline pt-4 text-[13px] leading-relaxed text-ink-secondary">
            <span className="font-display font-bold uppercase tracking-[0.02em] text-ink">Playoffs.</span>{' '}
            The top 4 go straight through. 5th–8th play a knockout round
            first (5th v 8th, 6th v 7th) for the final two spots.
          </p>
        )}
      </div>
    </>
  )
}

/** A zero is greyed so the eye lands on teams that have actually played. */
function Cell({ value, signed }: { value: number; signed?: boolean }) {
  const display = signed && value > 0 ? `+${value}` : String(value)
  return (
    <td className="py-2 px-[7px] text-right">
      <span
        className={`font-util text-[12px] ${value === 0 ? 'text-ink-tertiary' : 'text-ink'}`}
      >
        {display}
      </span>
    </td>
  )
}
