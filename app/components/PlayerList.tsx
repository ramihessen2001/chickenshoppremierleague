/**
 * A team's roster.
 */

'use client'

import { useState } from 'react'
import { Player, displayJersey } from '@/types/player'
import { Pencil, Trash2 } from 'lucide-react'
import { deletePlayer, notifyDataUpdated } from '@/lib/supabaseData'

interface PlayerListProps {
  players: Player[]
  onEditPlayer?: (player: Player) => void
}

export function PlayerList({ players, onEditPlayer }: PlayerListProps) {
  if (players.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No players found for this team.</p>
      </div>
    )
  }
  
  // Numbered players first, ascending; unnumbered (TBD) players last.
  const sortedPlayers = [...players].sort((a, b) => {
    const aNum = a.jerseyNumber ?? Number.MAX_SAFE_INTEGER
    const bNum = b.jerseyNumber ?? Number.MAX_SAFE_INTEGER
    return aNum - bNum || a.name.localeCompare(b.name)
  })
  
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sortedPlayers.map(player => (
        <PlayerCard 
          key={player.id} 
          player={player}
          onEdit={onEditPlayer ? () => onEditPlayer(player) : undefined}
        />
      ))}
    </div>
  )
}

interface PlayerCardProps {
  player: Player
  onEdit?: () => void
}

function PlayerCard({ player, onEdit }: PlayerCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const displayNumber = displayJersey(player.jerseyNumber)

  const handleDelete = async () => {
    if (!confirm(`Delete player ${player.name}? This also removes their statistics.`)) {
      return
    }

    setIsDeleting(true)
    try {
      await deletePlayer(player.id)
      notifyDataUpdated()
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to delete player')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="relative p-4 border border-[#523232] rounded-lg shadow-league hover:border-[#D47F7D] transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-lg font-semibold text-white">{player.name}</p>
          {player.position && (
            <p className="text-sm text-gray-400 mt-1">{player.position}</p>
          )}
          {!player.isActive && (
            <p className="text-xs text-red-400 mt-1">INACTIVE</p>
          )}
        </div>
        <div className="ml-4">
          <span className="text-3xl font-black text-[#D47F7D]">
            {displayNumber}
          </span>
        </div>
      </div>
      
      {/* Admin controls */}
      {onEdit && (
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 bg-[#D47F7D]/90 hover:bg-[#D47F7D] rounded transition-colors"
            aria-label="Edit player"
            title="Edit Player"
          >
            <Pencil size={14} className="text-white" />
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-1.5 bg-red-600/90 hover:bg-red-600 rounded transition-colors disabled:opacity-50"
            aria-label="Delete player"
            title="Delete Player"
          >
            <Trash2 size={14} className="text-white" />
          </button>
        </div>
      )}
    </div>
  )
}

