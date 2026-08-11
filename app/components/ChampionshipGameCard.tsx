/**
 * Feature card for the championship final.
 *
 * Renders whichever game is marked playoff_round = 'final'. The previous
 * version hardcoded last season's matchup (Knights vs Warriors), pinned itself
 * to game_number 104, and always claimed the game was "TODAY / LIVE". It now
 * shows nothing at all until a final exists, and reports the real state of it.
 */

'use client'

import Image from 'next/image'
import { Trophy, Crown, Sparkles, Edit2 } from 'lucide-react'
import { useState, useEffect, useCallback } from 'react'
import { useAdmin } from '@/lib/adminContext'
import { useTeams } from '@/lib/teamsContext'
import { Game } from '@/types/game'
import { getPlayoffGames } from '@/lib/supabaseData'
import { formatDate } from '@/lib/dateUtils'
import { EditBoxScoreModal } from './EditBoxScoreModal'
import { BoxScoreModal } from './BoxScoreModal'

export function ChampionshipGameCard() {
  const { isAdmin } = useAdmin()
  const { teamName, teamLogo, getTeam } = useTeams()
  const [game, setGame] = useState<Game | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    setIsLoading(true)
    try {
      const playoffGames = await getPlayoffGames()
      setGame(playoffGames.find((g) => g.playoffRound === 'final') ?? null)
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

  // Nothing to show until the final is on the schedule.
  if (isLoading || !game) return null

  const isCompleted = game.status === 'completed'
  const hasScores = game.homeScore !== null && game.awayScore !== null
  const homeName = teamName(game.homeTeamId)
  const awayName = teamName(game.awayTeamId)
  const homeColor = getTeam(game.homeTeamId)?.primaryColor ?? '#523232'
  const awayColor = getTeam(game.awayTeamId)?.primaryColor ?? '#8B0000'

  const champion =
    isCompleted && hasScores
      ? game.homeScore! > game.awayScore!
        ? homeName
        : game.awayScore! > game.homeScore!
          ? awayName
          : null
      : null

  const TeamSide = ({
    slug,
    name,
    color,
    align,
  }: {
    slug: string
    name: string
    color: string
    align: 'left' | 'right'
  }) => (
    <div
      className={`text-center space-y-4 ${
        align === 'right' ? 'md:text-right' : 'md:text-left'
      }`}
    >
      <div className="relative inline-block">
        <div
          className="absolute inset-0 rounded-full blur-2xl opacity-50"
          style={{ backgroundColor: color }}
        />
        <div className="relative">
          {slug ? (
            <Image
              src={teamLogo(slug)}
              alt=""
              width={180}
              height={180}
              className="rounded-full border-4 shadow-2xl transition-transform group-hover:scale-105"
              style={{ borderColor: color }}
            />
          ) : (
            <div
              className="w-[180px] h-[180px] rounded-full border-4 flex items-center justify-center text-gray-400 font-bold"
              style={{ borderColor: color }}
            >
              TBD
            </div>
          )}
        </div>
      </div>

      <h3 className="text-4xl sm:text-5xl font-black uppercase text-white tracking-wider">
        {name}
      </h3>
    </div>
  )

  return (
    <>
      <section className="py-12 px-4 sm:px-6" aria-labelledby="championship-title">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Trophy className="text-yellow-500" size={40} />
              <h2
                id="championship-title"
                className="text-4xl sm:text-5xl md:text-6xl font-black uppercase bg-gradient-to-r from-[#D47F7D] via-yellow-500 to-[#B8860B] bg-clip-text text-transparent"
              >
                Championship Final
              </h2>
              <Trophy className="text-yellow-500" size={40} />
            </div>

            {champion ? (
              <p className="text-2xl sm:text-3xl font-bold text-black uppercase tracking-wide">
                {champion} are your champions
              </p>
            ) : (
              <p className="text-xl sm:text-2xl font-bold text-black uppercase tracking-wide">
                One game decides the season
              </p>
            )}
          </div>

          <div
            className="relative group cursor-pointer"
            onClick={() => (isAdmin ? setIsEditModalOpen(true) : setIsViewModalOpen(true))}
          >
            {isAdmin && (
              <div className="absolute -top-4 -right-4 z-20">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsEditModalOpen(true)
                  }}
                  className="bg-[#D47F7D] hover:bg-[#B8860B] text-black p-3 rounded-full shadow-2xl transition-all hover:scale-110 border-2 border-yellow-400"
                  aria-label="Edit championship game"
                >
                  <Edit2 size={24} />
                </button>
              </div>
            )}

            <div className="absolute -inset-1 bg-gradient-to-r from-[#D47F7D] via-yellow-400 to-[#B8860B] rounded-2xl blur opacity-60 group-hover:opacity-90 transition-opacity" />

            <div className="relative bg-gradient-to-br from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a] border-4 border-[#D47F7D] rounded-2xl p-8 pt-14 shadow-2xl">
              <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                <div className="relative">
                  <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-50" />
                  <div className="relative bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-600 p-4 rounded-full border-4 border-yellow-200 shadow-2xl">
                    <Crown className="text-yellow-900" size={40} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
                <TeamSide
                  slug={game.homeTeamId}
                  name={homeName}
                  color={homeColor}
                  align="right"
                />

                <div className="text-center">
                  {hasScores ? (
                    <div className="inline-flex items-center gap-4">
                      <span className="text-6xl font-black text-white">
                        {game.homeScore}
                      </span>
                      <span className="text-3xl text-gray-500">–</span>
                      <span className="text-6xl font-black text-white">
                        {game.awayScore}
                      </span>
                    </div>
                  ) : (
                    <div className="relative inline-block">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#D47F7D] to-yellow-400 rounded-full blur-xl opacity-70" />
                      <div className="relative bg-gradient-to-br from-[#D47F7D] via-yellow-400 to-[#B8860B] p-8 rounded-full border-4 border-white shadow-2xl">
                        <p className="text-4xl sm:text-5xl font-black text-black">VS</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 space-y-1">
                    <p className="text-xl font-black text-white">
                      {formatDate(game.date)} • {game.time}
                    </p>
                    <p className="text-base text-[#B8860B] font-semibold">
                      {game.location}
                    </p>
                    {isCompleted && (
                      <span className="inline-block mt-2 px-4 py-1 bg-green-700 text-white text-xs font-bold rounded-full uppercase">
                        Final
                      </span>
                    )}
                  </div>
                </div>

                <TeamSide
                  slug={game.awayTeamId}
                  name={awayName}
                  color={awayColor}
                  align="left"
                />
              </div>

              <div className="mt-8 text-center">
                <div className="h-px bg-gradient-to-r from-transparent via-yellow-400 to-transparent mb-4" />
                <p className="inline-flex items-center gap-2 text-sm text-gray-400">
                  <Sparkles size={16} className="text-yellow-500" />
                  Tap the card for the full box score
                  <Sparkles size={16} className="text-yellow-500" />
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <EditBoxScoreModal
        game={game}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={load}
      />

      <BoxScoreModal
        game={game}
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
      />
    </>
  )
}
