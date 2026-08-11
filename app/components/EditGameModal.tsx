/**
 * Add or edit a game.
 *
 * Teams come from the teams context, so the dropdowns follow whatever teams the
 * league actually has. Game numbers are assigned by the server on create.
 */

'use client'

import { useState, useEffect } from 'react'
import { Game, GameStatus } from '@/types/game'
import { X, Save } from 'lucide-react'
import { updateGame, createGame, notifyDataUpdated } from '@/lib/supabaseData'
import { useTeams } from '@/lib/teamsContext'

interface EditGameModalProps {
  /** Null when adding a new game. */
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
}

const PLAYOFF_ROUNDS = ['play-in', 'quarterfinal', 'semifinal', 'final']

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

    if (game) {
      setFormData({
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
      })
    } else {
      setFormData({
        weekNumber: defaultWeek || 1,
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
      })
    }
  }, [game, isOpen, defaultWeek, teams])

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

  if (!isOpen || !formData) return null

  const update = <K extends keyof GameFormData>(field: K, value: GameFormData[K]) => {
    setFormData((current) => (current ? { ...current, [field]: value } : current))
  }

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

    // Playoff slots may be unfilled ("winner of the play-in"), so empty teams
    // are allowed there but not in a regular season fixture.
    const homeTeam = getTeam(formData.homeTeamSlug)
    const awayTeam = getTeam(formData.awayTeamSlug)

    if (!formData.isPlayoff && (!homeTeam || !awayTeam)) {
      setError('Please choose both teams')
      return
    }
    if (homeTeam && awayTeam && homeTeam.id === awayTeam.id) {
      setError('Home and away teams must be different')
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

  const inputClass =
    'w-full px-4 py-2 bg-[#2a2a2a] border border-[#523232] rounded text-white focus:outline-none focus:border-[#D47F7D]'
  const labelClass = 'block text-sm font-medium text-gray-300 mb-2'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-game-title"
    >
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border border-[#D47F7D] rounded-lg p-8 shadow-2xl"
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
          id="edit-game-title"
          className="text-3xl font-bold text-center uppercase text-[#D47F7D] mb-6"
        >
          {game ? 'Edit Game' : 'Add New Game'}
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
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="game-playoff"
              checked={formData.isPlayoff}
              onChange={(e) => update('isPlayoff', e.target.checked)}
              className="w-5 h-5 bg-[#2a2a2a] border border-[#523232] rounded"
            />
            <label htmlFor="game-playoff" className="text-sm font-medium text-gray-300">
              This is a playoff game
            </label>
          </div>

          {formData.isPlayoff ? (
            <div>
              <label htmlFor="game-round" className={labelClass}>
                Playoff Round
              </label>
              <select
                id="game-round"
                value={formData.playoffRound}
                onChange={(e) => update('playoffRound', e.target.value)}
                className={inputClass}
              >
                <option value="">Choose a round</option>
                {PLAYOFF_ROUNDS.map((round) => (
                  <option key={round} value={round}>
                    {round.charAt(0).toUpperCase() + round.slice(1).replace('-', ' ')}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label htmlFor="game-week" className={labelClass}>
                Week Number *
              </label>
              <input
                id="game-week"
                type="number"
                min={1}
                value={formData.weekNumber}
                onChange={(e) => update('weekNumber', parseInt(e.target.value) || 1)}
                className={inputClass}
              />
            </div>
          )}

          <div>
            <label htmlFor="game-date" className={labelClass}>
              Date *
            </label>
            <input
              id="game-date"
              type="date"
              value={formData.date}
              onChange={(e) => update('date', e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="game-time" className={labelClass}>
              Time *
            </label>
            <input
              id="game-time"
              type="text"
              placeholder="e.g. 6:15 PM"
              value={formData.time}
              onChange={(e) => update('time', e.target.value)}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="game-location" className={labelClass}>
              Location
            </label>
            <input
              id="game-location"
              type="text"
              placeholder="e.g. Main Field"
              value={formData.location}
              onChange={(e) => update('location', e.target.value)}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="game-home" className={labelClass}>
                Home Team {formData.isPlayoff ? '' : '*'}
              </label>
              <select
                id="game-home"
                value={formData.homeTeamSlug}
                onChange={(e) => update('homeTeamSlug', e.target.value)}
                className={inputClass}
              >
                <option value="">{formData.isPlayoff ? 'TBD' : 'Choose a team'}</option>
                {teams.map((team) => (
                  <option key={team.slug} value={team.slug}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="game-away" className={labelClass}>
                Away Team {formData.isPlayoff ? '' : '*'}
              </label>
              <select
                id="game-away"
                value={formData.awayTeamSlug}
                onChange={(e) => update('awayTeamSlug', e.target.value)}
                className={inputClass}
              >
                <option value="">{formData.isPlayoff ? 'TBD' : 'Choose a team'}</option>
                {teams.map((team) => (
                  <option key={team.slug} value={team.slug}>
                    {team.name}
                  </option>
                ))}
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
              className={inputClass}
            >
              <option value="scheduled">Scheduled</option>
              <option value="in_progress">In progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="postponed">Postponed</option>
            </select>
          </div>

          {formData.status === 'completed' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="game-home-score" className={labelClass}>
                  Home Score
                </label>
                <input
                  id="game-home-score"
                  type="number"
                  min={0}
                  value={formData.homeScore}
                  onChange={(e) => update('homeScore', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="game-away-score" className={labelClass}>
                  Away Score
                </label>
                <input
                  id="game-away-score"
                  type="number"
                  min={0}
                  value={formData.awayScore}
                  onChange={(e) => update('awayScore', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          )}
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
            {isSaving ? 'Saving...' : 'Save Game'}
          </button>
        </div>
      </div>
    </div>
  )
}
