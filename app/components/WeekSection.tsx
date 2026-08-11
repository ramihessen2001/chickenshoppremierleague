/**
 * WeekSection component for YM JAX Soccer League
 * Displays all games for a single week
 */

'use client'

import { Game } from '@/types/game'
import { getTeamById } from '@/config/teams'
import { formatDate, formatTime } from '@/lib/dateUtils'
import { Pencil, Edit, Plus, Trash2, Trophy } from 'lucide-react'
import { deleteLocalGame } from '@/lib/localStore'
import { triggerDataRefresh } from '@/lib/ClientDataProvider'
import Image from 'next/image'

interface WeekSectionProps {
  weekNumber: number
  games: Game[]
  isCurrentWeek: boolean
  onGameClick: (game: Game) => void
  onEditBoxScore?: (game: Game) => void
  onEditGame?: (game: Game) => void
  onAddGame?: () => void
}

export function WeekSection({ weekNumber, games, isCurrentWeek, onGameClick, onEditBoxScore, onEditGame, onAddGame }: WeekSectionProps) {
  return (
    <div className={`mb-8 p-6 rounded-lg border-2 ${
      isCurrentWeek 
        ? 'border-[#D47F7D] bg-[#D47F7D]/5' 
        : 'border-[#523232]'
    }`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-2xl font-bold uppercase text-black">
            Day {weekNumber}
          </h3>
          {isCurrentWeek && (
            <span className="px-3 py-1 text-sm font-semibold bg-[#D47F7D] text-black rounded-full">
              TODAY
            </span>
          )}
        </div>
        
        {onAddGame && (
          <button
            onClick={onAddGame}
            className="flex items-center gap-2 px-4 py-2 bg-[#D47F7D] text-black rounded hover:bg-[#c66f6d] transition-colors text-sm font-semibold"
            aria-label={`Add game to day ${weekNumber}`}
          >
            <Plus size={16} />
            Add Game
          </button>
        )}
      </div>
      
      {games.length === 0 ? (
        <p className="text-[#B7853E]">No games scheduled for this day</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {games.map(game => (
            <ScheduleGameCard 
              key={game.id} 
              game={game} 
              onClick={() => onGameClick(game)}
              onEditBoxScore={onEditBoxScore ? () => onEditBoxScore(game) : undefined}
              onEditGame={onEditGame ? () => onEditGame(game) : undefined}
            />
          ))}
        </div>
      )}
    </div>
  )
}

interface ScheduleGameCardProps {
  game: Game
  onClick: () => void
  onEditBoxScore?: () => void
  onEditGame?: () => void
}

function ScheduleGameCard({ game, onClick, onEditBoxScore, onEditGame }: ScheduleGameCardProps) {
  const homeTeam = getTeamById(game.homeTeamId)
  const awayTeam = getTeamById(game.awayTeamId)
  
  if (!homeTeam || !awayTeam) return null
  
  const isCompleted = game.status === 'completed' && game.homeScore !== null && game.awayScore !== null
  
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (confirm(`Delete this game (${homeTeam.name} vs ${awayTeam.name})?`)) {
      const success = deleteLocalGame(game.id)
      if (success) {
        triggerDataRefresh()
      } else {
        alert('Failed to delete game')
      }
    }
  }
  
  return (
    <div className="relative">
      <button
        onClick={onClick}
        className="block w-full p-4 border border-[#523232] rounded-lg shadow-league hover:border-[#D47F7D] transition-colors text-left"
        aria-label={`View box score for ${homeTeam.name} vs ${awayTeam.name}`}
      >
        {/* Teams and score */}
        <div className="mb-3">
          <div className="flex justify-between items-center mb-1">
            <span className="font-semibold text-black">{homeTeam.name}</span>
            {isCompleted && (
              <span className="text-xl font-black text-[#D47F7D]">{game.homeScore}</span>
            )}
          </div>
          <div className="flex justify-between items-center">
            <span className="font-semibold text-black">{awayTeam.name}</span>
            {isCompleted && (
              <span className="text-xl font-black text-[#D47F7D]">{game.awayScore}</span>
            )}
          </div>
        </div>
        
        {/* Game details */}
        <div className="text-xs text-[#B7853E] space-y-1">
          <p>{formatDate(game.date)} • {formatTime(game.time)}</p>
          <p>{game.location}</p>
        </div>
        
        {/* Status badge */}
        <div className="mt-2">
          {isCompleted ? (
            <span className="text-xs px-2 py-1 bg-green-900/30 text-green-400 rounded">
              FINAL
            </span>
          ) : (
            <span className="text-xs px-2 py-1 bg-[#B7853E]/20 text-[#B7853E] rounded uppercase">
              {game.status}
            </span>
          )}
        </div>
        
        {/* Player of the Game Badge */}
        {game.playerOfGame && (
          <div className="mt-4 pt-4 border-t border-[#B7853E]/30">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg">
              <Image
                src="/images/puro_logo.png"
                alt="Puro"
                width={45}
                height={45}
                className="rounded-full"
              />
              <div className="flex-1">
                <p className="text-xs text-black font-bold uppercase flex items-center gap-1.5">
                  <Trophy size={13} className="text-black" />
                  Puro Man of The Match
                </p>
                <p className="text-sm font-black text-black mt-0.5">
                  #{game.playerOfGame.jerseyNumber} {game.playerOfGame.name}
                </p>
              </div>
            </div>
          </div>
        )}
      </button>
      
      {/* Admin controls */}
      {(onEditBoxScore || onEditGame) && (
        <div className="absolute top-2 right-2 flex gap-1">
          {onEditBoxScore && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEditBoxScore()
              }}
              className="p-1.5 bg-[#D47F7D]/90 hover:bg-[#D47F7D] rounded transition-colors"
              aria-label="Edit box score"
              title="Edit Box Score"
            >
              <Pencil size={14} className="text-black" />
            </button>
          )}
          {onEditGame && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEditGame()
                }}
                className="p-1.5 bg-yellow-600/90 hover:bg-yellow-600 rounded transition-colors"
                aria-label="Edit game details"
                title="Edit Game"
              >
                <Edit size={14} className="text-black" />
              </button>
              <button
                onClick={handleDelete}
                className="p-1.5 bg-red-600/90 hover:bg-red-600 rounded transition-colors"
                aria-label="Delete game"
                title="Delete Game"
              >
                <Trash2 size={14} className="text-black" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

