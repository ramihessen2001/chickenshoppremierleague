/**
 * The contents of a box score: score line, man of the match, then each
 * statistic category split by team.
 */

'use client'

import Image from 'next/image'
import { Game } from '@/types/game'
import { GameStatistic } from '@/types/statistic'
import { displayJersey } from '@/types/player'
import { useTeams } from '@/lib/teamsContext'
import { StatCategory } from './StatCategory'
import { formatDate, formatTime } from '@/lib/dateUtils'
import { LEAGUE } from '@/config/league'

interface GameStatisticsProps {
  game: Game
}

/** Order matters: goals first, cards last. */
const CATEGORIES = [
  { type: 'goal', title: 'Goals' },
  { type: 'assist', title: 'Assists' },
  { type: 'save', title: 'Saves' },
  { type: 'yellow_card', title: 'Yellow cards' },
  { type: 'red_card', title: 'Red cards' },
  { type: 'blue_card', title: 'Blue cards' },
]

export function GameStatistics({ game }: GameStatisticsProps) {
  const { teamName, teamLogo } = useTeams()
  const homeName = teamName(game.homeTeamId)
  const awayName = teamName(game.awayTeamId)

  const homeStats = groupByType(
    game.statistics.filter((s) => s.teamId === game.homeTeamId)
  )
  const awayStats = groupByType(
    game.statistics.filter((s) => s.teamId === game.awayTeamId)
  )

  const homeWon = game.homeScore! > game.awayScore!
  const awayWon = game.awayScore! > game.homeScore!

  return (
    <div>
      <div className="flex items-start justify-center gap-6 sm:gap-12">
        <ScoreSide
          logoUrl={game.homeTeamId ? teamLogo(game.homeTeamId) : null}
          name={homeName}
          score={game.homeScore}
          won={homeWon}
        />
        <div className="pt-[6.5rem] text-[15px] text-ink-tertiary">–</div>
        <ScoreSide
          logoUrl={game.awayTeamId ? teamLogo(game.awayTeamId) : null}
          name={awayName}
          score={game.awayScore}
          won={awayWon}
        />
      </div>

      <p className="tabular mt-6 text-center text-[13px] text-ink-tertiary">
        {formatDate(game.date)} · {formatTime(game.time)}
        {game.location ? ` · ${game.location}` : ''}
      </p>

      {game.playerOfGame && (
        <div className="mt-8 flex items-center gap-3 rounded-lg border border-hairline bg-surface-sunken px-5 py-4">
          <Image
            src={LEAGUE.manOfTheMatch.badgeImageUrl}
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 rounded-full object-contain"
          />
          <div className="min-w-0">
            <p className="eyebrow">{LEAGUE.manOfTheMatch.label}</p>
            <p className="mt-1 truncate text-[15px] font-medium text-ink">
              {game.playerOfGame.name}
              <span className="tabular font-normal text-ink-tertiary">
                {' '}
                #{displayJersey(game.playerOfGame.jerseyNumber)}
              </span>
            </p>
          </div>
        </div>
      )}

      {game.statistics.length === 0 ? (
        <p className="mt-10 border-t border-hairline pt-10 text-center text-[14px] text-ink-tertiary">
          No individual statistics were recorded for this game.
        </p>
      ) : (
        <div className="mt-10 border-t border-hairline">
          {CATEGORIES.map(({ type, title }) => (
            <StatCategory
              key={type}
              title={title}
              homeTeamName={homeName}
              awayTeamName={awayName}
              homeStats={homeStats[type] ?? []}
              awayStats={awayStats[type] ?? []}
              playerOfGameId={game.playerOfGameId}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function groupByType(stats: GameStatistic[]): Record<string, GameStatistic[]> {
  return stats.reduce(
    (acc, stat) => {
      ;(acc[stat.type] ??= []).push(stat)
      return acc
    },
    {} as Record<string, GameStatistic[]>
  )
}

/** One team's crest, name and score in the header of a box score. */
function ScoreSide({
  logoUrl,
  name,
  score,
  won,
}: {
  logoUrl: string | null
  name: string
  score: number | null
  won: boolean
}) {
  return (
    <div className="flex flex-1 flex-col items-center gap-3 text-center">
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt=""
          width={48}
          height={48}
          className="h-12 w-12 object-contain"
        />
      ) : (
        <div className="h-12 w-12 rounded-full bg-surface-sunken" />
      )}
      <p className={`text-[14px] ${won ? 'font-semibold text-ink' : 'text-ink-secondary'}`}>
        {name}
      </p>
      <p
        className={`tabular text-[40px] leading-none ${
          won ? 'font-semibold text-ink' : 'font-normal text-ink-secondary'
        }`}
      >
        {score}
      </p>
    </div>
  )
}
