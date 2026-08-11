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
      <div className="rounded-lg border border-dashed border-hairline-strong px-6 py-14 text-center">
        <p className="text-[15px] text-ink-secondary">No fixtures scheduled yet.</p>
      </div>
    )
  }

  const Row = ({ game }: { game: Game }) => {
    const { isHome, opponent, own, against } = perspective(game)
    const result = resultOf(game)
    const opponentName = teamName(opponent)

    const badge =
      result === 'W'
        ? 'bg-positive-wash text-positive'
        : result === 'L'
          ? 'bg-negative-wash text-negative'
          : 'bg-surface-sunken text-ink-secondary'

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
            <div className="h-[22px] w-[22px] shrink-0 rounded-full bg-surface-sunken" />
          )}
          <span className="min-w-0 truncate text-[14px] text-ink">
            <span className="text-ink-tertiary">{isHome ? 'vs' : 'at'} </span>
            {opponentName}
          </span>
        </div>

        {result ? (
          <div className="flex shrink-0 items-center gap-2.5">
            <span className="tabular text-[14px] text-ink-secondary">
              {own}–{against}
            </span>
            <span
              className={`flex h-5 w-5 items-center justify-center rounded text-[11px] font-bold ${badge}`}
            >
              {result}
            </span>
          </div>
        ) : (
          <span className="tabular shrink-0 text-[12px] text-ink-tertiary">
            {formatTime(game.time)}
          </span>
        )}
      </>
    )

    return (
      <div className="border-b border-hairline last:border-0">
        <p className="tabular pt-3 text-[12px] text-ink-tertiary">
          {formatDate(game.date)}
        </p>
        {result ? (
          <button
            onClick={() => {
              setSelectedGame(game)
              setIsModalOpen(true)
            }}
            className="-mx-2 mb-3 mt-1.5 flex w-[calc(100%+1rem)] items-center justify-between gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-surface-hover"
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
          <h3 className="text-[13px] font-semibold text-ink">Results</h3>
          <div className="mt-2 border-t border-hairline">
            {played.map((game) => (
              <Row key={game.id} game={game} />
            ))}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className={played.length > 0 ? 'mt-8' : ''}>
          <h3 className="text-[13px] font-semibold text-ink">Upcoming</h3>
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
