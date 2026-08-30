/**
 * One week of the schedule: a sticky-ish week label, then its fixtures as rows.
 *
 * Rows rather than cards here -- the schedule is a long scannable list, so a
 * consistent left-aligned grid beats a grid of boxes.
 */

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Pencil, SlidersHorizontal, Plus, Trash2 } from 'lucide-react'
import { Game } from '@/types/game'
import { displayJersey } from '@/types/player'
import { useTeams } from '@/lib/teamsContext'
import { LEAGUE } from '@/config/league'
import { formatDate, formatTime } from '@/lib/dateUtils'
import { deleteGame, notifyDataUpdated } from '@/lib/supabaseData'

interface WeekSectionProps {
  weekNumber: number
  games: Game[]
  isCurrentWeek: boolean
  onGameClick: (game: Game) => void
  onEditBoxScore?: (game: Game) => void
  onEditGame?: (game: Game) => void
  onAddGame?: () => void
}

export function WeekSection({
  weekNumber,
  games,
  isCurrentWeek,
  onGameClick,
  onEditBoxScore,
  onEditGame,
  onAddGame,
}: WeekSectionProps) {
  const label = weekNumber === 0 ? 'Playoffs' : `Week ${weekNumber}`

  return (
    <section className="border-b border-hairline py-8 last:border-0">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-[17px] font-bold uppercase not-italic tracking-[0.01em] text-ink">
            {label}
          </h2>
          {isCurrentWeek && (
            <span className="bg-ink px-2 py-0.5 font-util text-[10.5px] uppercase tracking-[0.1em] text-ink-inverse">
              Current
            </span>
          )}
        </div>

        {onAddGame && (
          <button
            onClick={onAddGame}
            className="inline-flex items-center gap-1 px-2 py-1 font-util text-[12px] text-ink-secondary transition-colors hover:bg-ink/[0.06] hover:text-ink"
          >
            <Plus size={14} />
            Add
          </button>
        )}
      </div>

      {games.length === 0 ? (
        <p className="loading mt-4">No fixtures scheduled</p>
      ) : (
        <ul className="mt-4">
          {games.map((game) => (
            <li key={game.id}>
              <ScheduleRow
                game={game}
                onClick={() => onGameClick(game)}
                onEditBoxScore={onEditBoxScore ? () => onEditBoxScore(game) : undefined}
                onEditGame={onEditGame ? () => onEditGame(game) : undefined}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

interface ScheduleRowProps {
  game: Game
  onClick: () => void
  onEditBoxScore?: () => void
  onEditGame?: () => void
}

function ScheduleRow({ game, onClick, onEditBoxScore, onEditGame }: ScheduleRowProps) {
  const { teamName, teamLogo } = useTeams()
  const [isDeleting, setIsDeleting] = useState(false)

  const homeName = teamName(game.homeTeamId)
  const awayName = teamName(game.awayTeamId)
  const played =
    game.status === 'completed' && game.homeScore !== null && game.awayScore !== null

  const handleDelete = async () => {
    if (!confirm(`Delete ${homeName} vs ${awayName}?`)) return
    setIsDeleting(true)
    try {
      await deleteGame(game.id)
      notifyDataUpdated()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete game')
    } finally {
      setIsDeleting(false)
    }
  }

  const Side = ({ slug, name, score }: { slug: string; name: string; score: number | null }) => {
    const won =
      played &&
      score !== null &&
      score === Math.max(game.homeScore!, game.awayScore!) &&
      game.homeScore !== game.awayScore

    return (
      <div className="flex items-center gap-2.5">
        {slug ? (
          <Image
            src={teamLogo(slug)}
            alt=""
            width={22}
            height={22}
            className="h-[22px] w-[22px] shrink-0 object-contain"
          />
        ) : (
          <div className="h-[22px] w-[22px] shrink-0 border border-hairline" />
        )}
        <span
          className={`truncate font-display text-[14px] font-bold uppercase tracking-[0.01em] ${
            played && !won ? 'text-ink-secondary' : 'text-ink'
          }`}
        >
          {name}
        </span>
        {played && (
          <span
            className={`ml-auto border px-2 py-0.5 font-util text-[12px] ${
              won
                ? 'border-hairline-strong font-bold text-ink'
                : 'border-hairline text-ink-secondary'
            }`}
          >
            {score}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className="group relative -mx-3">
      <button
        onClick={onClick}
        className="w-full px-3 py-3.5 text-left transition-colors hover:bg-ink/[0.04]"
        aria-label={`${homeName} versus ${awayName}`}
      >
        <div className="grid items-center gap-x-6 gap-y-2 sm:grid-cols-[9.5rem_1fr_auto]">
          <div className="font-util text-[12px] text-ink-secondary">
            {formatDate(game.date)}
            <span className="mx-1.5">·</span>
            {formatTime(game.time)}
          </div>

          <div className="grid gap-1.5 sm:max-w-md">
            <Side slug={game.homeTeamId} name={homeName} score={game.homeScore} />
            <Side slug={game.awayTeamId} name={awayName} score={game.awayScore} />
          </div>

          <div className="flex items-center gap-3 font-util text-[11px] text-ink-tertiary">
            {game.location && <span className="truncate">{game.location}</span>}
            {played ? (
              <span className="uppercase tracking-[0.1em]">Final</span>
            ) : (
              game.status !== 'scheduled' && (
                <span className="font-semibold uppercase tracking-wider text-accent-ink">
                  {game.status}
                </span>
              )
            )}
          </div>
        </div>

        {game.playerOfGame && (
          <p className="mt-2.5 flex items-center gap-1.5 font-util text-[11px] text-ink-tertiary sm:pl-[10.25rem]">
            <Image
              src={LEAGUE.manOfTheMatch.badgeImageUrl}
              alt=""
              width={14}
              height={14}
              className="h-3.5 w-3.5 shrink-0 object-contain"
            />
            <span className="truncate">
              {game.playerOfGame.name}
              <span> #{displayJersey(game.playerOfGame.jerseyNumber)}</span>
            </span>
          </p>
        )}
      </button>

      {(onEditBoxScore || onEditGame) && (
        <div className="absolute right-2 top-2.5 flex gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          {onEditBoxScore && (
            <IconButton onClick={onEditBoxScore} label="Edit box score">
              <Pencil size={14} />
            </IconButton>
          )}
          {onEditGame && (
            <>
              <IconButton onClick={onEditGame} label="Edit game details">
                <SlidersHorizontal size={14} />
              </IconButton>
              <IconButton onClick={handleDelete} label="Delete game" disabled={isDeleting} danger>
                <Trash2 size={14} />
              </IconButton>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function IconButton({
  onClick,
  label,
  children,
  disabled,
  danger,
}: {
  onClick: () => void
  label: string
  children: React.ReactNode
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`rounded-md p-1.5 transition-colors disabled:opacity-40 ${
        danger
          ? 'text-ink-tertiary hover:bg-negative-wash hover:text-negative'
          : 'text-ink-tertiary hover:bg-surface-sunken hover:text-ink'
      }`}
    >
      {children}
    </button>
  )
}
