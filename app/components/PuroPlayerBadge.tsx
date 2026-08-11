/**
 * PuroPlayerBadge - Displays the Puro logo next to player name
 * Used to highlight the "Puro Man of The Match"
 */

import Image from 'next/image'
import { Trophy } from 'lucide-react'

interface PuroPlayerBadgeProps {
  playerName: string
  jerseyNumber: number
  isPlayerOfGame?: boolean
  className?: string
}

export function PuroPlayerBadge({ 
  playerName, 
  jerseyNumber, 
  isPlayerOfGame = false,
  className = '' 
}: PuroPlayerBadgeProps) {
  if (!isPlayerOfGame) {
    return (
      <span className={className}>
        #{jerseyNumber} {playerName}
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="font-bold text-[#FFD700]">
        #{jerseyNumber} {playerName}
      </span>
      <Trophy size={16} className="text-[#FFD700]" />
    </span>
  )
}

