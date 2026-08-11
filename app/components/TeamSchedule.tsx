/**
 * A single team's fixtures: results so far and games still to come.
 */

'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Game } from '@/types/game'
import { displayJersey } from '@/types/player'
import { useTeams } from '@/lib/teamsContext'
import { BoxScoreModal } from './BoxScoreModal'
import { Calendar, Trophy, Clock } from 'lucide-react'

interface TeamScheduleProps {
  teamId: string
  games: Game[]
}

export function TeamSchedule({ teamId, games }: TeamScheduleProps) {
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  const { teamName } = useTeams()
  
  // Filter games for this team
  const teamGames = games.filter(
    game => game.homeTeamId === teamId || game.awayTeamId === teamId
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  
  // Separate past and upcoming games
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const pastGames = teamGames.filter(game => {
    const gameDate = new Date(game.date)
    gameDate.setHours(0, 0, 0, 0)
    return game.status === 'completed' || gameDate < today
  })
  
  const upcomingGames = teamGames.filter(game => {
    const gameDate = new Date(game.date)
    gameDate.setHours(0, 0, 0, 0)
    // Show as upcoming if scheduled OR if date is in future
    return (game.status === 'scheduled' || game.status !== 'completed') && gameDate >= today
  })
  
  const handleGameClick = (game: Game) => {
    if (game.status === 'completed') {
      setSelectedGame(game)
      setIsModalOpen(true)
    }
  }
  
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setTimeout(() => setSelectedGame(null), 200)
  }
  
  const getOpponentName = (game: Game) => {
    const opponentId = game.homeTeamId === teamId ? game.awayTeamId : game.homeTeamId
    return teamName(opponentId)
  }
  
  const getGameResult = (game: Game) => {
    if (game.status !== 'completed' || game.homeScore === null || game.awayScore === null) {
      return null
    }
    
    const isHome = game.homeTeamId === teamId
    const teamScore = isHome ? game.homeScore : game.awayScore
    const opponentScore = isHome ? game.awayScore : game.homeScore
    
    if (teamScore > opponentScore) return 'W'
    if (teamScore < opponentScore) return 'L'
    return 'T'
  }
  
  const getScoreDisplay = (game: Game) => {
    if (game.status !== 'completed' || game.homeScore === null || game.awayScore === null) {
      return null
    }
    
    const isHome = game.homeTeamId === teamId
    const teamScore = isHome ? game.homeScore : game.awayScore
    const opponentScore = isHome ? game.awayScore : game.homeScore
    
    return `${teamScore} - ${opponentScore}`
  }
  
  if (teamGames.length === 0) {
    return (
      <div className="bg-[#1a1a1a] border border-[#523232] rounded-lg p-8 text-center">
        <Calendar className="w-12 h-12 text-gray-500 mx-auto mb-4" />
        <p className="text-gray-400">No games scheduled yet</p>
      </div>
    )
  }
  
  return (
    <>
      <div className="space-y-8">
        {/* Past Games / Results */}
        {pastGames.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Trophy className="w-6 h-6 text-[#B8860B]" />
              <h3 className="text-xl sm:text-2xl font-bold uppercase text-[#B8860B]">
                Results
              </h3>
              <span className="text-gray-500">({pastGames.length} {pastGames.length === 1 ? 'game' : 'games'})</span>
            </div>
            
            <div className="space-y-3">
              {pastGames.map((game) => {
                const result = getGameResult(game)
                const score = getScoreDisplay(game)
                const opponent = getOpponentName(game)
                const isHome = game.homeTeamId === teamId
                
                return (
                  <div
                    key={game.id}
                    onClick={() => handleGameClick(game)}
                    className={`
                      bg-[#1a1a1a] border rounded-lg p-4 transition-all
                      ${game.status === 'completed' ? 'cursor-pointer hover:border-[#523232] hover:shadow-lg' : 'border-[#523232]'}
                    `}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        {/* Result Badge */}
                        {result && (
                          <div className={`
                            w-10 h-10 rounded-full flex items-center justify-center font-black text-lg
                            ${result === 'W' ? 'bg-green-600 text-white' : ''}
                            ${result === 'L' ? 'bg-red-600 text-white' : ''}
                            ${result === 'T' ? 'bg-gray-600 text-white' : ''}
                          `}>
                            {result}
                          </div>
                        )}
                        
                        {/* Game Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-gray-400 text-sm">{isHome ? 'vs' : '@'}</span>
                            <span className="text-white font-semibold">{opponent}</span>
                          </div>
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span>{new Date(game.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        </div>
                        
                        {/* Score */}
                        {score && (
                          <div className="flex items-center gap-2">
                            <div className="text-xl font-bold text-white">
                              {score}
                            </div>
                            {game.status === 'completed' && (
                              <div className="text-xs text-gray-500">
                                Click for details
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Player of the Game Badge */}
                    {game.playerOfGame && (
                      <div className="mt-4 pt-4 border-t border-[#523232]">
                        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
                          <Image
                            src="/images/puro_logo.png"
                            alt="Puro"
                            width={40}
                            height={40}
                            className="rounded-full"
                          />
                          <div className="flex-1">
                            <p className="text-xs text-black font-bold uppercase flex items-center gap-1.5">
                              <Trophy size={13} className="text-black" />
                              Puro Man of The Match
                            </p>
                            <p className="text-sm font-black text-black mt-0.5">
                              #{displayJersey(game.playerOfGame.jerseyNumber)} {game.playerOfGame.name}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
        
        {/* Upcoming Games */}
        {upcomingGames.length > 0 && (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-6 h-6 text-[#523232]" />
              <h3 className="text-xl sm:text-2xl font-bold uppercase text-[#523232]">
                Upcoming Games
              </h3>
              <span className="text-gray-500">({upcomingGames.length} {upcomingGames.length === 1 ? 'game' : 'games'})</span>
            </div>
            
            <div className="space-y-3">
              {upcomingGames.map((game) => {
                const opponent = getOpponentName(game)
                const isHome = game.homeTeamId === teamId
                
                return (
                  <div
                    key={game.id}
                    className="bg-[#1a1a1a] border border-[#523232] rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-gray-400 text-sm">{isHome ? 'vs' : '@'}</span>
                          <span className="text-white font-semibold">{opponent}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span>{new Date(game.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                          <span>•</span>
                          <span>{game.time}</span>
                        </div>
                        {game.location && (
                          <div className="text-sm text-gray-600 mt-1">
                            📍 {game.location}
                          </div>
                        )}
                      </div>
                      
                      <div className="px-3 py-1 bg-[#523232]/20 text-[#523232] rounded text-sm font-semibold">
                        Scheduled
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
        
        {/* Record Summary */}
        {pastGames.length > 0 && (
          <div className="bg-[#1a1a1a] border border-[#523232] rounded-lg p-4">
            <div className="flex items-center justify-center gap-6 text-center">
              <div>
                <div className="text-2xl font-black text-green-500">
                  {pastGames.filter(g => getGameResult(g) === 'W').length}
                </div>
                <div className="text-sm text-gray-400">Wins</div>
              </div>
              <div className="w-px h-12 bg-[#523232]" />
              <div>
                <div className="text-2xl font-black text-red-500">
                  {pastGames.filter(g => getGameResult(g) === 'L').length}
                </div>
                <div className="text-sm text-gray-400">Losses</div>
              </div>
              <div className="w-px h-12 bg-[#523232]" />
              <div>
                <div className="text-2xl font-black text-gray-400">
                  {pastGames.filter(g => getGameResult(g) === 'T').length}
                </div>
                <div className="text-sm text-gray-400">Ties</div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Box Score Modal */}
      <BoxScoreModal game={selectedGame} isOpen={isModalOpen} onClose={handleCloseModal} />
    </>
  )
}

