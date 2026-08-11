/**
 * A player's name, with a small marker when they were man of the match.
 *
 * The shirt number is rendered by the caller in its own column, so this shows
 * the name alone -- previously both printed the number and the box score showed
 * it twice on the same line.
 */

import { Star } from 'lucide-react'

interface PuroPlayerBadgeProps {
  playerName: string
  /** Accepted for call-site symmetry; the number is displayed by the caller. */
  jerseyNumber?: number | null
  isPlayerOfGame?: boolean
  className?: string
}

export function PuroPlayerBadge({
  playerName,
  isPlayerOfGame = false,
  className = '',
}: PuroPlayerBadgeProps) {
  if (!isPlayerOfGame) {
    return <span className={className}>{playerName}</span>
  }

  return (
    <span className={`inline-flex items-baseline gap-1.5 ${className}`}>
      <span className="font-medium text-ink">{playerName}</span>
      <Star
        size={12}
        className="shrink-0 translate-y-px fill-gold text-gold"
        aria-label="Man of the match"
      />
    </span>
  )
}
