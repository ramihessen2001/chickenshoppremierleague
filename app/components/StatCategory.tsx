/**
 * One statistic category (goals, assists, …) with each team's contributors
 * side by side. Renders nothing when neither team recorded any.
 */

import { GameStatistic } from '@/types/statistic'
import { displayJersey } from '@/types/player'
import { PuroPlayerBadge } from './PuroPlayerBadge'

interface StatCategoryProps {
  title: string
  homeTeamName: string
  awayTeamName: string
  homeStats: GameStatistic[]
  awayStats: GameStatistic[]
  playerOfGameId?: string | null
}

export function StatCategory({
  title,
  homeTeamName,
  awayTeamName,
  homeStats,
  awayStats,
  playerOfGameId,
}: StatCategoryProps) {
  if (homeStats.length === 0 && awayStats.length === 0) return null

  return (
    <section className="border-b border-hairline py-6 last:border-0">
      <h3 className="eyebrow">{title}</h3>

      <div className="mt-4 grid gap-x-10 gap-y-6 sm:grid-cols-2">
        <TeamColumn
          teamName={homeTeamName}
          stats={homeStats}
          playerOfGameId={playerOfGameId}
        />
        <TeamColumn
          teamName={awayTeamName}
          stats={awayStats}
          playerOfGameId={playerOfGameId}
        />
      </div>
    </section>
  )
}

function TeamColumn({
  teamName,
  stats,
  playerOfGameId,
}: {
  teamName: string
  stats: GameStatistic[]
  playerOfGameId?: string | null
}) {
  return (
    <div>
      <p className="text-[13px] font-medium text-ink-secondary">{teamName}</p>

      {stats.length === 0 ? (
        <p className="mt-2 text-[14px] text-ink-tertiary">—</p>
      ) : (
        <ul className="mt-2 space-y-1.5">
          {stats.map((stat) => (
            <li key={stat.id} className="flex items-baseline gap-2 text-[14px]">
              <span className="tabular w-7 shrink-0 text-ink-tertiary">
                {displayJersey(stat.jerseyNumber)}
              </span>
              <span className="min-w-0 flex-1 text-ink">
                <PuroPlayerBadge
                  playerName={stat.playerName ?? 'Unknown player'}
                  jerseyNumber={stat.jerseyNumber ?? null}
                  isPlayerOfGame={
                    playerOfGameId != null && stat.playerId === playerOfGameId
                  }
                />
              </span>
              {(stat.count ?? 1) > 1 && (
                <span className="tabular shrink-0 text-ink-secondary">
                  ×{stat.count}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
