/**
 * Edit one team's row in the league table.
 *
 * Goal difference and points are shown live as the admin types, but are
 * never sent -- the server (and every reader of the table) computes them
 * from games played/wins/draws/losses/goals for/against, so there is nothing
 * here that could drift out of sync with those.
 */

'use client'

import { useEffect, useState } from 'react'
import { Standing, StandingWriteFields } from '@/types/standing'
import { updateStanding, notifyDataUpdated } from '@/lib/supabaseData'
import {
  Modal,
  FormError,
  fieldClass,
  labelClass,
  buttonPrimary,
  buttonSecondary,
} from './Modal'

interface EditStandingModalProps {
  /** Null closes the modal in practice, since a row is always chosen to open it. */
  standing: Standing | null
  isOpen: boolean
  onClose: () => void
}

interface FormState {
  gamesPlayed: string
  wins: string
  draws: string
  losses: string
  goalsFor: string
  goalsAgainst: string
}

const FIELDS: [keyof FormState, string][] = [
  ['gamesPlayed', 'Played'],
  ['wins', 'Won'],
  ['draws', 'Drawn'],
  ['losses', 'Lost'],
  ['goalsFor', 'Goals for'],
  ['goalsAgainst', 'Goals against'],
]

function toFormState(standing: Standing): FormState {
  return {
    gamesPlayed: String(standing.gamesPlayed),
    wins: String(standing.wins),
    draws: String(standing.draws),
    losses: String(standing.losses),
    goalsFor: String(standing.goalsFor),
    goalsAgainst: String(standing.goalsAgainst),
  }
}

export function EditStandingModal({ standing, isOpen, onClose }: EditStandingModalProps) {
  const [form, setForm] = useState<FormState | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen || !standing) return
    setError(null)
    setForm(toFormState(standing))
  }, [standing, isOpen])

  if (!standing || !form) return null

  const update = (field: keyof FormState, value: string) =>
    setForm((current) => (current ? { ...current, [field]: value } : current))

  const parsed = {
    gamesPlayed: Number(form.gamesPlayed),
    wins: Number(form.wins),
    draws: Number(form.draws),
    losses: Number(form.losses),
    goalsFor: Number(form.goalsFor),
    goalsAgainst: Number(form.goalsAgainst),
  }
  const isWhole = (n: number) => Number.isInteger(n) && n >= 0
  const validNumbers = Object.values(parsed).every(isWhole)
  const goalDifference = validNumbers ? parsed.goalsFor - parsed.goalsAgainst : 0
  const points = validNumbers ? parsed.wins * 3 + parsed.draws : 0

  const handleSave = async () => {
    setError(null)

    if (!validNumbers) {
      setError('Every field must be a whole number of 0 or more')
      return
    }
    if (parsed.wins + parsed.draws + parsed.losses > parsed.gamesPlayed) {
      setError('Wins + draws + losses cannot exceed games played')
      return
    }

    setIsSaving(true)
    try {
      const fields: StandingWriteFields = parsed
      await updateStanding(standing.teamId, fields)
      notifyDataUpdated()
      onClose()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit ${standing.teamName}`}
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

      <div className="grid grid-cols-3 gap-4">
        {FIELDS.map(([field, label]) => (
          <div key={field}>
            <label htmlFor={`standing-${field}`} className={labelClass}>
              {label}
            </label>
            <input
              id={`standing-${field}`}
              type="number"
              min={0}
              value={form[field]}
              onChange={(e) => update(field, e.target.value)}
              className={fieldClass}
            />
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between rounded-lg border border-hairline bg-surface-sunken px-4 py-3 text-[13px] text-ink-secondary">
        <span>
          Goal difference{' '}
          <b className="text-ink">{goalDifference > 0 ? `+${goalDifference}` : goalDifference}</b>
        </span>
        <span>
          Points <b className="text-ink">{points}</b>
        </span>
      </div>
    </Modal>
  )
}
