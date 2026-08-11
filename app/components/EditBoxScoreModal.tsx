/**
 * Admin editor for a game's box score.
 *
 * Scores, statistics and man of the match are saved together in one request
 * (PUT /api/admin/games/[id]/box-score). The old version fired one request per
 * statistic and saved the man of the match separately, so a failure partway
 * through left the game in a half-updated state.
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import { Game } from '@/types/game'
import { StatType } from '@/types/statistic'
import { Player, displayJersey } from '@/types/player'
import { X, Plus, Trash2, Save } from 'lucide-react'
import { getAllPlayers, saveBoxScore, notifyDataUpdated } from '@/lib/supabaseData'
import { PlayerOfGameSelector } from './PlayerOfGameSelector'
import { useTeams } from '@/lib/teamsContext'

interface EditBoxScoreModalProps {
  game: Game | null
  isOpen: boolean
  onClose: () => void
  onSave?: () => void
}

/** A statistic row being edited. `key` is local only, for React list identity. */
interface StatRow {
  key: string
  playerId: string
  type: StatType
  count: number
}

const STAT_TYPES: { value: StatType; label: string }[] = [
  { value: 'goal', label: 'Goal' },
  { value: 'assist', label: 'Assist' },
  { value: 'save', label: 'Save' },
  { value: 'yellow_card', label: 'Yellow Card' },
  { value: 'red_card', label: 'Red Card' },
  { value: 'blue_card', label: 'Blue Card' },
]

let rowCounter = 0
const nextRowKey = () => `row-${++rowCounter}`

export function EditBoxScoreModal({
  game,
  isOpen,
  onClose,
  onSave,
}: EditBoxScoreModalProps) {
  const { teamName } = useTeams()
  const [rows, setRows] = useState<StatRow[]>([])
  const [playerOfGameId, setPlayerOfGameId] = useState<string | null>(null)
  const [allPlayers, setAllPlayers] = useState<Player[]>([])
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!game || !isOpen) return

    setError(null)
    setPlayerOfGameId(game.playerOfGameId ?? null)
    setRows(
      (game.statistics ?? []).map((stat) => ({
        key: nextRowKey(),
        playerId: stat.playerId,
        type: stat.type,
        count: stat.count ?? 1,
      }))
    )

    setIsLoadingPlayers(true)
    getAllPlayers()
      .then(setAllPlayers)
      .catch(() => setError('Could not load players'))
      .finally(() => setIsLoadingPlayers(false))
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

  const homeTeamPlayers = useMemo(
    () => allPlayers.filter((p) => p.teamId === game?.homeTeamId),
    [allPlayers, game?.homeTeamId]
  )
  const awayTeamPlayers = useMemo(
    () => allPlayers.filter((p) => p.teamId === game?.awayTeamId),
    [allPlayers, game?.awayTeamId]
  )
  const eligiblePlayers = useMemo(
    () => [...homeTeamPlayers, ...awayTeamPlayers],
    [homeTeamPlayers, awayTeamPlayers]
  )

  /**
   * Scores are derived from the goal rows rather than typed in, so the score
   * line and the scorer list can never disagree.
   */
  const { homeScore, awayScore } = useMemo(() => {
    let home = 0
    let away = 0

    for (const row of rows) {
      if (row.type !== 'goal') continue
      const player = allPlayers.find((p) => p.id === row.playerId)
      if (!player) continue
      if (player.teamId === game?.homeTeamId) home += row.count
      else if (player.teamId === game?.awayTeamId) away += row.count
    }

    return { homeScore: home, awayScore: away }
  }, [rows, allPlayers, game?.homeTeamId, game?.awayTeamId])

  if (!isOpen || !game) return null

  const homeTeamName = teamName(game.homeTeamId)
  const awayTeamName = teamName(game.awayTeamId)

  const addRow = () => {
    const firstPlayer = eligiblePlayers[0]
    if (!firstPlayer) {
      setError('Neither team has any active players to record statistics for')
      return
    }
    setError(null)
    setRows((current) => [
      ...current,
      { key: nextRowKey(), playerId: firstPlayer.id, type: 'goal', count: 1 },
    ])
  }

  const updateRow = (key: string, changes: Partial<Omit<StatRow, 'key'>>) => {
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...changes } : row))
    )
  }

  const removeRow = (key: string) => {
    setRows((current) => current.filter((row) => row.key !== key))
  }

  const handleSave = async () => {
    setError(null)
    setIsSaving(true)

    try {
      await saveBoxScore(game.id, {
        homeScore,
        awayScore,
        status: 'completed',
        playerOfGameId,
        statistics: rows.map((row) => ({
          playerId: row.playerId,
          type: row.type,
          count: row.count,
        })),
      })

      notifyDataUpdated()
      onSave?.()
      onClose()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to save box score')
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

        <h2
          id="edit-box-score-title"
          className="text-3xl font-bold text-center uppercase text-[#D47F7D] mb-6"
        >
          Edit Box Score
        </h2>

        {error && (
          <p
            className="mb-6 px-4 py-3 bg-red-950/60 border border-red-700 rounded text-red-200 text-sm"
            role="alert"
          >
            {error}
          </p>
        )}

        {/* Score, derived from the goals recorded below */}
        <div className="bg-[#2a2a2a] p-6 rounded-lg mb-6 border border-[#444444]">
          <h3 className="text-xl font-bold text-white mb-1">Final Score</h3>
          <p className="text-sm text-gray-400 mb-4">
            Calculated from the goals recorded below.
          </p>
          <div className="grid grid-cols-2 gap-6">
            <div className="text-center">
              <p className="text-sm font-medium text-gray-200 mb-2">{homeTeamName}</p>
              <p className="text-4xl font-black text-[#D47F7D]">{homeScore}</p>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-200 mb-2">{awayTeamName}</p>
              <p className="text-4xl font-black text-[#D47F7D]">{awayScore}</p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-[#2a2a2a] p-6 rounded-lg mb-6 border border-[#444444]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-white">Game Statistics</h3>
            <button
              onClick={addRow}
              className="flex items-center gap-2 px-4 py-2 bg-[#D47F7D] text-black font-semibold rounded hover:bg-[#c66f6d] transition-colors"
            >
              <Plus size={16} />
              Add Statistic
            </button>
          </div>

          {rows.length > 0 && (
            <div className="hidden sm:grid grid-cols-[1fr_10rem_5rem_2.5rem] gap-3 mb-2 px-3 text-xs text-gray-300 uppercase font-semibold">
              <div>Player</div>
              <div>Stat Type</div>
              <div className="text-center">Count</div>
              <div />
            </div>
          )}

          <div className="space-y-3">
            {rows.map((row) => (
              <div
                key={row.key}
                className="grid grid-cols-1 sm:grid-cols-[1fr_10rem_5rem_2.5rem] gap-3 items-center bg-[#1a1a1a] p-3 rounded border border-[#333333]"
              >
                <select
                  value={row.playerId}
                  onChange={(e) => updateRow(row.key, { playerId: e.target.value })}
                  aria-label="Player"
                  className="px-3 py-2 bg-[#2a2a2a] border border-[#523232] rounded text-white focus:outline-none focus:border-[#D47F7D]"
                >
                  {homeTeamPlayers.length > 0 && (
                    <optgroup label={homeTeamName}>
                      {homeTeamPlayers.map((p) => (
                        <option key={p.id} value={p.id}>
                          #{displayJersey(p.jerseyNumber)} {p.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {awayTeamPlayers.length > 0 && (
                    <optgroup label={awayTeamName}>
                      {awayTeamPlayers.map((p) => (
                        <option key={p.id} value={p.id}>
                          #{displayJersey(p.jerseyNumber)} {p.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>

                <select
                  value={row.type}
                  onChange={(e) =>
                    updateRow(row.key, { type: e.target.value as StatType })
                  }
                  aria-label="Statistic type"
                  className="px-3 py-2 bg-[#2a2a2a] border border-[#523232] rounded text-white focus:outline-none focus:border-[#D47F7D]"
                >
                  {STAT_TYPES.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  min={1}
                  value={row.count}
                  onChange={(e) =>
                    updateRow(row.key, {
                      count: Math.max(1, parseInt(e.target.value) || 1),
                    })
                  }
                  aria-label="Count"
                  title="How many, e.g. 2 if the player scored twice"
                  className="px-3 py-2 bg-[#2a2a2a] border border-[#523232] rounded text-white text-center focus:outline-none focus:border-[#D47F7D]"
                />

                <button
                  onClick={() => removeRow(row.key)}
                  className="p-2 text-red-400 hover:bg-red-400/10 rounded transition-colors justify-self-end"
                  aria-label="Delete statistic"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}

            {rows.length === 0 && (
              <p className="text-gray-300 text-center py-4">
                No statistics recorded yet. Use &quot;Add Statistic&quot; to begin.
              </p>
            )}
          </div>
        </div>

        <div className="mb-6">
          <PlayerOfGameSelector
            players={eligiblePlayers}
            selectedPlayerId={playerOfGameId}
            onChange={setPlayerOfGameId}
            isLoading={isLoadingPlayers}
          />
        </div>

        <div className="flex justify-end gap-4">
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
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
