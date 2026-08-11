/**
 * WeeklyGames component for YM JAX Soccer League
 * Displays current week's scheduled games
 */

'use client'

import { useState, useEffect } from 'react'
import { Game } from '@/types/game'
import { getTeamById } from '@/config/teams'
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
  const [isLoadingGame, setIsLoadingGame] = useState(false)
  
  const handleGameClick = async (game: Game, edit = false) => {
    setSelectedGame(game)
    
    if (edit) {
      // Load full game with statistics from Supabase for editing
      setIsLoadingGame(true)
      const fullGame = await getGameById(game.id)
      setIsLoadingGame(false)
      
      if (fullGame) {
        setSelectedGameWithStats(fullGame)
        setIsEditModalOpen(true)
      }
    } else {
      // Load full game with statistics from Supabase for viewing
      setIsLoadingGame(true)
      const fullGame = await getGameById(game.id)
      setIsLoadingGame(false)
      
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
          <h2 id="weekly-games-title" className="text-3xl sm:text-4xl font-black text-center mb-8 text-black">
            TODAY'S GAMES
          </h2>
          
          <p className="text-center text-gray-400 mb-6">Day {weekNumber}</p>
          
          {games.length === 0 ? (
            <p className="text-center text-gray-400">No games scheduled for today</p>
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
  const homeTeam = getTeamById(game.homeTeamId)
  const awayTeam = getTeamById(game.awayTeamId)
  
  if (!homeTeam || !awayTeam) return null
  
  // Show scores if they exist (including 0-0 for scheduled games)
  const hasScores = game.homeScore !== null && game.awayScore !== null
  const scoreDisplay = hasScores ? `${game.homeScore} - ${game.awayScore}` : 'VS'
  
  return (
    <div className="relative">
      <button
        onClick={onClick}
        className="block w-full p-6 border border-[#523232] rounded-lg shadow-league hover:border-[#D47F7D] transition-colors text-left cursor-pointer"
        aria-label={`View box score for ${homeTeam.name} vs ${awayTeam.name}`}
      >
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-bold uppercase text-black">{homeTeam.name}</span>
          <span className="text-2xl font-black text-[#D47F7D]">{scoreDisplay}</span>
          <span className="text-lg font-bold uppercase text-black">{awayTeam.name}</span>
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
                src="/images/puro_logo.png"
                alt="Puro"
                width={50}
                height={50}
                className="rounded-full"
              />
              <div className="flex-1">
                <p className="text-xs text-black font-bold uppercase flex items-center gap-1.5">
                  <Trophy size={14} className="text-black" />
                  Puro Man of The Match
                </p>
                <p className="text-base font-black text-black mt-1">
                  #{game.playerOfGame.jerseyNumber} {game.playerOfGame.name}
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

