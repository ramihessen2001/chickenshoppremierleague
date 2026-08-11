/**
 * FullSchedule component for YM JAX Soccer League
 * Displays complete season schedule organized by week
 */

'use client'

import { useState } from 'react'
import { Game } from '@/types/game'
import { WeekSection } from './WeekSection'
import { BoxScoreModal } from './BoxScoreModal'
import { EditBoxScoreModal } from './EditBoxScoreModal'
import { EditGameModal } from './EditGameModal'
import { useAdmin } from '@/lib/adminContext'
import { getGameById } from '@/lib/supabaseData'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'

interface FullScheduleProps {
  games: Game[]
  currentWeek: number
  totalWeeks: number
}

export function FullSchedule({ games, currentWeek, totalWeeks }: FullScheduleProps) {
  const { isAdmin } = useAdmin()
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [selectedGameWithStats, setSelectedGameWithStats] = useState<Game | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditBoxScoreModalOpen, setIsEditBoxScoreModalOpen] = useState(false)
  const [isEditGameModalOpen, setIsEditGameModalOpen] = useState(false)
  const [newGameWeek, setNewGameWeek] = useState<number | undefined>(undefined)
  const [isLoadingGame, setIsLoadingGame] = useState(false)
  
  const handleGameClick = async (game: Game) => {
    // Load full game with statistics from Supabase for viewing
    setIsLoadingGame(true)
    const fullGame = await getGameById(game.id)
    setIsLoadingGame(false)
    
    if (fullGame) {
      setSelectedGame(fullGame)
      setIsModalOpen(true)
    }
  }
  
  const handleEditBoxScore = async (game: Game) => {
    // Load full game with statistics from Supabase for editing
    setIsLoadingGame(true)
    const fullGame = await getGameById(game.id)
    setIsLoadingGame(false)
    
    if (fullGame) {
      setSelectedGameWithStats(fullGame)
      setIsEditBoxScoreModalOpen(true)
    }
  }
  
  const handleEditGame = (game: Game) => {
    setSelectedGame(game)
    setIsEditGameModalOpen(true)
  }
  
  const handleAddGame = (weekNumber: number) => {
    setSelectedGame(null)
    setNewGameWeek(weekNumber)
    setIsEditGameModalOpen(true)
  }
  
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setTimeout(() => setSelectedGame(null), 200)
  }
  
  const handleCloseEditBoxScoreModal = () => {
    setIsEditBoxScoreModalOpen(false)
    setTimeout(() => {
      setSelectedGame(null)
      setSelectedGameWithStats(null)
    }, 200)
  }
  
  const handleCloseEditGameModal = () => {
    setIsEditGameModalOpen(false)
    setNewGameWeek(undefined)
    setTimeout(() => setSelectedGame(null), 200)
  }
  
  // Group games by week
  const gamesByWeek = new Map<number, Game[]>()
  games.forEach(game => {
    if (!gamesByWeek.has(game.weekNumber)) {
      gamesByWeek.set(game.weekNumber, [])
    }
    gamesByWeek.get(game.weekNumber)!.push(game)
  })
  
  // Sort games within each week by date
  gamesByWeek.forEach(weekGames => {
    weekGames.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  })
  
  return (
    <>
      <div className="w-full py-12 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* Back button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-[#D47F7D] hover:text-[#D47F7D]/80 transition-colors mb-8"
            aria-label="Back to homepage"
          >
            <ArrowLeft size={20} />
            <span className="font-semibold">Back to Home</span>
          </Link>
          
          {/* Page header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-black text-black mb-4">
              FULL SEASON SCHEDULE
            </h1>
            <p className="text-xl text-[#B7853E]">
              {totalWeeks} Days • Current Day: {currentWeek}
            </p>
          </div>
          
          {/* Gold divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-[#B8860B] to-transparent mb-12" />
          
          {/* Day sections */}
          <div className="space-y-6">
            {Array.from({ length: totalWeeks }, (_, i) => i + 1).map(dayNum => {
              const dayGames = gamesByWeek.get(dayNum) || []
              return (
                <WeekSection
                  key={dayNum}
                  weekNumber={dayNum}
                  games={dayGames}
                  isCurrentWeek={dayNum === currentWeek}
                  onGameClick={handleGameClick}
                  onEditBoxScore={isAdmin ? handleEditBoxScore : undefined}
                  onEditGame={isAdmin ? handleEditGame : undefined}
                  onAddGame={isAdmin ? () => handleAddGame(dayNum) : undefined}
                />
              )
            })}
          </div>
        </div>
      </div>
      
      {/* Box Score Modal */}
      <BoxScoreModal game={selectedGame} isOpen={isModalOpen} onClose={handleCloseModal} />
      
      {/* Edit Box Score Modal */}
      <EditBoxScoreModal 
        game={selectedGameWithStats} 
        isOpen={isEditBoxScoreModalOpen} 
        onClose={handleCloseEditBoxScoreModal}
      />
      
      {/* Edit Game Modal */}
      <EditGameModal game={selectedGame} isOpen={isEditGameModalOpen} onClose={handleCloseEditGameModal} defaultWeek={newGameWeek} />
    </>
  )
}

