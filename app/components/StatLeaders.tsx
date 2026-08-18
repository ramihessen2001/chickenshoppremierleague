/**
 * Leaderboards for goals, assists and saves.
 *
 * Three columns, each a plain ranked list. Ties share a rank and are listed
 * together. Counts are right-aligned with tabular figures so the column scans
 * vertically.
 */

import Link from 'next/link'
import { LeaderboardEntry } from '@/types/statistic'

interface StatLeadersProps {
  goals: LeaderboardEntry[]
  assists: LeaderboardEntry[]
  saves: LeaderboardEntry[]
  /** Where "All players" points. Pass null to hide it, e.g. on the archive
   *  page, where there is no full player-stats page to send someone to. */
  allPlayersHref?: string | null
  /** Small label above "Leaders", e.g. "Last season" while showing archived
   *  numbers during the draft, so they never read as this season's live ones. */
  eyebrow?: string
}

export function StatLeaders({
  goals,
  assists,
  saves,
  allPlayersHref = '/stats',
  eyebrow,
}: StatLeadersProps) {
  const hasAny = goals.length > 0 || assists.length > 0 || saves.length > 0

  return (
    <section
      className="border-t border-hairline bg-surface-sunken"
      aria-labelledby="leaders-heading"
    >
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
        <div className="flex items-baseline justify-between gap-4">
          <div>
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <h2
              id="leaders-heading"
              className="text-[28px] font-semibold text-ink sm:text-[32px]"
            >
              Leaders
            </h2>
          </div>
          {allPlayersHref && (
            <Link
              href={allPlayersHref}
              className="shrink-0 text-[14px] font-medium text-accent-ink transition-opacity hover:opacity-70"
            >
              All players →
            </Link>
          )}
        </div>

        {!hasAny ? (
          <p className="mt-10 text-[15px] text-ink-tertiary">
            Leaders appear once results have been recorded.
          </p>
        ) : (
          <div className="mt-10 grid gap-10 sm:grid-cols-3 sm:gap-8">
            <LeaderColumn title="Goals" leaders={goals} />
            <LeaderColumn title="Assists" leaders={assists} />
            <LeaderColumn title="Saves" leaders={saves} />
          </div>
        )}
      </div>
    </section>
  )
}

function LeaderColumn({
  title,
  leaders,
}: {
  title: string
  leaders: LeaderboardEntry[]
}) {
  // Players on the same count share a rank, and the next rank skips past them.
  const byCount = new Map<number, LeaderboardEntry['player'][]>()
  for (const entry of leaders) {
    if (!byCount.has(entry.count)) byCount.set(entry.count, [])
    byCount.get(entry.count)!.push(entry.player)
  }

  const counts = [...byCount.keys()].sort((a, b) => b - a).slice(0, 5)

  const rows: { count: number; players: LeaderboardEntry['player'][]; rank: number }[] =
    []
  let nextRank = 1
  for (const count of counts) {
    const players = byCount.get(count)!
    rows.push({ count, players, rank: nextRank })
    nextRank += players.length // a tie pushes the next rank past the whole group
  }

  return (
    <div>
      <h3 className="eyebrow">{title}</h3>

      {rows.length === 0 ? (
        <p className="mt-4 text-[14px] text-ink-tertiary">No data yet</p>
      ) : (
        <ol className="mt-4">
          {rows.map(({ count, players, rank }) => (
            <li
              key={count}
              className="flex items-baseline gap-3 border-b border-hairline py-3 last:border-0"
            >
              <span className="tabular w-5 shrink-0 text-[13px] text-ink-tertiary">
                {rank}
              </span>
              <span className="flex-1 text-[15px] text-ink">
                {players.map((p) => p.name).join(', ')}
              </span>
              <span className="tabular text-[15px] font-semibold text-ink">
                {count}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
