/**
 * Admin editor for a game's box score.
 *
 * Scores, statistics and man of the match save together in one request. The
 * score is derived from the goals entered rather than typed, so the score line
 * and the scorer list can never disagree.
 */

'use client'

import { useState, useEffect, useMemo } from 'react'
import { Game } from '@/types/game'
import { StatType } from '@/types/statistic'
import { Player, displayJersey } from '@/types/player'
import { Plus, Trash2 } from 'lucide-react'
import { getAllPlayers, saveBoxScore, notifyDataUpdated } from '@/lib/supabaseData'
import { PlayerOfGameSelector } from './PlayerOfGameSelector'
import { useTeams } from '@/lib/teamsContext'
import {
  Modal,
  FormError,
  fieldClass,
  buttonPrimary,
  buttonSecondary,
} from './Modal'

interface EditBoxScoreModalProps {
  game: Game | null
  isOpen: boolean
  onClose: () => void
  onSave?: () => void
}

/** A statistic row being edited. `key` is local only, for list identity. */
interface StatRow {
  key: string
  playerId: string
  type: StatType
  count: number
}

const STAT_TYPES: [StatType, string][] = [
  ['goal', 'Goal'],
  ['assist', 'Assist'],
  ['save', 'Save'],
  ['yellow_card', 'Yellow card'],
  ['red_card', 'Red card'],
  ['blue_card', 'Blue card'],
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
      await saveBoxScore(game.id, {
        homeScore,
        awayScore,
        status: 'completed',
        playerOfGameId,
        statistics: rows.map(({ playerId, type, count }) => ({
          playerId,
          type,
          count,
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit box score"
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

      {/* Statistics */}
      <div className="mt-8">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-[15px] font-semibold text-ink">Statistics</h3>
          <button
            onClick={addRow}
            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-ink transition-colors hover:bg-surface-hover"
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
                    updateRow(row.key, { type: e.target.value as StatType })
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

      <div className="mt-8">
        <PlayerOfGameSelector
          players={eligiblePlayers}
          selectedPlayerId={playerOfGameId}
          onChange={setPlayerOfGameId}
          isLoading={isLoadingPlayers}
        />
      </div>
    </Modal>
  )
}
