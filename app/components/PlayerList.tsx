/**
 * A team's roster: shirt number, name, position.
 *
 * A plain list rather than a grid of cards -- a squad reads like a team sheet,
 * and so does the order: goalkeepers first, then out from the back. The lines
 * are not given headings; the position column already says where each player
 * plays, and the order does the grouping. See lib/positions.ts.
 */

'use client'

import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Player, displayJersey } from '@/types/player'
import { deletePlayer, notifyDataUpdated } from '@/lib/supabaseData'
import { groupByPosition } from '@/lib/positions'

interface PlayerListProps {
  players: Player[]
  onEditPlayer?: (player: Player) => void
  /** Makes the whole row a target. Omitted, the roster is plain text. */
  onSelectPlayer?: (player: Player) => void
}

/** Captain first, then by shirt number, with unnumbered (TBD) players last. */
function withinLine(a: Player, b: Player): number {
  if (Boolean(a.isCaptain) !== Boolean(b.isCaptain)) return a.isCaptain ? -1 : 1
  const aNum = a.jerseyNumber ?? Number.MAX_SAFE_INTEGER
  const bNum = b.jerseyNumber ?? Number.MAX_SAFE_INTEGER
  return aNum - bNum || a.name.localeCompare(b.name)
}

export function PlayerList({ players, onEditPlayer, onSelectPlayer }: PlayerListProps) {
  if (players.length === 0) {
    return (
      <div className="border border-hairline px-5 py-6 text-left">
        <p className="loading">No players on this roster yet</p>
      </div>
    )
  }

  // Flattened back into one list: the lines run in team-sheet order, but the
  // roster stays a single unbroken column.
  const sorted = groupByPosition(players, (p) => p.position, withinLine).flatMap(
    (line) => line.players
  )

  return (
    <ul className="border-t border-hairline">
      {sorted.map((player) => (
        <li key={player.id}>
          <PlayerRow
            player={player}
            onEdit={onEditPlayer ? () => onEditPlayer(player) : undefined}
            onSelect={onSelectPlayer ? () => onSelectPlayer(player) : undefined}
          />
        </li>
      ))}
    </ul>
  )
}

function PlayerRow({
  player,
  onEdit,
  onSelect,
}: {
  player: Player
  onEdit?: () => void
  onSelect?: () => void
}) {
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

  const nameClass = `truncate font-display text-[15px] font-bold uppercase tracking-[0.01em] ${
    player.isActive ? 'text-ink' : 'text-ink-tertiary line-through'
  }`

  return (
    <div
      className={`group relative flex items-center gap-4 border-b border-hairline py-3 transition-colors ${
        /*
         * The wash the standings rows and fixture cards already use. No border
         * or lift on hover: the row's own rule is the only line it gets, and
         * the system has no shadows to raise it with.
         */
        onSelect ? 'cursor-pointer hover:bg-ink/[0.04] focus-within:bg-ink/[0.04]' : ''
      }`}
    >
      <span
        className={`w-8 shrink-0 text-right font-util text-ink-tertiary ${
          player.jerseyNumber === null
            ? 'text-[10.5px] uppercase tracking-[0.1em]'
            : 'text-[13px]'
        }`}
      >
        {displayJersey(player.jerseyNumber)}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          {onSelect ? (
            /*
             * The name carries the click, and after:inset-0 stretches its hit
             * area over the whole row. Done this way rather than wrapping the
             * row in a button because the edit and delete controls live inside
             * it, and a button cannot contain other buttons. Those sit above
             * the overlay on z-10 so they still take their own clicks.
             */
            <button
              onClick={onSelect}
              className={`${nameClass} text-left after:absolute after:inset-0 after:content-['']`}
            >
              {player.name}
            </button>
          ) : (
            <p className={nameClass}>{player.name}</p>
          )}
          {/* Solid, because a captain is the one fixed point on a roster the
              draft fills in around them. The letter carries it too, so it
              does not depend on the fill alone. */}
          {player.isCaptain && (
            <span
              className="shrink-0 bg-ink px-1.5 py-px font-util text-[10px] font-bold uppercase tracking-[0.1em] text-ink-inverse"
              title="Team captain"
            >
              C
            </span>
          )}
        </div>
      </div>

      {player.position && (
        <span className="shrink-0 font-util text-[10.5px] uppercase tracking-[0.1em] text-ink-secondary">
          {player.position}
        </span>
      )}

      {onEdit && (
        <div className="relative z-10 flex shrink-0 gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
          <button
            onClick={onEdit}
            aria-label={`Edit ${player.name}`}
            className="p-1.5 text-ink-tertiary transition-colors hover:bg-ink/[0.06] hover:text-ink"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            aria-label={`Delete ${player.name}`}
            className="p-1.5 text-ink-tertiary transition-colors hover:bg-negative-wash hover:text-negative disabled:opacity-40"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
