/**
 * Playoff bracket.
 *
 * Rounds, matchups and seeds all come from the database. The previous version
 * hardcoded last season's seeds by team slug and printed fixed round dates
 * ("Play-In Round - January 4th"), so it went stale the moment the season
 * ended. Round dates are now derived from the games in each round.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { Trophy, Calendar, Clock, Pencil } from 'lucide-react'
import { useAdmin } from '@/lib/adminContext'
import { useTeams } from '@/lib/teamsContext'
import { LEAGUE } from '@/config/league'
import { EditBoxScoreModal } from './EditBoxScoreModal'
import { BoxScoreModal } from './BoxScoreModal'
import { Game } from '@/types/game'
import { getPlayoffGames, getGameById } from '@/lib/supabaseData'
import { formatDate } from '@/lib/dateUtils'
import { displayJersey } from '@/types/player'

/** Rounds in the order they should appear, earliest first. */
const ROUND_ORDER = ['play-in', 'quarterfinal', 'semifinal', 'final'] as const

const ROUND_LABELS: Record<string, string> = {
  'play-in': 'Play-In Round',
  quarterfinal: 'Quarterfinals',
  semifinal: 'Semifinals',
  final: 'Championship Final',
}

export function PlayoffBracket() {
  const { isAdmin } = useAdmin()
  const { teamName, teamLogo } = useTeams()
  const [playoffGames, setPlayoffGames] = useState<Game[]>([])
  const [gameForEdit, setGameForEdit] = useState<Game | null>(null)
  const [gameForView, setGameForView] = useState<Game | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const loadPlayoffGames = useCallback(async () => {
    setIsLoading(true)
    try {
      setPlayoffGames(await getPlayoffGames())
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPlayoffGames()
    const handleUpdate = () => loadPlayoffGames()
    window.addEventListener('dataUpdated', handleUpdate)
    return () => window.removeEventListener('dataUpdated', handleUpdate)
  }, [loadPlayoffGames])

  const handleView = async (game: Game) => {
    const full = await getGameById(game.id)
    if (full) {
      setGameForView(full)
      setIsViewModalOpen(true)
    }
  }

  const handleEdit = async (game: Game) => {
    const full = await getGameById(game.id)
    setGameForEdit(full ?? game)
    setIsEditModalOpen(true)
  }

  /**
   * Groups games by round, keeping ROUND_ORDER first and appending any
   * unrecognised round names so nothing silently disappears from the bracket.
   */
  const rounds = (() => {
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

    return [...known, ...extra].map((round) => ({
      round,
      label: ROUND_LABELS[round] ?? 'Playoffs',
      games: byRound.get(round)!,
    }))
  })()

  if (isLoading) {
    return (
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-black">Loading playoff bracket...</p>
        </div>
      </section>
    )
  }

  if (playoffGames.length === 0) return null

  /** "Oct 12" or "Oct 12 – Oct 14" for the games in a round. */
  const roundDateLabel = (games: Game[]): string => {
    const dates = [...new Set(games.map((g) => g.date))].filter(Boolean).sort()
    if (dates.length === 0) return ''
    if (dates.length === 1) return formatDate(dates[0])
    return `${formatDate(dates[0])} – ${formatDate(dates[dates.length - 1])}`
  }

  const GameCard = ({ game }: { game: Game }) => {
    const hasScores = game.homeScore !== null && game.awayScore !== null
    const homeName = teamName(game.homeTeamId)
    const awayName = teamName(game.awayTeamId)

    const winner = !hasScores
      ? undefined
      : game.homeScore! > game.awayScore!
        ? game.homeTeamId
        : game.awayScore! > game.homeScore!
          ? game.awayTeamId
          : undefined

    const TeamRow = ({
      slug,
      name,
      score,
    }: {
      slug: string
      name: string
      score: number | null
    }) => (
      <div
        className={`flex items-center justify-between p-3 rounded-lg ${
          winner && winner === slug
            ? 'bg-green-900/30 border border-green-700'
            : 'bg-[#0a0a0a]'
        }`}
      >
        <div className="flex items-center gap-3">
          {slug && (
            <Image
              src={teamLogo(slug)}
              alt=""
              width={32}
              height={32}
              className="rounded"
            />
          )}
          <span className="font-bold text-white">{name}</span>
        </div>
        {hasScores && (
          <span className="text-2xl font-black text-[#D47F7D]">{score}</span>
        )}
      </div>
    )

    return (
      <div className="relative">
        <button
          onClick={() => handleView(game)}
          className="w-full bg-[#1a1a1a] border border-[#523232] rounded-lg p-4 shadow-league hover:border-[#D47F7D] transition-colors text-left cursor-pointer"
          aria-label={`View box score for ${homeName} versus ${awayName}`}
        >
          <div className="flex items-center justify-center gap-3 mb-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              {formatDate(game.date)}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock size={12} />
              {game.time}
            </span>
          </div>

          <div className="space-y-2">
            <TeamRow slug={game.homeTeamId} name={homeName} score={game.homeScore} />
            <div className="text-center text-xs font-bold text-gray-500">VS</div>
            <TeamRow slug={game.awayTeamId} name={awayName} score={game.awayScore} />
          </div>

          {hasScores && (
            <div className="mt-3 flex justify-center">
              <span className="text-xs px-3 py-1 bg-green-900/30 text-green-400 rounded-full font-semibold">
                FINAL
              </span>
            </div>
          )}

          <p className="mt-2 text-center text-xs text-gray-500">{game.location}</p>

          {game.playerOfGame && (
            <div className="mt-4 pt-4 border-t border-[#523232]">
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg">
                <Image
                  src={LEAGUE.manOfTheMatch.badgeImageUrl}
                  alt=""
                  width={50}
                  height={50}
                  className="rounded-full"
                />
                <div className="flex-1">
                  <p className="text-xs text-white font-bold uppercase flex items-center gap-1.5">
                    <Trophy size={14} className="text-white" />
                    {LEAGUE.manOfTheMatch.label}
                  </p>
                  <p className="text-base font-black text-white mt-1">
                    #{displayJersey(game.playerOfGame.jerseyNumber)}{' '}
                    {game.playerOfGame.name}
                  </p>
                </div>
              </div>
            </div>
          )}
        </button>

        {isAdmin && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleEdit(game)
            }}
            className="absolute top-2 right-2 p-2 bg-[#D47F7D]/90 hover:bg-[#D47F7D] rounded-full transition-colors"
            aria-label="Edit playoff game"
          >
            <Pencil size={16} className="text-black" />
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      <section className="py-12 px-4 sm:px-6" aria-labelledby="playoff-bracket-title">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Trophy size={32} className="text-[#FFD700]" />
              <h2
                id="playoff-bracket-title"
                className="text-3xl sm:text-4xl font-black uppercase text-black"
              >
                Playoff Bracket
              </h2>
              <Trophy size={32} className="text-[#FFD700]" />
            </div>
            <p className="text-gray-700">Road to the Championship</p>
          </div>

          {rounds.map(({ round, label, games }) => {
            const dateLabel = roundDateLabel(games)
            const isFinal = round === 'final'

            return (
              <div key={round} className="mb-12">
                <h3 className="text-xl font-bold text-center text-[#523232] uppercase mb-6">
                  {label}
                  {dateLabel && (
                    <span className="block text-sm font-semibold text-gray-700 normal-case mt-1">
                      {dateLabel}
                    </span>
                  )}
                </h3>
                <div
                  className={
                    isFinal
                      ? 'max-w-md mx-auto'
                      : 'grid gap-6 md:grid-cols-2 max-w-4xl mx-auto'
                  }
                >
                  {games.map((game) => (
                    <GameCard key={game.id} game={game} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <EditBoxScoreModal
        game={gameForEdit}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setTimeout(() => setGameForEdit(null), 200)
        }}
        onSave={loadPlayoffGames}
      />

      <BoxScoreModal
        game={gameForView}
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false)
          setTimeout(() => setGameForView(null), 200)
        }}
      />
    </>
  )
}
