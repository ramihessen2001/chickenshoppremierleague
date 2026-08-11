/**
 * Add or edit a game.
 *
 * Teams come from the teams context, so the dropdowns follow whatever teams the
 * league actually has. Game numbers are assigned by the server on create.
 */

'use client'

import { useState, useEffect } from 'react'
import { Game, GameStatus } from '@/types/game'
import { updateGame, createGame, notifyDataUpdated } from '@/lib/supabaseData'
import { useTeams } from '@/lib/teamsContext'
import { youTubeVideoId } from '@/lib/youtube'
import {
  Modal,
  FormError,
  fieldClass,
  labelClass,
  buttonPrimary,
  buttonSecondary,
} from './Modal'

interface EditGameModalProps {
  /** Null when adding. */
  game: Game | null
  isOpen: boolean
  onClose: () => void
  defaultWeek?: number
}

interface GameFormData {
  weekNumber: number
  date: string
  time: string
  location: string
  /** Team slugs; converted to UUIDs on save. */
  homeTeamSlug: string
  awayTeamSlug: string
  status: GameStatus
  homeScore: string
  awayScore: string
  isPlayoff: boolean
  playoffRound: string
  streamUrl: string
}

const PLAYOFF_ROUNDS = [
  ['play-in', 'Play-in'],
  ['quarterfinal', 'Quarterfinal'],
  ['semifinal', 'Semifinal'],
  ['final', 'Final'],
]

const STATUSES: [GameStatus, string][] = [
  ['scheduled', 'Scheduled'],
  ['in_progress', 'In progress'],
  ['completed', 'Completed'],
  ['postponed', 'Postponed'],
  ['cancelled', 'Cancelled'],
]

export function EditGameModal({
  game,
  isOpen,
  onClose,
  defaultWeek,
}: EditGameModalProps) {
  const { teams, getTeam } = useTeams()
  const [formData, setFormData] = useState<GameFormData | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setError(null)

    setFormData(
      game
        ? {
            weekNumber: game.weekNumber,
            date: game.date,
            time: game.time,
            location: game.location,
            homeTeamSlug: game.homeTeamId,
            awayTeamSlug: game.awayTeamId,
            status: game.status,
            homeScore: game.homeScore === null ? '' : String(game.homeScore),
            awayScore: game.awayScore === null ? '' : String(game.awayScore),
            isPlayoff: game.isPlayoff ?? game.weekNumber === 0,
            playoffRound: game.playoffRound ?? '',
            streamUrl: game.streamUrl ?? '',
          }
        : {
            weekNumber: defaultWeek && defaultWeek > 0 ? defaultWeek : 1,
            date: '',
            time: '',
            location: '',
            homeTeamSlug: teams[0]?.slug ?? '',
            awayTeamSlug: teams[1]?.slug ?? '',
            status: 'scheduled',
            homeScore: '',
            awayScore: '',
            isPlayoff: defaultWeek === 0,
            playoffRound: '',
            streamUrl: '',
          }
    )
  }, [game, isOpen, defaultWeek, teams])

  if (!formData) return null

  const update = <K extends keyof GameFormData>(field: K, value: GameFormData[K]) =>
    setFormData((current) => (current ? { ...current, [field]: value } : current))

  const parseScore = (value: string): number | null => {
    if (value.trim() === '') return null
    const parsed = Number(value)
    return Number.isInteger(parsed) && parsed >= 0 ? parsed : null
  }

  const handleSave = async () => {
    setError(null)

    if (!formData.date || !formData.time.trim()) {
      setError('Date and time are required')
      return
    }

    // A playoff slot may legitimately be undecided; a league fixture may not.
    const homeTeam = getTeam(formData.homeTeamSlug)
    const awayTeam = getTeam(formData.awayTeamSlug)

    if (!formData.isPlayoff && (!homeTeam || !awayTeam)) {
      setError('Please choose both teams')
      return
    }
    if (homeTeam && awayTeam && homeTeam.id === awayTeam.id) {
      setError('A team cannot play itself')
      return
    }

    if (formData.streamUrl.trim() && !youTubeVideoId(formData.streamUrl)) {
      setError(
        'That does not look like a YouTube video link. Use the watch, live or youtu.be URL for the stream itself, not a channel.'
      )
      return
    }

    setIsSaving(true)
    try {
      const fields = {
        weekNumber: formData.isPlayoff ? 0 : formData.weekNumber,
        date: formData.date,
        time: formData.time.trim(),
        location: formData.location.trim() || 'TBD',
        homeTeamId: homeTeam?.id ?? null,
        awayTeamId: awayTeam?.id ?? null,
        homeScore: parseScore(formData.homeScore),
        awayScore: parseScore(formData.awayScore),
        status: formData.status,
        isPlayoff: formData.isPlayoff,
        playoffRound: formData.isPlayoff ? formData.playoffRound || null : null,
        streamUrl: formData.streamUrl.trim() || null,
      }

      if (game) {
        await updateGame(game.id, fields)
      } else {
        await createGame(fields)
      }

      notifyDataUpdated()
      onClose()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to save game')
    } finally {
      setIsSaving(false)
    }
  }

  const teamOptions = (placeholder: string) => (
    <>
      <option value="">{placeholder}</option>
      {teams.map((team) => (
        <option key={team.slug} value={team.slug}>
          {team.name}
        </option>
      ))}
    </>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={game ? 'Edit game' : 'Add game'}
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
        <label className="flex items-center gap-2.5 text-[14px] text-ink">
          <input
            type="checkbox"
            checked={formData.isPlayoff}
            onChange={(e) => update('isPlayoff', e.target.checked)}
            className="h-4 w-4 rounded border-hairline-strong accent-[color:var(--ink)]"
          />
          Playoff game
        </label>

        {formData.isPlayoff ? (
          <div>
            <label htmlFor="game-round" className={labelClass}>
              Round
            </label>
            <select
              id="game-round"
              value={formData.playoffRound}
              onChange={(e) => update('playoffRound', e.target.value)}
              className={fieldClass}
            >
              <option value="">Choose a round</option>
              {PLAYOFF_ROUNDS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div>
            <label htmlFor="game-week" className={labelClass}>
              Week
            </label>
            <input
              id="game-week"
              type="number"
              min={1}
              value={formData.weekNumber}
              onChange={(e) => update('weekNumber', parseInt(e.target.value) || 1)}
              className={fieldClass}
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="game-date" className={labelClass}>
              Date
            </label>
            <input
              id="game-date"
              type="date"
              value={formData.date}
              onChange={(e) => update('date', e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="game-time" className={labelClass}>
              Kick-off
            </label>
            <input
              id="game-time"
              type="text"
              placeholder="6:15 PM"
              value={formData.time}
              onChange={(e) => update('time', e.target.value)}
              className={fieldClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="game-location" className={labelClass}>
            Location
          </label>
          <input
            id="game-location"
            type="text"
            placeholder="Main Field"
            value={formData.location}
            onChange={(e) => update('location', e.target.value)}
            className={fieldClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="game-home" className={labelClass}>
              Home
            </label>
            <select
              id="game-home"
              value={formData.homeTeamSlug}
              onChange={(e) => update('homeTeamSlug', e.target.value)}
              className={fieldClass}
            >
              {teamOptions(formData.isPlayoff ? 'TBD' : 'Choose a team')}
            </select>
          </div>
          <div>
            <label htmlFor="game-away" className={labelClass}>
              Away
            </label>
            <select
              id="game-away"
              value={formData.awayTeamSlug}
              onChange={(e) => update('awayTeamSlug', e.target.value)}
              className={fieldClass}
            >
              {teamOptions(formData.isPlayoff ? 'TBD' : 'Choose a team')}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="game-status" className={labelClass}>
            Status
          </label>
          <select
            id="game-status"
            value={formData.status}
            onChange={(e) => update('status', e.target.value as GameStatus)}
            className={fieldClass}
          >
            {STATUSES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="game-stream" className={labelClass}>
            YouTube stream{' '}
            <span className="font-normal text-ink-tertiary">optional</span>
          </label>
          <input
            id="game-stream"
            type="url"
            inputMode="url"
            placeholder="https://www.youtube.com/watch?v=…"
            value={formData.streamUrl}
            onChange={(e) => update('streamUrl', e.target.value)}
            className={fieldClass}
          />
          <p className="mt-1.5 text-[12px] text-ink-tertiary">
            Set the status to <strong className="font-medium">In progress</strong> to
            show this on the homepage as live.
          </p>
        </div>

        {formData.status === 'completed' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="game-home-score" className={labelClass}>
                Home score
              </label>
              <input
                id="game-home-score"
                type="number"
                min={0}
                value={formData.homeScore}
                onChange={(e) => update('homeScore', e.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="game-away-score" className={labelClass}>
                Away score
              </label>
              <input
                id="game-away-score"
                type="number"
                min={0}
                value={formData.awayScore}
                onChange={(e) => update('awayScore', e.target.value)}
                className={fieldClass}
              />
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
