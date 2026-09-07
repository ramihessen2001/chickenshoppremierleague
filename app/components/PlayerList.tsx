/**
 * A team's roster: shirt number, name, position.
 *
 * A plain list rather than a grid of cards -- a squad reads like a team sheet,
 * and so does the order: goalkeepers first, then out from the back. See
 * lib/positions.ts.
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
  /** Makes each name a button. Omitted, the roster is plain text. */
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

  const lines = groupByPosition(players, (p) => p.position, withinLine)

  return (
    <div className="space-y-7">
      {lines.map((line) => (
        <section key={line.group} aria-label={line.heading}>
          <div className="flex items-baseline justify-between gap-3 border-b border-hairline-strong pb-1.5">
            <h3 className="eyebrow">{line.heading}</h3>
            <span className="tabular font-util text-[11px] text-ink-tertiary">
              {line.players.length}
            </span>
          </div>
          <ul>
            {line.players.map((player) => (
              <li key={player.id}>
                <PlayerRow
                  player={player}
                  onEdit={onEditPlayer ? () => onEditPlayer(player) : undefined}
                  onSelect={onSelectPlayer ? () => onSelectPlayer(player) : undefined}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
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
    <div className="group flex items-center gap-4 border-b border-hairline py-3">
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
            /* The whole row is not the target: the edit and delete controls
               live in it, and a row-wide click would swallow them. */
            <button
              onClick={onSelect}
              className={`${nameClass} text-left underline decoration-hairline-strong decoration-1 underline-offset-[3px] transition-colors hover:text-court hover:decoration-court`}
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

      {onEdit && (
        <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
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
