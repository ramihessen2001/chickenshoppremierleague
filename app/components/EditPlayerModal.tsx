/**
 * EditPlayerModal - Admin interface for adding/editing players
 */

'use client'

import { useState, useEffect } from 'react'
import { Player } from '@/types/player'
import { X, Save } from 'lucide-react'
import { addLocalPlayer, updateLocalPlayer } from '@/lib/localStore'
import { triggerDataRefresh } from '@/lib/ClientDataProvider'
import { TEAMS } from '@/config/teams'

interface EditPlayerModalProps {
  player: Player | null // null for new player
  isOpen: boolean
  onClose: () => void
  defaultTeamId?: string
}

type PlayerFormData = {
  name: string
  jerseyNumber: number | 'TBD'
  teamId: string
  isActive: boolean
  position?: string
}

export function EditPlayerModal({ player, isOpen, onClose, defaultTeamId }: EditPlayerModalProps) {
  const [formData, setFormData] = useState<PlayerFormData>({
    name: '',
    jerseyNumber: 'TBD',
    teamId: defaultTeamId || TEAMS[0].id,
    isActive: true,
    position: '',
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (player && isOpen) {
      setFormData(player)
    } else if (isOpen && !player) {
      setFormData({
        name: '',
        jerseyNumber: 'TBD',
        teamId: defaultTeamId || TEAMS[0].id,
        isActive: true,
        position: '',
      })
    }
  }, [player, isOpen, defaultTeamId])

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

  const handleChange = (field: keyof PlayerFormData, value: any) => {
    setFormData({ ...formData, [field]: value })
  }

  const handleJerseyChange = (value: string) => {
    if (value === '' || value === 'TBD') {
      handleChange('jerseyNumber', 'TBD')
    } else {
      const num = parseInt(value)
      if (!isNaN(num) && num >= 0 && num <= 99) {
        handleChange('jerseyNumber', num)
      }
    }
  }

  const handleSave = async () => {
    // Validation
    if (!formData.name?.trim()) {
      alert('Player name is required')
      return
    }

    setIsSaving(true)

    try {
      let success = false

      if (player) {
        // Update existing player
        success = updateLocalPlayer(player.id, formData)
      } else {
        // Add new player
        const newPlayer: Player = {
          id: `player-${Date.now()}`,
          name: formData.name.trim(),
          jerseyNumber: formData.jerseyNumber,
          teamId: formData.teamId,
          isActive: formData.isActive,
          position: formData.position || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        success = addLocalPlayer(newPlayer)
      }

      if (!success) {
        alert('Failed to save player')
        setIsSaving(false)
        return
      }

      triggerDataRefresh()

      setTimeout(() => {
        setIsSaving(false)
        onClose()
      }, 300)
    } catch (error) {
      console.error('Error saving player:', error)
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
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border border-[#D47F7D] rounded-lg p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full transition-colors"
          aria-label="Close"
        >
          <X size={24} />
        </button>

        <h2 className="text-3xl font-bold text-center uppercase text-[#D47F7D] mb-6">
          {player ? 'Edit Player' : 'Add New Player'}
        </h2>

        <div className="space-y-4">
          {/* Player Name */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Player Name *
            </label>
            <input
              type="text"
              placeholder="Enter player name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#523232] rounded text-white focus:outline-none focus:border-[#D47F7D]"
            />
          </div>

          {/* Jersey Number */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Jersey Number
            </label>
            <input
              type="text"
              placeholder="Enter number (0-99) or leave as TBD"
              value={formData.jerseyNumber === 'TBD' ? 'TBD' : formData.jerseyNumber}
              onChange={(e) => handleJerseyChange(e.target.value)}
              className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#523232] rounded text-white focus:outline-none focus:border-[#D47F7D]"
            />
            <p className="text-xs text-gray-400 mt-1">
              Enter a number (0-99) or "TBD" if not assigned yet
            </p>
          </div>

          {/* Team */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Team *
            </label>
            <select
              value={formData.teamId}
              onChange={(e) => handleChange('teamId', e.target.value)}
              className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#523232] rounded text-white focus:outline-none focus:border-[#D47F7D]"
            >
              {TEAMS.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          {/* Position */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Position (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Forward, Midfielder, Defender, Goalkeeper"
              value={formData.position || ''}
              onChange={(e) => handleChange('position', e.target.value)}
              className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#523232] rounded text-white focus:outline-none focus:border-[#D47F7D]"
            />
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive ?? true}
              onChange={(e) => handleChange('isActive', e.target.checked)}
              className="w-5 h-5 bg-[#2a2a2a] border border-[#523232] rounded focus:ring-[#D47F7D] focus:ring-2"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-300">
              Player is Active
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-6">
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
            className="flex items-center gap-2 px-6 py-2 bg-[#D47F7D] text-white rounded hover:bg-[#c66f6d] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save size={18} />
            {isSaving ? 'Saving...' : 'Save Player'}
          </button>
        </div>
      </div>
    </div>
  )
}

