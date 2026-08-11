/**
 * EditBoxScoreModal - Admin interface for editing game box scores
 * Now saves to Supabase database
 */

'use client'

import { useState, useEffect } from 'react'
import { Game } from '@/types/game'
import { GameStatistic, StatType } from '@/types/statistic'
import { Player } from '@/types/player'
import { X, Plus, Trash2, Save } from 'lucide-react'
import { getAllPlayers, updateGameScores, deleteAllGameStatistics, insertGameStatistic } from '@/lib/supabaseData'
import { PlayerOfGameSelector } from './PlayerOfGameSelector'
import { getTeamById } from '@/config/teams'

interface EditBoxScoreModalProps {
  game: Game | null
  isOpen: boolean
  onClose: () => void
  onSave?: () => void
}

const STAT_TYPES: { value: StatType; label: string }[] = [
  { value: 'goal', label: 'Goal' },
  { value: 'assist', label: 'Assist' },
  { value: 'save', label: 'Save' },
  { value: 'yellow_card', label: 'Yellow Card' },
  { value: 'red_card', label: 'Red Card' },
  { value: 'blue_card', label: 'Blue Card' },
]

export function EditBoxScoreModal({ game, isOpen, onClose, onSave }: EditBoxScoreModalProps) {
  const [homeScore, setHomeScore] = useState(0)
  const [awayScore, setAwayScore] = useState(0)
  const [statistics, setStatistics] = useState<GameStatistic[]>([])
  const [allPlayers, setAllPlayers] = useState<(Player & { teamUUID?: string })[]>([])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (game && isOpen) {
      setHomeScore(game.homeScore ?? 0)
      setAwayScore(game.awayScore ?? 0)
      setStatistics(game.statistics || [])
      
      // Load ALL players from Supabase
      const loadAllPlayers = async () => {
        try {
          const players = await getAllPlayers()
          console.log('Loaded players from Supabase:', players.length)
          setAllPlayers(players)
        } catch (error) {
          console.error('Error loading players:', error)
        }
      }
      
      loadAllPlayers()
    }
  }, [game, isOpen])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])
  
  // Recalculate scores when statistics change on initial load
  useEffect(() => {
    if (statistics.length > 0 && game) {
      // Calculate scores from goal statistics
      let homeGoals = 0
      let awayGoals = 0
      
      statistics.forEach(stat => {
        if (stat.type === 'goal') {
          if (stat.teamId === game.homeTeamId) {
            homeGoals += stat.count || 1
          } else if (stat.teamId === game.awayTeamId) {
            awayGoals += stat.count || 1
          }
        }
      })
      
      setHomeScore(homeGoals)
      setAwayScore(awayGoals)
    }
  }, [statistics.length, game?.homeTeamId, game?.awayTeamId])

  if (!isOpen || !game) return null

  // Get team names
  const homeTeam = getTeamById(game.homeTeamId)
  const awayTeam = getTeamById(game.awayTeamId)

  // Filter players by team
  const homeTeamPlayers = allPlayers.filter(p => p.teamId === game.homeTeamId)
  const awayTeamPlayers = allPlayers.filter(p => p.teamId === game.awayTeamId)

  const addStatistic = () => {
    // Find the first available player from either team
    const firstPlayer = homeTeamPlayers[0] || awayTeamPlayers[0]
    
    if (!firstPlayer) {
      alert('No active players found for either team')
      return
    }
    
    const newStat: GameStatistic = {
      id: `stat-${Date.now()}`,
      gameId: game.id,
      playerId: firstPlayer.id,
      teamId: firstPlayer.teamId,
      type: 'goal',
      count: 1,
      createdAt: new Date().toISOString(),
    }
    
    const updated = [...statistics, newStat]
    setStatistics(updated)
    
    // Auto-calculate scores from goals
    if (!game) return
    
    let homeGoals = 0
    let awayGoals = 0
    
    updated.forEach(stat => {
      if (stat.type === 'goal') {
        if (stat.teamId === game.homeTeamId) {
          homeGoals += stat.count || 1
        } else if (stat.teamId === game.awayTeamId) {
          awayGoals += stat.count || 1
        }
      }
    })
    
    setHomeScore(homeGoals)
    setAwayScore(awayGoals)
  }

  const updateStatistic = (index: number, field: keyof GameStatistic, value: any) => {
    const updated = [...statistics]
    updated[index] = { ...updated[index], [field]: value }
    
    // Update teamId when playerId changes
    if (field === 'playerId') {
      const player = allPlayers.find(p => p.id === value)
      if (player) {
        updated[index].teamId = player.teamId
      }
    }
    
    setStatistics(updated)
    
    // Auto-calculate scores from goals
    if (!game) return
    
    let homeGoals = 0
    let awayGoals = 0
    
    updated.forEach(stat => {
      if (stat.type === 'goal') {
        if (stat.teamId === game.homeTeamId) {
          homeGoals += stat.count || 1
        } else if (stat.teamId === game.awayTeamId) {
          awayGoals += stat.count || 1
        }
      }
    })
    
    setHomeScore(homeGoals)
    setAwayScore(awayGoals)
  }

  const deleteStatistic = (index: number) => {
    const updated = statistics.filter((_, i) => i !== index)
    setStatistics(updated)
    
    // Auto-calculate scores from goals
    if (!game) return
    
    let homeGoals = 0
    let awayGoals = 0
    
    updated.forEach(stat => {
      if (stat.type === 'goal') {
        if (stat.teamId === game.homeTeamId) {
          homeGoals += stat.count || 1
        } else if (stat.teamId === game.awayTeamId) {
          awayGoals += stat.count || 1
        }
      }
    })
    
    setHomeScore(homeGoals)
    setAwayScore(awayGoals)
  }

  const handleSave = async () => {
    if (!game) return
    
    setIsSaving(true)
    
    try {
      // Save game scores to Supabase
      const scoresSuccess = await updateGameScores(game.id, homeScore, awayScore, 'completed')
      
      if (!scoresSuccess) {
        alert('Failed to update game scores')
        setIsSaving(false)
        return
      }
      
      // Delete all existing statistics for this game
      const deleteSuccess = await deleteAllGameStatistics(game.id)
      
      if (!deleteSuccess) {
        alert('Failed to delete old statistics')
        setIsSaving(false)
        return
      }
      
      // Insert new statistics
      for (const stat of statistics) {
        // Find the player to get their team UUID
        const player = allPlayers.find(p => p.id === stat.playerId)
        const teamUUID = player?.teamUUID
        
        if (!teamUUID) {
          console.error(`Could not find team UUID for player ${stat.playerId}`)
          continue
        }
        
        const insertSuccess = await insertGameStatistic(
          game.id,
          stat.playerId,
          teamUUID, // Use UUID for database
          stat.type,
          stat.count || 1
        )
        
        if (!insertSuccess) {
          console.error(`Failed to insert statistic for player ${stat.playerId}`)
        }
      }
      
      // Trigger refresh by dispatching custom event
      window.dispatchEvent(new Event('dataUpdated'))
      
      // Call onSave callback if provided
      onSave?.()
      
      // Close modal
      setTimeout(() => {
        setIsSaving(false)
        onClose()
      }, 300)
    } catch (error) {
      console.error('Error saving box score:', error)
      alert('An error occurred while saving')
      setIsSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-box-score-title"
    >
      <div
        className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border border-[#D47F7D] rounded-lg p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
          aria-label="Close edit box score"
        >
          <X size={24} />
        </button>

        <h2 id="edit-box-score-title" className="text-3xl font-bold text-center uppercase text-[#D47F7D] mb-6">
          Edit Box Score
        </h2>

        {/* Score Editing */}
        <div className="bg-[#2a2a2a] p-6 rounded-lg mb-6 border border-[#444444]">
          <h3 className="text-xl font-bold text-white mb-4">Final Score</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                {homeTeam?.name || 'Home Team'} Score
              </label>
              <input
                type="number"
                min="0"
                value={homeScore}
                onChange={(e) => setHomeScore(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#523232] rounded text-white text-2xl font-bold text-center focus:outline-none focus:border-[#D47F7D]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">
                {awayTeam?.name || 'Away Team'} Score
              </label>
              <input
                type="number"
                min="0"
                value={awayScore}
                onChange={(e) => setAwayScore(parseInt(e.target.value) || 0)}
                className="w-full px-4 py-2 bg-[#1a1a1a] border border-[#523232] rounded text-white text-2xl font-bold text-center focus:outline-none focus:border-[#D47F7D]"
              />
            </div>
          </div>
        </div>

        {/* Statistics Editing */}
        <div className="bg-[#2a2a2a] p-6 rounded-lg mb-6 border border-[#444444]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Game Statistics</h3>
            <button
              onClick={addStatistic}
              className="flex items-center gap-2 px-4 py-2 bg-[#D47F7D] text-black rounded hover:bg-[#c66f6d] transition-colors"
            >
              <Plus size={16} />
              Add Statistic
            </button>
          </div>

          {statistics.length > 0 && (
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 mb-2 px-3 text-xs text-gray-300 uppercase font-semibold">
              <div>Player</div>
              <div className="w-40">Stat Type</div>
              <div className="w-20 text-center">Count</div>
              <div className="w-10"></div>
            </div>
          )}
          
          <div className="space-y-3">
            {statistics.map((stat, index) => (
              <div key={stat.id} className="flex items-center gap-3 bg-[#1a1a1a] p-3 rounded border border-[#333333]">
                <select
                  value={stat.playerId}
                  onChange={(e) => updateStatistic(index, 'playerId', e.target.value)}
                  className="flex-1 px-3 py-2 bg-[#2a2a2a] border border-[#523232] rounded text-white focus:outline-none focus:border-[#D47F7D]"
                >
                  {homeTeamPlayers.length > 0 && (
                    <optgroup label={`${homeTeam?.name || 'Home Team'}`}>
                      {homeTeamPlayers.map(p => (
                        <option key={p.id} value={p.id}>
                          #{p.jerseyNumber} {p.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {awayTeamPlayers.length > 0 && (
                    <optgroup label={`${awayTeam?.name || 'Away Team'}`}>
                      {awayTeamPlayers.map(p => (
                        <option key={p.id} value={p.id}>
                          #{p.jerseyNumber} {p.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>

                <select
                  value={stat.type}
                  onChange={(e) => updateStatistic(index, 'type', e.target.value as StatType)}
                  className="w-40 px-3 py-2 bg-[#2a2a2a] border border-[#523232] rounded text-white focus:outline-none focus:border-[#D47F7D]"
                >
                  {STAT_TYPES.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  value={stat.count || 1}
                  onChange={(e) => updateStatistic(index, 'count', parseInt(e.target.value) || 1)}
                  className="w-20 px-3 py-2 bg-[#2a2a2a] border border-[#523232] rounded text-white text-center focus:outline-none focus:border-[#D47F7D]"
                  title="Count (e.g., 2 if player scored 2 goals)"
                  placeholder="1"
                />

                <button
                  onClick={() => deleteStatistic(index)}
                  className="p-2 text-red-400 hover:bg-red-400/10 rounded transition-colors"
                  aria-label="Delete statistic"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            
            {statistics.length === 0 && (
              <p className="text-gray-300 text-center py-4">
                No statistics added yet. Click "Add Statistic" to begin.
              </p>
            )}
          </div>
        </div>

        {/* Player of the Game Selection */}
        <div className="mb-6">
          <PlayerOfGameSelector
            game={game}
            onPlayerSelected={(playerId) => {
              // Optional: Update local state if needed
              console.log('Player of Game selected:', playerId)
            }}
          />
        </div>

        {/* Save Button */}
        <div className="flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-[#D47F7D] text-black font-semibold rounded hover:bg-[#c66f6d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

