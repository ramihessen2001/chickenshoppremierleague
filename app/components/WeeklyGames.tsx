/**
 * The current week's games, shown on the homepage.
 */

'use client'

import { useState } from 'react'
import { Game } from '@/types/game'
import { displayJersey } from '@/types/player'
import { useTeams } from '@/lib/teamsContext'
import { LEAGUE } from '@/config/league'
import { formatDate, formatTime } from '@/lib/dateUtils'
import { BoxScoreModal } from './BoxScoreModal'
import { EditBoxScoreModal } from './EditBoxScoreModal'
import { useAdmin } from '@/lib/adminContext'
import { getGameById } from '@/lib/supabaseData'
import { Pencil, Trophy } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

interface WeeklyGamesProps {
  games: Game[]
  weekNumber: number
}

export function WeeklyGames({ games, weekNumber }: WeeklyGamesProps) {
  const { isAdmin } = useAdmin()
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [selectedGameWithStats, setSelectedGameWithStats] = useState<Game | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  
  const handleGameClick = async (game: Game, edit = false) => {
    setSelectedGame(game)
    
    if (edit) {
      // Load full game with statistics from Supabase for editing
      const fullGame = await getGameById(game.id)
      
      if (fullGame) {
        setSelectedGameWithStats(fullGame)
        setIsEditModalOpen(true)
      }
    } else {
      // Load full game with statistics from Supabase for viewing
      const fullGame = await getGameById(game.id)
      
      if (fullGame) {
        setSelectedGame(fullGame)
      }
      setIsModalOpen(true)
    }
  }
  
  const handleCloseModal = () => {
    setIsModalOpen(false)
    // Delay clearing selected game to allow modal close animation
    setTimeout(() => setSelectedGame(null), 200)
  }
  
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setTimeout(() => {
      setSelectedGame(null)
      setSelectedGameWithStats(null)
    }, 200)
  }
  
  return (
    <>
      <section className="py-12 px-4 sm:px-6" aria-labelledby="weekly-games-title">
        <div className="max-w-7xl mx-auto">
          <h2 id="weekly-games-title" className="text-3xl sm:text-4xl font-black text-center mb-2 text-black">
            This Week&apos;s Games
          </h2>

          <p className="text-center text-gray-700 mb-6">Week {weekNumber}</p>

          {games.length === 0 ? (
            <p className="text-center text-gray-700">
              No games scheduled for week {weekNumber}
            </p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {games.map(game => (
                <GameCard 
                  key={game.id} 
                  game={game} 
                  onClick={() => handleGameClick(game)} 
                  onEdit={isAdmin ? () => handleGameClick(game, true) : undefined}
                />
              ))}
            </div>
          )}
          
          {/* Link to full schedule and standings */}
          <div className="mt-8 text-center flex flex-wrap justify-center gap-4">
            <Link
              href="/schedule"
              className="inline-block px-6 py-3 bg-[#D47F7D] hover:bg-[#D47F7D]/90 rounded-lg font-semibold transition-colors"
              aria-label="View full season schedule"
            >
              View Full Season Schedule
            </Link>
            <Link
              href="/standings"
              className="inline-block px-6 py-3 bg-[#D47F7D] hover:bg-[#D47F7D]/90 rounded-lg font-semibold transition-colors"
              aria-label="View league standings"
            >
              View Standings
            </Link>
            <Link
              href="/stats"
              className="inline-block px-6 py-3 bg-[#D47F7D] hover:bg-[#D47F7D]/90 rounded-lg font-semibold transition-colors"
              aria-label="View player statistics"
            >
              View Player Stats
            </Link>
          </div>
        </div>
      </section>
      
      {/* Box Score Modal */}
      <BoxScoreModal game={selectedGame} isOpen={isModalOpen} onClose={handleCloseModal} />
      
      {/* Edit Box Score Modal */}
      <EditBoxScoreModal 
        game={selectedGameWithStats} 
        isOpen={isEditModalOpen} 
        onClose={handleCloseEditModal}
      />
    </>
  )
}

interface GameCardProps {
  game: Game
  onClick: () => void
  onEdit?: () => void
}

function GameCard({ game, onClick, onEdit }: GameCardProps) {
  const { teamName } = useTeams()
  const homeTeamName = teamName(game.homeTeamId)
  const awayTeamName = teamName(game.awayTeamId)

  // Show scores if they exist (including 0-0 for scheduled games)
  const hasScores = game.homeScore !== null && game.awayScore !== null
  const scoreDisplay = hasScores ? `${game.homeScore} - ${game.awayScore}` : 'VS'

  return (
    <div className="relative">
      <button
        onClick={onClick}
        className="block w-full p-6 border border-[#523232] rounded-lg shadow-league hover:border-[#D47F7D] transition-colors text-left cursor-pointer"
        aria-label={`View box score for ${homeTeamName} vs ${awayTeamName}`}
      >
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-bold uppercase text-black">{homeTeamName}</span>
          <span className="text-2xl font-black text-[#D47F7D]">{scoreDisplay}</span>
          <span className="text-lg font-bold uppercase text-black">{awayTeamName}</span>
        </div>
        
        <div className="text-sm text-gray-400 space-y-1">
          <p>{formatDate(game.date)} • {formatTime(game.time)}</p>
          <p>{game.location}</p>
          {game.status !== 'scheduled' && game.status !== 'completed' && (
            <p className="text-yellow-400 capitalize">{game.status}</p>
          )}
        </div>
        
        {/* Player of the Game Badge */}
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
                <p className="text-xs text-black font-bold uppercase flex items-center gap-1.5">
                  <Trophy size={14} className="text-black" />
                  {LEAGUE.manOfTheMatch.label}
                </p>
                <p className="text-base font-black text-black mt-1">
                  #{displayJersey(game.playerOfGame.jerseyNumber)} {game.playerOfGame.name}
                </p>
              </div>
            </div>
          </div>
        )}
      </button>
      
      {onEdit && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
          className="absolute top-2 right-2 p-2 bg-[#D47F7D]/90 hover:bg-[#D47F7D] rounded-full transition-colors"
          aria-label="Edit box score"
        >
          <Pencil size={16} className="text-black" />
        </button>
      )}
    </div>
  )
}

