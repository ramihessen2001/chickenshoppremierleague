/**
 * A team's roster: shirt number, name, position.
 *
 * A plain list rather than a grid of cards -- a squad reads like a team sheet.
 */

'use client'

import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Player, displayJersey } from '@/types/player'
import { deletePlayer, notifyDataUpdated } from '@/lib/supabaseData'

interface PlayerListProps {
  players: Player[]
  onEditPlayer?: (player: Player) => void
}

export function PlayerList({ players, onEditPlayer }: PlayerListProps) {
  if (players.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-hairline-strong px-6 py-14 text-center">
        <p className="text-[15px] text-ink-secondary">No players on this roster yet.</p>
      </div>
    )
  }

  // Numbered players first in ascending order, unnumbered (TBD) last.
  const sorted = [...players].sort((a, b) => {
    const aNum = a.jerseyNumber ?? Number.MAX_SAFE_INTEGER
    const bNum = b.jerseyNumber ?? Number.MAX_SAFE_INTEGER
    return aNum - bNum || a.name.localeCompare(b.name)
  })

  return (
    <ul className="border-t border-hairline">
      {sorted.map((player) => (
        <li key={player.id}>
          <PlayerRow
            player={player}
            onEdit={onEditPlayer ? () => onEditPlayer(player) : undefined}
          />
        </li>
      ))}
    </ul>
  )
}

function PlayerRow({ player, onEdit }: { player: Player; onEdit?: () => void }) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm(`Delete ${player.name}? This also removes their statistics.`)) return

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
    <div className="group flex items-center gap-4 border-b border-hairline py-3">
      <span
        className={`tabular w-8 shrink-0 text-[15px] ${
          player.jerseyNumber === null
            ? 'text-[11px] font-medium uppercase tracking-wider text-ink-tertiary'
            : 'font-semibold text-ink-tertiary'
        }`}
      >
        {displayJersey(player.jerseyNumber)}
      </span>

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-[15px] ${
            player.isActive ? 'text-ink' : 'text-ink-tertiary line-through'
          }`}
        >
          {player.name}
        </p>
      </div>

      {player.position && (
        <span className="shrink-0 text-[13px] text-ink-tertiary">{player.position}</span>
      )}

      {onEdit && (
        <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          <button
            onClick={onEdit}
            aria-label={`Edit ${player.name}`}
            className="rounded-md p-1.5 text-ink-tertiary transition-colors hover:bg-surface-sunken hover:text-ink"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            aria-label={`Delete ${player.name}`}
            className="rounded-md p-1.5 text-ink-tertiary transition-colors hover:bg-negative-wash hover:text-negative disabled:opacity-40"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
