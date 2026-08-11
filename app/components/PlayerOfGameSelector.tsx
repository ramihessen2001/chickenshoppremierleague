/**
 * PlayerOfGameSelector - Component for admins to select Puro Man of The Match
 * Displays a dropdown of all players from both teams who played in the game
 */

'use client'

import { Game } from '@/types/game'
import { Player } from '@/types/player'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Trophy } from 'lucide-react'
import Image from 'next/image'

interface PlayerOfGameSelectorProps {
  game: Game
  onPlayerSelected: (playerId: string | null) => void
}

export function PlayerOfGameSelector({ game, onPlayerSelected }: PlayerOfGameSelectorProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(game.playerOfGameId || null)
  const [allPlayers, setAllPlayers] = useState<Player[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch all players from both teams
  useEffect(() => {
    async function fetchPlayers() {
      try {
        // Get team slugs from the game object
        const homeTeamSlug = game.homeTeamId
        const awayTeamSlug = game.awayTeamId

        if (!homeTeamSlug || !awayTeamSlug) {
          console.error('Team IDs not found in game')
          setIsLoading(false)
          return
        }

        // First, get the team UUIDs from the teams table using slugs
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('id, slug')
          .in('slug', [homeTeamSlug, awayTeamSlug])

        if (teamsError) throw teamsError

        if (!teamsData || teamsData.length < 2) {
          console.error('Could not find teams in database')
          setIsLoading(false)
          return
        }

        const teamUUIDs = teamsData.map(t => t.id)

        // Now fetch players from both teams using the UUIDs
        const { data, error } = await supabase
          .from('players')
          .select(`
            id,
            name,
            jersey_number,
            position,
            is_active,
            created_at,
            updated_at,
            team_id,
            team:teams(id, name, slug)
          `)
          .in('team_id', teamUUIDs)
          .eq('is_active', true)
          .order('name')

        if (error) throw error

        const players: Player[] = data.map((p: any) => ({
          id: p.id,
          name: p.name,
          jerseyNumber: p.jersey_number,
          teamId: p.team?.slug || '',
          position: p.position,
          isActive: p.is_active,
          createdAt: p.created_at,
          updatedAt: p.updated_at
        }))

        setAllPlayers(players)
      } catch (error) {
        console.error('Error fetching players:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlayers()
  }, [game])

  const handlePlayerChange = async (playerId: string | null) => {
    setSelectedPlayerId(playerId)
    
    try {
      console.log('Updating player of game:', { gameId: game.id, playerId })
      
      // Update the database
      const { data, error } = await supabase
        .from('games')
        .update({ player_of_game_id: playerId })
        .eq('id', game.id)
        .select()

      if (error) {
        console.error('Supabase error details:', error)
        throw error
      }

      console.log('Update successful:', data)
      onPlayerSelected(playerId)
      
      // Dispatch event to refresh data
      window.dispatchEvent(new Event('dataUpdated'))
    } catch (error: any) {
      console.error('Error updating player of game:', error)
      alert(`Failed to update Player of the Game: ${error.message || 'Unknown error'}`)
    }
  }

  if (isLoading) {
    return (
      <div className="text-gray-400 text-sm">
        Loading players...
      </div>
    )
  }

  return (
    <div className="bg-[#1a1a1a] border border-[#523232] rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <Image
          src="/images/puro_logo.png"
          alt="Puro Logo"
          width={40}
          height={40}
          className="rounded-full"
        />
        <div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Trophy size={20} className="text-[#FFD700]" />
            Puro Man of The Match
          </h3>
          <p className="text-sm text-gray-400">Select the standout player from this match</p>
        </div>
      </div>

      <select
        value={selectedPlayerId || ''}
        onChange={(e) => handlePlayerChange(e.target.value || null)}
        className="w-full px-4 py-3 bg-[#0a0a0a] border border-[#523232] rounded-lg text-white focus:outline-none focus:border-[#D47F7D] transition-colors"
      >
        <option value="">-- No Player Selected --</option>
        {allPlayers.map((player) => (
          <option key={player.id} value={player.id}>
            #{player.jerseyNumber} {player.name} {player.position ? `(${player.position})` : ''}
          </option>
        ))}
      </select>

      {selectedPlayerId && (
        <div className="mt-3 text-sm text-gray-400">
          <p>✓ Player of the Game selected! They will be highlighted with the Puro logo.</p>
        </div>
      )}
    </div>
  )
}

