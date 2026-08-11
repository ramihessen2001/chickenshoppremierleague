/**
 * PlayoffBracket - Displays the playoff tournament bracket
 * Shows play-in, semifinal, and final matchups with seeds and results
 * Admins can edit scores and update results
 */

'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Trophy, Calendar, Clock, Pencil } from 'lucide-react'
import { TEAMS } from '@/config/teams'
import { useAdmin } from '@/lib/adminContext'
import { EditBoxScoreModal } from './EditBoxScoreModal'
import { BoxScoreModal } from './BoxScoreModal'
import { Game } from '@/types/game'
import { supabase } from '@/lib/supabase'
import { getGameById } from '@/lib/supabaseData'

export function PlayoffBracket() {
  const { isAdmin } = useAdmin()
  const [playoffGames, setPlayoffGames] = useState<Game[]>([])
  const [selectedGameForEdit, setSelectedGameForEdit] = useState<Game | null>(null)
  const [selectedGameForView, setSelectedGameForView] = useState<Game | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Load playoff games from Supabase (week_number = 0)
  const loadPlayoffGames = async () => {
    try {
      setIsLoading(true)
      const { data, error } = await supabase
        .from('games')
        .select(`
          *,
          home_team:teams!home_team_id(id, name, slug, logo_url),
          away_team:teams!away_team_id(id, name, slug, logo_url)
        `)
        .eq('week_number', 0)
        .order('game_number')

      if (error) {
        console.error('Error loading playoff games:', error)
        return
      }

      // For each game, fetch the player of game if it exists
      const gamesWithPlayerOfGame = await Promise.all(
        (data || []).map(async (g: any) => {
          let playerOfGame = null
          if (g.player_of_game_id) {
            const { data: player, error: playerError } = await supabase
              .from('players')
              .select(`
                id,
                name,
                jersey_number,
                position,
                is_active,
                created_at,
                updated_at,
                team:teams(id, name, slug)
              `)
              .eq('id', g.player_of_game_id)
              .single()

            if (!playerError && player) {
              const team = Array.isArray(player.team) ? player.team[0] : player.team
              playerOfGame = {
                id: player.id,
                name: player.name,
                jerseyNumber: player.jersey_number,
                teamId: team?.slug || '',
                position: player.position,
                isActive: player.is_active,
                createdAt: player.created_at,
                updatedAt: player.updated_at
              }
            }
          }

          return {
            id: g.id,
            gameNumber: g.game_number,
            weekNumber: g.week_number,
            date: g.date,
            time: g.time,
            location: g.location,
            homeTeamId: g.home_team?.slug || '',
            awayTeamId: g.away_team?.slug || '',
            homeScore: g.home_score,
            awayScore: g.away_score,
            status: g.status,
            statistics: [],
            playerOfGameId: g.player_of_game_id,
            playerOfGame: playerOfGame,
            playoffRound: g.playoff_round,
            createdAt: g.created_at,
            updatedAt: g.updated_at
          }
        })
      )

      setPlayoffGames(gamesWithPlayerOfGame)
    } catch (error) {
      console.error('Error loading playoff games:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadPlayoffGames()

    // Listen for data updates
    const handleDataUpdate = () => {
      loadPlayoffGames()
    }

    window.addEventListener('dataUpdated', handleDataUpdate)

    return () => {
      window.removeEventListener('dataUpdated', handleDataUpdate)
    }
  }, [])

  const handleEditGame = (game: Game) => {
    setSelectedGameForEdit(game)
    setIsEditModalOpen(true)
  }

  const handleViewGame = async (game: Game) => {
    // Fetch full game with statistics
    const fullGame = await getGameById(game.id)
    if (fullGame) {
      setSelectedGameForView(fullGame)
      setIsViewModalOpen(true)
    }
  }

  const handleCloseModal = () => {
    setIsEditModalOpen(false)
    setTimeout(() => setSelectedGameForEdit(null), 200)
  }

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false)
    setTimeout(() => setSelectedGameForView(null), 200)
  }

  const handleSavePlayoffGame = () => {
    // Reload playoff games from Supabase after edit
    loadPlayoffGames()
    handleCloseModal()
  }

  const getTeamLogo = (slug: string) => {
    if (!slug) return ''
    const team = TEAMS.find(t => t.id === slug)
    return team?.logoUrl || `/images/${slug}_logo.png`
  }

  const getTeamName = (slug: string) => {
    if (!slug) return 'TBD'
    const team = TEAMS.find(t => t.id === slug)
    return team?.name || slug
  }

  const getTeamSeed = (slug: string) => {
    // Hardcoded seeds for playoff teams
    const seeds: Record<string, number> = {
      'knights': 1,
      'panthers': 2,
      'warriors': 3,
      'dolphins': 4,
      'lions': 5,
      'eagles': 6
    }
    return seeds[slug] || 0
  }

  const getRoundLabel = (round: string) => {
    switch (round) {
      case 'play-in': return 'Play-In'
      case 'semifinal': return 'Semifinal'
      case 'final': return 'Final'
      default: return round
    }
  }

  const GameCard = ({ game }: { game: Game }) => {
    const hasScores = game.homeScore !== null && game.awayScore !== null
    const homeTeamName = getTeamName(game.homeTeamId)
    const awayTeamName = getTeamName(game.awayTeamId)
    const homeTeamSeed = getTeamSeed(game.homeTeamId)
    const awayTeamSeed = getTeamSeed(game.awayTeamId)
    const winner = hasScores && game.homeScore! > game.awayScore! ? game.homeTeamId :
                   hasScores && game.awayScore! > game.homeScore! ? game.awayTeamId : undefined
    
    return (
      <div className="relative">
        <button
          onClick={() => handleViewGame(game)}
          className="w-full bg-[#1a1a1a] border border-[#523232] rounded-lg p-4 shadow-league hover:border-[#D47F7D] transition-colors text-left cursor-pointer"
          aria-label={`View box score for ${homeTeamName} vs ${awayTeamName}`}
        >
          {/* Date and Time */}
          <div className="flex items-center justify-center gap-3 mb-3 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              <span>{new Date(game.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>{game.time}</span>
            </div>
          </div>

          {/* Teams */}
          <div className="space-y-2">
            {/* Home Team */}
            <div className={`flex items-center justify-between p-3 rounded-lg ${
              hasScores && winner === game.homeTeamId
                ? 'bg-green-900/30 border border-green-700' 
                : 'bg-[#0a0a0a]'
            }`}>
              <div className="flex items-center gap-3">
                {game.homeTeamId && (
                  <Image
                    src={getTeamLogo(game.homeTeamId)}
                    alt={homeTeamName}
                    width={32}
                    height={32}
                    className="rounded"
                  />
                )}
                <div>
                  <div className="font-bold text-white">{homeTeamName}</div>
                  {homeTeamSeed > 0 && (
                    <div className="text-xs text-gray-400">Seed #{homeTeamSeed}</div>
                  )}
                </div>
              </div>
              {hasScores && (
                <div className="text-2xl font-black text-[#D47F7D]">{game.homeScore}</div>
              )}
            </div>

            {/* VS Divider */}
            <div className="text-center text-xs font-bold text-gray-500">VS</div>

            {/* Away Team */}
            <div className={`flex items-center justify-between p-3 rounded-lg ${
              hasScores && winner === game.awayTeamId
                ? 'bg-green-900/30 border border-green-700' 
                : 'bg-[#0a0a0a]'
            }`}>
              <div className="flex items-center gap-3">
                {game.awayTeamId && (
                  <Image
                    src={getTeamLogo(game.awayTeamId)}
                    alt={awayTeamName}
                    width={32}
                    height={32}
                    className="rounded"
                  />
                )}
                <div>
                  <div className="font-bold text-white">{awayTeamName}</div>
                  {awayTeamSeed > 0 && (
                    <div className="text-xs text-gray-400">Seed #{awayTeamSeed}</div>
                  )}
                </div>
              </div>
              {hasScores && (
                <div className="text-2xl font-black text-[#D47F7D]">{game.awayScore}</div>
              )}
            </div>
          </div>

          {/* Round Label and Status */}
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="text-xs px-3 py-1 bg-[#D47F7D]/20 text-[#D47F7D] rounded-full font-semibold uppercase">
              {getRoundLabel((game as any).playoffRound || 'playoff')}
            </span>
            {hasScores && (
              <span className="text-xs px-3 py-1 bg-green-900/30 text-green-400 rounded-full font-semibold">
                FINAL
              </span>
            )}
          </div>

          {/* Location */}
          <div className="mt-2 text-center text-xs text-gray-500">
            {game.location}
          </div>

          {/* Player of the Game Badge */}
          {game.playerOfGame && (
            <div className="mt-4 pt-4 border-t border-[#523232]">
              <div className="flex items-center gap-3 px-4 py-3 rounded-lg">
                <Image
                  src="/images/puro_white.png"
                  alt="Puro"
                  width={50}
                  height={50}
                  className="rounded-full"
                />
                <div className="flex-1">
                  <p className="text-xs text-white font-bold uppercase flex items-center gap-1.5">
                    <Trophy size={14} className="text-white" />
                    Puro Man of The Match
                  </p>
                  <p className="text-base font-black text-white mt-1">
                    #{game.playerOfGame.jerseyNumber} {game.playerOfGame.name}
                  </p>
                </div>
              </div>
            </div>
          )}
        </button>

        {/* Admin Edit Button */}
        {isAdmin && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleEditGame(game)
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

  const playInGames = playoffGames.filter(g => (g as any).playoffRound === 'play-in')
  const semifinalGames = playoffGames.filter(g => (g as any).playoffRound === 'semifinal')
  const finalGames = playoffGames.filter(g => (g as any).playoffRound === 'final')

  if (isLoading) {
    return (
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-white">Loading playoff bracket...</p>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className="py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-2">
              <Trophy size={32} className="text-[#FFD700]" />
              <h2 className="text-3xl sm:text-4xl font-black uppercase text-black">
                Playoff Bracket
              </h2>
              <Trophy size={32} className="text-[#FFD700]" />
            </div>
            <p className="text-gray-400">Road to the Championship</p>
          </div>

          {/* Play-In Round */}
          {playInGames.length > 0 && (
            <div className="mb-12">
              <h3 className="text-xl font-bold text-center text-[#D47F7D] uppercase mb-6">
                Play-In Round - January 4th
              </h3>
              <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
                {playInGames.map(game => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            </div>
          )}

          {/* Semifinals */}
          {semifinalGames.length > 0 && (
            <div className="mb-12">
              <h3 className="text-xl font-bold text-center text-[#D47F7D] uppercase mb-6">
                Semifinals - January 9th
              </h3>
              <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
                {semifinalGames.map(game => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            </div>
          )}

          {/* Finals */}
          {finalGames.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xl font-bold text-center text-[#D47F7D] uppercase mb-6">
                Championship Final
              </h3>
              <div className="max-w-md mx-auto">
                {finalGames.map(game => (
                  <GameCard key={game.id} game={game} />
                ))}
              </div>
            </div>
          )}

          {/* Seeding Note */}
          <div className="mt-6 text-center text-sm text-gray-500">
            * Lower seed from play-in will face #1 Knights, higher seed faces #2 Panthers
          </div>
        </div>
      </section>

      {/* Edit Modal - Uses the full EditBoxScoreModal */}
      <EditBoxScoreModal
        game={selectedGameForEdit}
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        onSave={handleSavePlayoffGame}
      />

      {/* View Modal - Box Score Display */}
      <BoxScoreModal
        game={selectedGameForView}
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
      />
    </>
  )
}
