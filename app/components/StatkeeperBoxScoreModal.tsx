/**
 * Statkeeper editor for a game's box score.
 *
 * A cut-down EditBoxScoreModal: goals, assists, saves and cards only (no blue
 * cards, no man of the match -- those stay admin-only), plus a status control
 * so the statkeeper can mark a game underway and then final. The score is
 * derived from the goals entered, same as the admin editor, so the score line
 * and the scorer list can never disagree.
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import { Game } from '@/types/game'
import { Player, displayJersey } from '@/types/player'
import { Plus, Trash2 } from 'lucide-react'
import {
  getAllPlayers,
  saveStatkeeperBoxScore,
  notifyDataUpdated,
  StatkeeperStatType,
} from '@/lib/supabaseData'
import { useTeams } from '@/lib/teamsContext'
import {
  Modal,
  FormError,
  fieldClass,
  buttonPrimary,
  buttonSecondary,
} from './Modal'

interface StatkeeperBoxScoreModalProps {
  game: Game | null
  isOpen: boolean
  onClose: () => void
  onSave?: () => void
}

/** A statistic row being edited. `key` is local only, for list identity. */
interface StatRow {
  key: string
  playerId: string
  type: StatkeeperStatType
  count: number
}

const STAT_TYPES: [StatkeeperStatType, string][] = [
  ['goal', 'Goal'],
  ['assist', 'Assist'],
  ['save', 'Save'],
  ['yellow_card', 'Yellow card'],
  ['red_card', 'Red card'],
]

const STATUSES: ['scheduled' | 'in_progress' | 'completed', string][] = [
  ['scheduled', 'Not started'],
  ['in_progress', 'In progress'],
  ['completed', 'Final'],
]

let rowCounter = 0
const nextRowKey = () => `sk-row-${++rowCounter}`

export function StatkeeperBoxScoreModal({
  game,
  isOpen,
  onClose,
  onSave,
}: StatkeeperBoxScoreModalProps) {
  const { teamName } = useTeams()
  const [rows, setRows] = useState<StatRow[]>([])
  const [status, setStatus] = useState<'scheduled' | 'in_progress' | 'completed'>(
    'in_progress'
  )
  const [allPlayers, setAllPlayers] = useState<Player[]>([])
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!game || !isOpen) return

    setError(null)
    setStatus(game.status === 'scheduled' ? 'in_progress' : game.status === 'completed' ? 'completed' : 'in_progress')
    setRows(
      (game.statistics ?? [])
        .filter((stat): stat is typeof stat & { type: StatkeeperStatType } => stat.type !== 'blue_card')
        .map((stat) => ({
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

  // Existing blue-card statistics, if any, are preserved untouched on save --
  // this editor never sends them, and the admin route only overwrites what's
  // included in the statistics array... except our own route replaces the
  // whole list, so we carry them through unchanged rather than drop them.
  const preservedBlueCards = useMemo(
    () => (game?.statistics ?? []).filter((stat) => stat.type === 'blue_card'),
    [game?.statistics]
  )

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

  if (!game) return null

  const homeName = teamName(game.homeTeamId)
  const awayName = teamName(game.awayTeamId)

  const addRow = () => {
    if (isLoadingPlayers) return
    const first = eligiblePlayers[0]
    if (!first) {
      setError('Neither team has any active players to record statistics for')
      return
    }
    setError(null)
    setRows((current) => [
      ...current,
      { key: nextRowKey(), playerId: first.id, type: 'goal', count: 1 },
    ])
  }

  const updateRow = (key: string, changes: Partial<Omit<StatRow, 'key'>>) =>
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...changes } : row))
    )

  const removeRow = (key: string) =>
    setRows((current) => current.filter((row) => row.key !== key))

  const handleSave = async () => {
    setError(null)
    setIsSaving(true)

    try {
      await saveStatkeeperBoxScore(game.id, {
        homeScore,
        awayScore,
        status,
        statistics: [
          ...rows.map(({ playerId, type, count }) => ({ playerId, type, count })),
          ...preservedBlueCards.map((stat) => ({
            playerId: stat.playerId,
            type: stat.type,
            count: stat.count,
          })),
        ] as { playerId: string; type: StatkeeperStatType; count?: number }[],
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Record stats"
      size="lg"
      footer={
        <>
          <button onClick={onClose} disabled={isSaving} className={buttonSecondary}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={isSaving} className={buttonPrimary}>
            {isSaving ? 'Saving…' : 'Save changes'}
          </button>
        </>
      }
    >
      <FormError>{error}</FormError>

      {/* Score, derived from the goals below */}
      <div className="rounded-lg border border-hairline bg-surface-sunken px-5 py-5">
        <div className="flex items-center justify-center gap-8">
          <div className="flex-1 text-right">
            <p className="truncate text-[13px] text-ink-secondary">{homeName}</p>
            <p className="tabular mt-1 text-[32px] font-semibold leading-none text-ink">
              {homeScore}
            </p>
          </div>
          <span className="text-[15px] text-ink-tertiary">–</span>
          <div className="flex-1 text-left">
            <p className="truncate text-[13px] text-ink-secondary">{awayName}</p>
            <p className="tabular mt-1 text-[32px] font-semibold leading-none text-ink">
              {awayScore}
            </p>
          </div>
        </div>
        <p className="mt-4 text-center text-[12px] text-ink-tertiary">
          Calculated from the goals recorded below
        </p>
      </div>

      {/* Status */}
      <div className="mt-6">
        <label htmlFor="statkeeper-status" className="mb-1 block text-[13px] font-medium text-ink">
          Game status
        </label>
        <select
          id="statkeeper-status"
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className={fieldClass}
        >
          {STATUSES.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {/* Statistics */}
      <div className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-[15px] font-semibold text-ink">Statistics</h3>
          <button
            onClick={addRow}
            disabled={isLoadingPlayers}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-ink transition-colors hover:bg-surface-hover disabled:opacity-50"
          >
            <Plus size={15} />
            Add
          </button>
        </div>

        {rows.length === 0 ? (
          <p className="mt-4 border border-hairline px-4 py-5 text-left text-[14px] text-ink-tertiary">
            Nothing recorded yet.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {rows.map((row) => (
              <li
                key={row.key}
                className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_9rem_4.5rem_auto]"
              >
                <select
                  value={row.playerId}
                  onChange={(e) => updateRow(row.key, { playerId: e.target.value })}
                  aria-label="Player"
                  className={fieldClass}
                >
                  {homeTeamPlayers.length > 0 && (
                    <optgroup label={homeName}>
                      {homeTeamPlayers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {displayJersey(p.jerseyNumber)} · {p.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {awayTeamPlayers.length > 0 && (
                    <optgroup label={awayName}>
                      {awayTeamPlayers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {displayJersey(p.jerseyNumber)} · {p.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>

                <select
                  value={row.type}
                  onChange={(e) =>
                    updateRow(row.key, { type: e.target.value as StatkeeperStatType })
                  }
                  aria-label="Statistic"
                  className={fieldClass}
                >
                  {STAT_TYPES.map(([value, label]) => (
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
                  aria-label="How many"
                  title="How many, e.g. 2 if the player scored twice"
                  className={`${fieldClass} text-center`}
                />

                <button
                  onClick={() => removeRow(row.key)}
                  aria-label="Remove"
                  className="justify-self-end rounded-md p-2 text-ink-tertiary transition-colors hover:bg-negative-wash hover:text-negative"
                >
                  <Trash2 size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  )
}
