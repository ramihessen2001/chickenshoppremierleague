/**
 * Playoff bracket.
 *
 * Rounds, matchups and dates all come from the database, including the final,
 * which is just the last round in the sequence rather than a card of its own.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Pencil } from 'lucide-react'
import { useAdmin } from '@/lib/adminContext'
import { useTeams } from '@/lib/teamsContext'
import { EditBoxScoreModal } from './EditBoxScoreModal'
import { BoxScoreModal } from './BoxScoreModal'
import { Game } from '@/types/game'
import { getPlayoffGames, getGameById } from '@/lib/supabaseData'
import { formatDate, formatTime } from '@/lib/dateUtils'

/** Rounds in the order they are played. */
const ROUND_ORDER = ['play-in', 'quarterfinal', 'semifinal', 'final'] as const

const ROUND_LABELS: Record<string, string> = {
  'play-in': 'Play-in',
  quarterfinal: 'Quarterfinals',
  semifinal: 'Semifinals',
  final: 'Final',
}

export function PlayoffBracket() {
  const { isAdmin } = useAdmin()
  const { teamName, teamLogo } = useTeams()
  const [playoffGames, setPlayoffGames] = useState<Game[]>([])
  const [gameForEdit, setGameForEdit] = useState<Game | null>(null)
  const [gameForView, setGameForView] = useState<Game | null>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      setPlayoffGames(await getPlayoffGames())
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const handleUpdate = () => load()
    window.addEventListener('dataUpdated', handleUpdate)
    return () => window.removeEventListener('dataUpdated', handleUpdate)
  }, [load])

  const open = async (game: Game, edit: boolean) => {
    const full = (await getGameById(game.id)) ?? game
    if (edit) {
      setGameForEdit(full)
      setIsEditOpen(true)
    } else {
      setGameForView(full)
      setIsViewOpen(true)
    }
  }

  // Unrecognised round names are still shown rather than silently dropped.
  const byRound = new Map<string, Game[]>()
  for (const game of playoffGames) {
    const round = game.playoffRound || 'other'
    if (!byRound.has(round)) byRound.set(round, [])
    byRound.get(round)!.push(game)
  }

  const known = ROUND_ORDER.filter((round) => byRound.has(round))
  const extra = [...byRound.keys()].filter(
    (round) => !ROUND_ORDER.includes(round as (typeof ROUND_ORDER)[number])
  )
  const rounds = [...known, ...extra]

  if (isLoading || rounds.length === 0) return null

  /** "Oct 12" or "Oct 12 – Oct 14" across the games in a round. */
  const roundDates = (games: Game[]) => {
    const dates = [...new Set(games.map((g) => g.date))].filter(Boolean).sort()
    if (dates.length === 0) return ''
    if (dates.length === 1) return formatDate(dates[0])
    return `${formatDate(dates[0])} – ${formatDate(dates[dates.length - 1])}`
  }

  const Side = ({
    slug,
    name,
    score,
    won,
    played,
  }: {
    slug: string
    name: string
    score: number | null
    won: boolean
    played: boolean
  }) => (
    <div className="flex items-center gap-2.5">
      {slug ? (
        <Image
          src={teamLogo(slug)}
          alt=""
          width={24}
          height={24}
          className="h-6 w-6 shrink-0 object-contain"
        />
      ) : (
        <div className="h-6 w-6 shrink-0 rounded-full bg-surface-sunken" />
      )}
      <span
        className={`flex-1 truncate text-[14px] ${
          played && !won ? 'text-ink-secondary' : 'font-medium text-ink'
        }`}
      >
        {name}
      </span>
      {played && (
        <span
          className={`tabular text-[16px] ${
            won ? 'font-semibold text-ink' : 'text-ink-secondary'
          }`}
        >
          {score}
        </span>
      )}
    </div>
  )

  return (
    <>
      <section
        className="mx-auto max-w-6xl px-5 py-16 sm:px-8"
        aria-labelledby="bracket-heading"
      >
        <h2
          id="bracket-heading"
          className="text-[28px] font-semibold text-ink sm:text-[32px]"
        >
          Playoffs
        </h2>

        <div className="mt-10 space-y-12">
          {rounds.map((round) => {
            const games = byRound.get(round)!
            const dates = roundDates(games)

            return (
              <div key={round}>
                <div className="flex items-baseline gap-3">
                  <h3 className="text-[15px] font-semibold text-ink">
                    {ROUND_LABELS[round] ?? 'Playoffs'}
                  </h3>
                  {dates && (
                    <span className="tabular text-[13px] text-ink-tertiary">{dates}</span>
                  )}
                </div>

                <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                  {games.map((game) => {
                    const played = game.homeScore !== null && game.awayScore !== null
                    const homeName = teamName(game.homeTeamId)
                    const awayName = teamName(game.awayTeamId)
                    const homeWon = played && game.homeScore! > game.awayScore!
                    const awayWon = played && game.awayScore! > game.homeScore!

                    return (
                      <li key={game.id} className="group relative">
                        <button
                          onClick={() => open(game, false)}
                          className="w-full rounded-lg border border-hairline bg-surface p-5 text-left transition-colors hover:bg-surface-hover"
                          aria-label={`${homeName} versus ${awayName}`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <p className="tabular text-[12px] text-ink-tertiary">
                              {formatDate(game.date)} · {formatTime(game.time)}
                            </p>
                            {played && (
                              <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-tertiary">
                                Final
                              </span>
                            )}
                          </div>

                          <div className="mt-4 space-y-2.5">
                            <Side
                              slug={game.homeTeamId}
                              name={homeName}
                              score={game.homeScore}
                              won={homeWon}
                              played={played}
                            />
                            <Side
                              slug={game.awayTeamId}
                              name={awayName}
                              score={game.awayScore}
                              won={awayWon}
                              played={played}
                            />
                          </div>

                          {game.location && (
                            <p className="mt-4 truncate text-[12px] text-ink-tertiary">
                              {game.location}
                            </p>
                          )}
                        </button>

                        {isAdmin && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              open(game, true)
                            }}
                            className="absolute right-3 top-3 rounded-md p-1.5 text-ink-tertiary opacity-0 transition-opacity hover:bg-surface-sunken hover:text-ink focus-visible:opacity-100 group-hover:opacity-100"
                            aria-label="Edit playoff game"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>
      </section>

      <EditBoxScoreModal
        game={gameForEdit}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSave={load}
      />
      <BoxScoreModal
        game={gameForView}
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
      />
    </>
  )
}
