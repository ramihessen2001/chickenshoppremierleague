/**
 * One team's fixtures: results so far, then what is still to come.
 *
 * Written from that team's point of view -- opponent, home or away, and the
 * result as W/D/L with the team's own score first.
 */

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Game } from '@/types/game'
import { useTeams } from '@/lib/teamsContext'
import { formatDate, formatTime } from '@/lib/dateUtils'
import { BoxScoreModal } from './BoxScoreModal'

interface TeamScheduleProps {
  /** Team slug. */
  teamId: string
  games: Game[]
}

type Result = 'W' | 'D' | 'L'

export function TeamSchedule({ teamId, games }: TeamScheduleProps) {
  const { teamName, teamLogo } = useTeams()
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const teamGames = games
    .filter((g) => g.homeTeamId === teamId || g.awayTeamId === teamId)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time))

  const isPlayed = (game: Game) =>
    game.status === 'completed' && game.homeScore !== null && game.awayScore !== null

  const played = teamGames.filter(isPlayed)
  const upcoming = teamGames.filter((g) => !isPlayed(g) && g.status !== 'cancelled')

  /** Scores from this team's perspective, own score first. */
  const perspective = (game: Game) => {
    const isHome = game.homeTeamId === teamId
    return {
      isHome,
      opponent: isHome ? game.awayTeamId : game.homeTeamId,
      own: isHome ? game.homeScore : game.awayScore,
      against: isHome ? game.awayScore : game.homeScore,
    }
  }

  const resultOf = (game: Game): Result | null => {
    if (!isPlayed(game)) return null
    const { own, against } = perspective(game)
    if (own! > against!) return 'W'
    if (own! < against!) return 'L'
    return 'D'
  }

  if (teamGames.length === 0) {
    return (
      <div className="border border-hairline px-5 py-6 text-left">
        <p className="loading">No fixtures scheduled yet</p>
      </div>
    )
  }

  const Row = ({ game }: { game: Game }) => {
    const { isHome, opponent, own, against } = perspective(game)
    const result = resultOf(game)
    const opponentName = teamName(opponent)

    const badge =
      result === 'W'
        ? 'bg-ink text-ink-inverse'
        : result === 'L'
          ? 'bg-red text-ink-inverse'
          : 'border border-hairline-strong text-ink'

    const content = (
      <>
        <div className="flex min-w-0 items-center gap-2.5">
          {opponent ? (
            <Image
              src={teamLogo(opponent)}
              alt=""
              width={22}
              height={22}
              className="h-[22px] w-[22px] shrink-0 object-contain"
            />
          ) : (
            <div className="h-[22px] w-[22px] shrink-0 border border-hairline" />
          )}
          <span className="min-w-0 truncate font-display text-[14px] font-bold uppercase tracking-[0.01em] text-ink">
            <span className="font-util text-[10.5px] font-normal tracking-[0.1em] text-ink-tertiary">
              {isHome ? 'VS ' : 'AT '}
            </span>
            {opponentName}
          </span>
        </div>

        {result ? (
          <div className="flex shrink-0 items-center gap-2.5">
            <span className="border border-hairline px-2 py-0.5 font-util text-[12px] font-bold text-ink">
              {own}–{against}
            </span>
            <span
              className={`flex h-5 w-5 items-center justify-center font-util text-[11px] font-bold ${badge}`}
            >
              {result}
            </span>
          </div>
        ) : (
          <span className="shrink-0 font-util text-[12px] text-ink-secondary">
            {formatTime(game.time)}
          </span>
        )}
      </>
    )

    return (
      <div className="border-b border-hairline last:border-0">
        <p className="pt-3 font-util text-[10.5px] uppercase tracking-[0.1em] text-ink-tertiary">
          {formatDate(game.date)}
        </p>
        {result ? (
          <button
            onClick={() => {
              setSelectedGame(game)
              setIsModalOpen(true)
            }}
            className="-mx-2 mb-3 mt-1.5 flex w-[calc(100%+1rem)] items-center justify-between gap-3 px-2 py-1.5 transition-colors hover:bg-ink/[0.04]"
            aria-label={`Box score, ${opponentName}`}
          >
            {content}
          </button>
        ) : (
          <div className="mb-3 mt-1.5 flex items-center justify-between gap-3 py-1.5">
            {content}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {played.length > 0 && (
        <section>
          <h3 className="font-util text-[10px] uppercase tracking-[0.1em] text-ink-tertiary">
            Results
          </h3>
          <div className="mt-2 border-t border-hairline">
            {played.map((game) => (
              <Row key={game.id} game={game} />
            ))}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className={played.length > 0 ? 'mt-8' : ''}>
          <h3 className="font-util text-[10px] uppercase tracking-[0.1em] text-ink-tertiary">
            Upcoming
          </h3>
          <div className="mt-2 border-t border-hairline">
            {upcoming.map((game) => (
              <Row key={game.id} game={game} />
            ))}
          </div>
        </section>
      )}

      <BoxScoreModal
        game={selectedGame}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}
