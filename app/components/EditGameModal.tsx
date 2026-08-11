/**
 * EditGameModal - Admin interface for adding/editing games
 */

'use client'

import { useState, useEffect } from 'react'
import { Game, GameStatus } from '@/types/game'
import { X, Save } from 'lucide-react'
import { updateGame, createGame, getTeams, getAllGames } from '@/lib/supabaseData'
import { TEAMS } from '@/config/teams'

interface EditGameModalProps {
  game: Game | null // null for new game
  isOpen: boolean
  onClose: () => void
  defaultWeek?: number
}

export function EditGameModal({ game, isOpen, onClose, defaultWeek }: EditGameModalProps) {
  const [formData, setFormData] = useState<Partial<Game>>({
    weekNumber: defaultWeek || 1,
    date: '',
    time: '',
    location: '',
    homeTeamId: TEAMS[0].id,
    awayTeamId: TEAMS[1].id,
    status: 'scheduled',
    homeScore: null,
    awayScore: null,
  })
  const [isSaving, setIsSaving] = useState(false)
  const [supabaseTeams, setSupabaseTeams] = useState<any[]>([])
  
  // Load teams from Supabase
  useEffect(() => {
    async function loadTeams() {
      const teams = await getTeams()
      setSupabaseTeams(teams)
    }
    if (isOpen) {
      loadTeams()
    }
  }, [isOpen])

  useEffect(() => {
    if (game && isOpen) {
      setFormData(game)
    } else if (isOpen && !game) {
      // Reset for new game
      setFormData({
        weekNumber: defaultWeek || 1,
        date: '',
        time: '',
        location: '',
        homeTeamId: TEAMS[0].id,
        awayTeamId: TEAMS[1].id,
        status: 'scheduled',
        homeScore: null,
        awayScore: null,
      })
    }
  }, [game, isOpen, defaultWeek])

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

  if (!isOpen) return null

  const handleChange = (field: keyof Game, value: any) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleSave = async () => {
    // Validation
    if (!formData.date || !formData.time || !formData.location) {
      alert('Please fill in all required fields')
      return
    }

    if (formData.homeTeamId === formData.awayTeamId) {
      alert('Home and away teams must be different')
      return
    }

    setIsSaving(true)

    try {
      let success = false

      // Find team UUIDs from slugs
      const homeTeam = supabaseTeams.find(t => t.slug === formData.homeTeamId)
      const awayTeam = supabaseTeams.find(t => t.slug === formData.awayTeamId)

      if (!homeTeam || !awayTeam) {
        alert('Invalid team selection')
        setIsSaving(false)
        return
      }

      if (game) {
        // Update existing game
        success = await updateGame(game.id, {
          weekNumber: formData.weekNumber,
          date: formData.date,
          time: formData.time,
          location: formData.location,
          homeTeamId: homeTeam.id, // Use UUID
          awayTeamId: awayTeam.id, // Use UUID
          homeScore: formData.homeScore,
          awayScore: formData.awayScore,
          status: formData.status as GameStatus
        })
      } else {
        // Create new game - need to get next game number
        const allGames = await getAllGames()
        const maxGameNumber = allGames.reduce((max, g) => {
          const num = parseInt(g.id.replace('game-', ''))
          return isNaN(num) ? max : Math.max(max, num)
        }, 0)
        
        const gameId = await createGame({
          gameNumber: maxGameNumber + 1,
          weekNumber: formData.weekNumber!,
          date: formData.date!,
          time: formData.time!,
          location: formData.location!,
          homeTeamId: homeTeam.id, // Use UUID
          awayTeamId: awayTeam.id, // Use UUID
          homeScore: formData.homeScore,
          awayScore: formData.awayScore,
          status: formData.status as GameStatus
        })
        
        success = !!gameId
      }

      if (!success) {
        alert('Failed to save game')
        setIsSaving(false)
        return
      }

      // Trigger refresh by dispatching custom event
      window.dispatchEvent(new Event('dataUpdated'))

      setTimeout(() => {
        setIsSaving(false)
        onClose()
      }, 300)
    } catch (error) {
      console.error('Error saving game:', error)
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
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border border-[#D47F7D] rounded-lg p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-black hover:bg-white/10 rounded-full transition-colors"
          aria-label="Close"
        >
          <X size={24} />
        </button>

        <h2 className="text-3xl font-bold text-center uppercase text-[#D47F7D] mb-6">
          {game ? 'Edit Game' : 'Add New Game'}
        </h2>

        <div className="space-y-4">
          {/* Day Number */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Day Number *
            </label>
            <input
              type="number"
              min="1"
              max="12"
              value={formData.weekNumber}
              onChange={(e) => handleChange('weekNumber', parseInt(e.target.value) || 1)}
              className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#523232] rounded text-black focus:outline-none focus:border-[#D47F7D]"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Date *
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#523232] rounded text-black focus:outline-none focus:border-[#D47F7D]"
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Time *
            </label>
            <input
              type="text"
              placeholder="e.g., 10:00 AM"
              value={formData.time}
              onChange={(e) => handleChange('time', e.target.value)}
              className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#523232] rounded text-black focus:outline-none focus:border-[#D47F7D]"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Location *
            </label>
            <input
              type="text"
              placeholder="e.g., Main Field"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#523232] rounded text-black focus:outline-none focus:border-[#D47F7D]"
            />
          </div>

          {/* Teams */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Home Team *
              </label>
              <select
                value={formData.homeTeamId}
                onChange={(e) => handleChange('homeTeamId', e.target.value)}
                className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#523232] rounded text-black focus:outline-none focus:border-[#D47F7D]"
              >
                {TEAMS.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Away Team *
              </label>
              <select
                value={formData.awayTeamId}
                onChange={(e) => handleChange('awayTeamId', e.target.value)}
                className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#523232] rounded text-black focus:outline-none focus:border-[#D47F7D]"
              >
                {TEAMS.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#523232] rounded text-black focus:outline-none focus:border-[#D47F7D]"
            >
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="postponed">Postponed</option>
            </select>
          </div>

          {/* Scores (optional) */}
          {formData.status === 'completed' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Home Score
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.homeScore ?? ''}
                  onChange={(e) => handleChange('homeScore', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#523232] rounded text-black focus:outline-none focus:border-[#D47F7D]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Away Score
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.awayScore ?? ''}
                  onChange={(e) => handleChange('awayScore', e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#523232] rounded text-black focus:outline-none focus:border-[#D47F7D]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-black rounded hover:bg-gray-700 transition-colors"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2 bg-[#D47F7D] text-black rounded hover:bg-[#c66f6d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            {isSaving ? 'Saving...' : 'Save Game'}
          </button>
        </div>
      </div>
    </div>
  )
}

