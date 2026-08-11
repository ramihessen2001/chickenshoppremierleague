/**
 * Add or edit a player.
 *
 * Saves through /api/admin/players. Jersey numbers are unique within a team;
 * leaving the field blank stores null, which reads as "TBD".
 */

'use client'

import { useState, useEffect } from 'react'
import { Player } from '@/types/player'
import { createPlayer, updatePlayer, notifyDataUpdated } from '@/lib/supabaseData'
import { useTeams } from '@/lib/teamsContext'
import {
  Modal,
  FormError,
  fieldClass,
  labelClass,
  buttonPrimary,
  buttonSecondary,
} from './Modal'

interface EditPlayerModalProps {
  /** Null when adding. */
  player: Player | null
  isOpen: boolean
  onClose: () => void
  /** Team slug to preselect when adding. */
  defaultTeamId?: string
}

interface PlayerFormData {
  name: string
  /** Empty string means TBD -- stored as null. */
  jerseyNumber: string
  /** Team slug; converted to a UUID on save. */
  teamSlug: string
  isActive: boolean
  position: string
}

const EMPTY: PlayerFormData = {
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
  const [formData, setFormData] = useState<PlayerFormData>(EMPTY)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return

    setError(null)
    const fallbackTeam = defaultTeamId || teams[0]?.slug || ''

    setFormData(
      player
        ? {
            name: player.name,
            jerseyNumber:
              player.jerseyNumber === null ? '' : String(player.jerseyNumber),
            teamSlug: player.teamId || fallbackTeam,
            isActive: player.isActive,
            position: player.position ?? '',
          }
        : { ...EMPTY, teamSlug: fallbackTeam }
    )
  }, [player, isOpen, defaultTeamId, teams])

  const update = <K extends keyof PlayerFormData>(
    field: K,
    value: PlayerFormData[K]
  ) => setFormData((current) => ({ ...current, [field]: value }))

  const handleSave = async () => {
    setError(null)

    if (!formData.name.trim()) {
      setError('Player name is required')
      return
    }

    let jerseyNumber: number | null = null
    if (formData.jerseyNumber.trim() !== '') {
      const parsed = Number(formData.jerseyNumber)
      if (!Number.isInteger(parsed) || parsed < 0 || parsed > 999) {
        setError('Jersey number must be a whole number from 0 to 999, or blank for TBD')
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
        teamId: team.id,
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={player ? 'Edit player' : 'Add player'}
      size="sm"
      footer={
        <>
          <button onClick={onClose} disabled={isSaving} className={buttonSecondary}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={isSaving} className={buttonPrimary}>
            {isSaving ? 'Saving…' : 'Save'}
          </button>
        </>
      }
    >
      <FormError>{error}</FormError>

      <div className="space-y-5">
        <div>
          <label htmlFor="player-name" className={labelClass}>
            Name
          </label>
          <input
            id="player-name"
            type="text"
            value={formData.name}
            onChange={(e) => update('name', e.target.value)}
            className={fieldClass}
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="player-jersey" className={labelClass}>
              Number
            </label>
            <input
              id="player-jersey"
              type="number"
              min={0}
              max={999}
              placeholder="TBD"
              value={formData.jerseyNumber}
              onChange={(e) => update('jerseyNumber', e.target.value)}
              className={fieldClass}
            />
            <p className="mt-1.5 text-[12px] text-ink-tertiary">
              Blank if unassigned
            </p>
          </div>

          <div>
            <label htmlFor="player-team" className={labelClass}>
              Team
            </label>
            <select
              id="player-team"
              value={formData.teamSlug}
              onChange={(e) => update('teamSlug', e.target.value)}
              className={fieldClass}
            >
              {teams.length === 0 && <option value="">No teams yet</option>}
              {teams.map((team) => (
                <option key={team.slug} value={team.slug}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="player-position" className={labelClass}>
            Position <span className="font-normal text-ink-tertiary">optional</span>
          </label>
          <input
            id="player-position"
            type="text"
            placeholder="Forward, Midfielder, Defender, Goalkeeper"
            value={formData.position}
            onChange={(e) => update('position', e.target.value)}
            className={fieldClass}
          />
        </div>

        <label className="flex items-center gap-2.5 text-[14px] text-ink">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => update('isActive', e.target.checked)}
            className="h-4 w-4 rounded border-hairline-strong accent-[color:var(--ink)]"
          />
          Active on the roster
        </label>
      </div>
    </Modal>
  )
}
