/**
 * Picks the man of the match from the two teams in a game.
 *
 * Controlled: it reports the selection upward and the parent saves it with the
 * rest of the box score.
 */

'use client'

import Image from 'next/image'
import { Player, displayJersey } from '@/types/player'
import { LEAGUE } from '@/config/league'
import { fieldClass } from './Modal'

interface PlayerOfGameSelectorProps {
  /** Candidates, normally the players of both teams in the game. */
  players: Player[]
  selectedPlayerId: string | null
  onChange: (playerId: string | null) => void
  isLoading?: boolean
}

export function PlayerOfGameSelector({
  players,
  selectedPlayerId,
  onChange,
  isLoading = false,
}: PlayerOfGameSelectorProps) {
  return (
    <div className="rounded-lg border border-hairline bg-surface-sunken px-5 py-5">
      <div className="flex items-center gap-3">
        <Image
          src={LEAGUE.manOfTheMatch.badgeImageUrl}
          alt=""
          width={28}
          height={28}
          className="h-7 w-7 shrink-0 rounded-full object-contain"
        />
        <label
          htmlFor="player-of-game"
          className="text-[15px] font-semibold text-ink"
        >
          {LEAGUE.manOfTheMatch.label}
        </label>
      </div>

      <select
        id="player-of-game"
        value={selectedPlayerId ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={isLoading}
        className={`${fieldClass} mt-3`}
      >
        <option value="">{isLoading ? 'Loading players…' : 'Nobody selected'}</option>
        {players.map((player) => (
          <option key={player.id} value={player.id}>
            {displayJersey(player.jerseyNumber)} · {player.name}
            {player.position ? ` (${player.position})` : ''}
          </option>
        ))}
      </select>
    </div>
  )
}
