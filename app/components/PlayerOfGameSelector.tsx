/**
 * Picks the man of the match from the two teams in a game.
 *
 * Purely controlled -- it reports the selection upward and the parent saves it
 * as part of the box score. It used to write to Supabase directly on every
 * change, which both bypassed the admin check and saved even if the admin then
 * cancelled the dialog.
 */

'use client'

import { Player, displayJersey } from '@/types/player'
import { Trophy } from 'lucide-react'
import Image from 'next/image'
import { LEAGUE } from '@/config/league'

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
    <div className="bg-[#1a1a1a] border border-[#523232] rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <Image
          src={LEAGUE.manOfTheMatch.badgeImageUrl}
          alt=""
          width={40}
          height={40}
          className="rounded-full"
        />
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Trophy size={20} className="text-[#FFD700]" />
            {LEAGUE.manOfTheMatch.label}
          </h3>
          <p className="text-sm text-gray-400">
            Select the standout player from this match
          </p>
        </div>
      </div>

      <label htmlFor="player-of-game" className="sr-only">
        {LEAGUE.manOfTheMatch.label}
      </label>
      <select
        id="player-of-game"
        value={selectedPlayerId ?? ''}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={isLoading}
        className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#523232] rounded-lg text-white focus:outline-none focus:border-[#D47F7D] transition-colors disabled:opacity-60"
      >
        <option value="">
          {isLoading ? 'Loading players...' : '-- No player selected --'}
        </option>
        {players.map((player) => (
          <option key={player.id} value={player.id}>
            #{displayJersey(player.jerseyNumber)} {player.name}
            {player.position ? ` (${player.position})` : ''}
          </option>
        ))}
      </select>
    </div>
  )
}
