/**
 * Add or edit a player.
 *
 * Saves through /api/admin/players. The previous version wrote to localStorage,
 * so roster edits looked like they worked and then vanished on refresh.
 */

'use client'

import { useState, useEffect } from 'react'
import { Player } from '@/types/player'
import { X, Save } from 'lucide-react'
import { createPlayer, updatePlayer, notifyDataUpdated } from '@/lib/supabaseData'
import { useTeams } from '@/lib/teamsContext'

interface EditPlayerModalProps {
  /** Null when adding a new player. */
  player: Player | null
  isOpen: boolean
  onClose: () => void
  /** Team slug to preselect when adding. */
  defaultTeamId?: string
}

interface PlayerFormData {
  name: string
  /** Empty string means "TBD" -- stored as null. */
  jerseyNumber: string
  /** Team slug. Converted to a UUID on save. */
  teamSlug: string
  isActive: boolean
  position: string
}

const EMPTY_FORM: PlayerFormData = {
  name: '',
  jerseyNumber: '',
  teamSlug: '',
  isActive: true,
  position: '',
}

export function EditPlayerModal({
  player,
  isOpen,
  onClose,
  defaultTeamId,
}: EditPlayerModalProps) {
  const { teams, getTeam } = useTeams()
  const [formData, setFormData] = useState<PlayerFormData>(EMPTY_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    setError(null)
    const fallbackTeam = defaultTeamId || teams[0]?.slug || ''

    if (player) {
      setFormData({
        name: player.name,
        jerseyNumber:
          player.jerseyNumber === null ? '' : String(player.jerseyNumber),
        teamSlug: player.teamId || fallbackTeam,
        isActive: player.isActive,
        position: player.position ?? '',
      })
    } else {
      setFormData({ ...EMPTY_FORM, teamSlug: fallbackTeam })
    }
  }, [player, isOpen, defaultTeamId, teams])

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

  const update = <K extends keyof PlayerFormData>(
    field: K,
    value: PlayerFormData[K]
  ) => {
    setFormData((current) => ({ ...current, [field]: value }))
  }

  const handleSave = async () => {
    setError(null)

    if (!formData.name.trim()) {
      setError('Player name is required')
      return
    }

    // Blank stays blank (TBD); anything else must be a number in range.
    let jerseyNumber: number | null = null
    if (formData.jerseyNumber.trim() !== '') {
      const parsed = Number(formData.jerseyNumber)
      if (!Number.isInteger(parsed) || parsed < 0 || parsed > 999) {
        setError('Jersey number must be a whole number between 0 and 999, or blank for TBD')
        return
      }
      jerseyNumber = parsed
    }

    const team = getTeam(formData.teamSlug)
    if (!team) {
      setError('Please choose a team')
      return
    }

    setIsSaving(true)
    try {
      const fields = {
        name: formData.name.trim(),
        jerseyNumber,
        teamId: team.id, // the API expects the UUID
        position: formData.position.trim() || null,
        isActive: formData.isActive,
      }

      if (player) {
        await updatePlayer(player.id, fields)
      } else {
        await createPlayer(fields)
      }

      notifyDataUpdated()
      onClose()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to save player')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-player-title"
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

        <h2
          id="edit-player-title"
          className="text-3xl font-bold text-center uppercase text-[#D47F7D] mb-6"
        >
          {player ? 'Edit Player' : 'Add New Player'}
        </h2>

        {error && (
          <p
            className="mb-4 px-4 py-3 bg-red-950/60 border border-red-700 rounded text-red-200 text-sm"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="space-y-4">
          <div>
            <label
              htmlFor="player-name"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Player Name *
            </label>
            <input
              id="player-name"
              type="text"
              placeholder="Enter player name"
              value={formData.name}
              onChange={(e) => update('name', e.target.value)}
              className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#523232] rounded text-white focus:outline-none focus:border-[#D47F7D]"
            />
          </div>

          <div>
            <label
              htmlFor="player-jersey"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Jersey Number
            </label>
            <input
              id="player-jersey"
              type="number"
              min={0}
              max={999}
              placeholder="Leave blank for TBD"
              value={formData.jerseyNumber}
              onChange={(e) => update('jerseyNumber', e.target.value)}
              className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#523232] rounded text-white focus:outline-none focus:border-[#D47F7D]"
            />
            <p className="text-xs text-gray-400 mt-1">
              Leave blank if the number has not been assigned yet. Numbers must be
              unique within a team.
            </p>
          </div>

          <div>
            <label
              htmlFor="player-team"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Team *
            </label>
            <select
              id="player-team"
              value={formData.teamSlug}
              onChange={(e) => update('teamSlug', e.target.value)}
              className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#523232] rounded text-white focus:outline-none focus:border-[#D47F7D]"
            >
              {teams.length === 0 && <option value="">No teams yet</option>}
              {teams.map((team) => (
                <option key={team.slug} value={team.slug}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="player-position"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Position (optional)
            </label>
            <input
              id="player-position"
              type="text"
              placeholder="e.g. Forward, Midfielder, Defender, Goalkeeper"
              value={formData.position}
              onChange={(e) => update('position', e.target.value)}
              className="w-full px-4 py-2 bg-[#2a2a2a] border border-[#523232] rounded text-white focus:outline-none focus:border-[#D47F7D]"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="player-active"
              checked={formData.isActive}
              onChange={(e) => update('isActive', e.target.checked)}
              className="w-5 h-5 bg-[#2a2a2a] border border-[#523232] rounded focus:ring-[#D47F7D] focus:ring-2"
            />
            <label
              htmlFor="player-active"
              className="text-sm font-medium text-gray-300"
            >
              Player is active
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors disabled:opacity-50"
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
            {isSaving ? 'Saving...' : 'Save Player'}
          </button>
        </div>
      </div>
    </div>
  )
}
