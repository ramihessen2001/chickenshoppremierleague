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
import { POSITIONS, FLEXIBLE } from '@/lib/positions'
import { PlayerHeadshot } from './PlayerHeadshot'
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
  /** Empty string means no age recorded -- stored as null. */
  age: string
  /** Empty string falls the profile back to a name-matched file. */
  headshotUrl: string
}

const EMPTY: PlayerFormData = {
  name: '',
  jerseyNumber: '',
  teamSlug: '',
  isActive: true,
  position: '',
  age: '',
  headshotUrl: '',
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
            age: player.age == null ? '' : String(player.age),
            headshotUrl: player.headshotUrl ?? '',
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

    let age: number | null = null
    if (formData.age.trim() !== '') {
      const parsed = Number(formData.age)
      if (!Number.isInteger(parsed) || parsed < 5 || parsed > 99) {
        setError('Age must be a whole number from 5 to 99, or blank')
        return
      }
      age = parsed
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
        age,
        headshotUrl: formData.headshotUrl.trim() || null,
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            {/* A select, not free text: the roster groups on these exact
                strings, so a typo would quietly drop the player into
                Flexible with no sign anything was wrong. */}
            <label htmlFor="player-position" className={labelClass}>
              Position
            </label>
            <select
              id="player-position"
              value={formData.position}
              onChange={(e) => update('position', e.target.value)}
              className={fieldClass}
            >
              <option value="">Not set</option>
              {POSITIONS.map((position) => (
                <option key={position} value={position}>
                  {position}
                </option>
              ))}
              <option value="Any">Any ({FLEXIBLE.toLowerCase()})</option>
            </select>
          </div>

          <div>
            <label htmlFor="player-age" className={labelClass}>
              Age <span className="font-normal text-ink-tertiary">optional</span>
            </label>
            <input
              id="player-age"
              type="number"
              inputMode="numeric"
              min={5}
              max={99}
              placeholder="From registration"
              value={formData.age}
              onChange={(e) => update('age', e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="player-headshot" className={labelClass}>
            Headshot <span className="font-normal text-ink-tertiary">optional</span>
          </label>
          <div className="flex items-center gap-3">
            <PlayerHeadshot
              name={formData.name || 'New player'}
              headshotUrl={formData.headshotUrl.trim() || null}
              size={44}
            />
            <input
              id="player-headshot"
              type="text"
              placeholder="/images/players/name.jpg"
              value={formData.headshotUrl}
              onChange={(e) => update('headshotUrl', e.target.value)}
              className={fieldClass}
            />
          </div>
          <p className="mt-1.5 font-util text-[10.5px] uppercase leading-relaxed tracking-[0.06em] text-ink-tertiary">
            Leave blank and drop the file in /public/images/players named after
            the player &mdash; it is found on its own.
          </p>
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
