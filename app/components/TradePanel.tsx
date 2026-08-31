/**
 * Move players between two clubs.
 *
 * Deliberately not "swap": either column may be left empty, so this handles a
 * straight one-for-one, a two-for-one, and simply moving a player who ended up
 * on the wrong club. The two squads sit side by side and you tick whoever is
 * changing hands, because that is how a trade is actually discussed -- these
 * for those -- rather than as a form with a direction.
 *
 * Shirt numbers are settled on the server. Where a player cannot keep theirs
 * on the club they are joining, they take the nearest free one and the result
 * says so, so nobody finds out from a shirt order later.
 */

'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { displayJersey } from '@/types/player'
import { useTeams } from '@/lib/teamsContext'
import { getTeamsWithPlayers, tradePlayers, notifyDataUpdated } from '@/lib/supabaseData'
import { Modal, fieldClass, labelClass, buttonPrimary, buttonSecondary, FormError } from './Modal'

export interface TradeSquadPlayer {
  id: string
  name: string
  jerseyNumber: number | null
  isCaptain?: boolean
}

export interface TradeSquad {
  teamId: string
  slug: string
  players: TradeSquadPlayer[]
}

interface TradePanelProps {
  isOpen: boolean
  onClose: () => void
  /** The club whose page this was opened from, pre-selected on the left. */
  defaultTeamId?: string
}


/**
 * One club and its squad, with a checkbox per player.
 *
 * Defined at module level on purpose. Declared inside TradePanel it would be a
 * new component type on every render, so React would tear down and rebuild
 * both lists each time a box was ticked -- which dropped clicks.
 */
function TradeColumn({
  heading,
  teamId,
  teams,
  players,
  exclude,
  picked,
  onTeamChange,
  onToggle,
}: {
  heading: string
  teamId: string
  teams: { id: string; name: string }[]
  players: TradeSquadPlayer[]
  exclude: string
  picked: Set<string>
  onTeamChange: (id: string) => void
  onToggle: (id: string) => void
}) {
  return (
    <div className="min-w-0">
      <label className={labelClass}>{heading}</label>
      <select
        value={teamId}
        onChange={(event) => onTeamChange(event.target.value)}
        className={fieldClass}
      >
        <option value="">Choose a club</option>
        {teams
          .filter((t) => t.id !== exclude)
          .map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
      </select>

      {teamId && (
        <div className="mt-3 border border-hairline">
          {players.length === 0 ? (
            <p className="loading px-4 py-4">No players</p>
          ) : (
            <ul>
              {players.map((player) => (
                <li key={player.id} className="border-b border-hairline last:border-b-0">
                  <label className="flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors hover:bg-ink/[0.04]">
                    <input
                      type="checkbox"
                      checked={picked.has(player.id)}
                      onChange={() => onToggle(player.id)}
                    />
                    <span className="w-8 shrink-0 text-right font-util text-[12px] text-ink-tertiary">
                      {displayJersey(player.jerseyNumber)}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-display text-[14px] font-bold uppercase tracking-[0.01em] text-ink">
                      {player.name}
                    </span>
                    {player.isCaptain && (
                      <span className="shrink-0 bg-ink px-1.5 py-px font-util text-[10px] font-bold uppercase tracking-[0.1em] text-ink-inverse">
                        C
                      </span>
                    )}
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export function TradePanel({ isOpen, onClose, defaultTeamId }: TradePanelProps) {
  const { teams, teamName } = useTeams()

  // Loaded here rather than passed in: a trade needs every squad, and the page
  // that opens this only knows about one of them.
  const [squads, setSquads] = useState<TradeSquad[]>([])

  const loadSquads = useCallback(async () => {
    const rows = await getTeamsWithPlayers()
    setSquads(
      rows.map((row) => ({
        teamId: (row as unknown as { id: string }).id,
        slug: row.slug,
        players: ((row as unknown as { players: Record<string, unknown>[] }).players ?? [])
          .filter((p) => p.is_active !== false)
          .map((p) => ({
            id: p.id as string,
            name: p.name as string,
            jerseyNumber: (p.jersey_number as number | null) ?? null,
            isCaptain: p.is_captain === true,
          }))
          .sort(
            (a, b) =>
              Number(Boolean(b.isCaptain)) - Number(Boolean(a.isCaptain)) ||
              (a.jerseyNumber ?? 999) - (b.jerseyNumber ?? 999)
          ),
      }))
    )
  }, [])

  useEffect(() => {
    if (isOpen) loadSquads()
  }, [isOpen, loadSquads])

  const [leftId, setLeftId] = useState(defaultTeamId ?? '')
  const [rightId, setRightId] = useState('')
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string[] | null>(null)

  const left = useMemo(
    () => squads.find((s) => s.teamId === leftId)?.players ?? [],
    [leftId, squads]
  )
  const right = useMemo(
    () => squads.find((s) => s.teamId === rightId)?.players ?? [],
    [rightId, squads]
  )

  const toggle = (id: string) =>
    setPicked((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const fromPlayerIds = left.filter((p) => picked.has(p.id)).map((p) => p.id)
  const toPlayerIds = right.filter((p) => picked.has(p.id)).map((p) => p.id)
  const canTrade =
    Boolean(leftId) && Boolean(rightId) && fromPlayerIds.length + toPlayerIds.length > 0

  const reset = () => {
    setPicked(new Set())
    setError(null)
    setResult(null)
  }

  const submit = async () => {
    setIsSaving(true)
    setError(null)
    try {
      const { moved } = await tradePlayers({
        fromTeamId: leftId,
        toTeamId: rightId,
        fromPlayerIds,
        toPlayerIds,
      })
      setResult(
        moved.map((m) =>
          m.previousNumber !== undefined
            ? `${m.name} → ${m.toTeamName}, now #${displayJersey(m.jerseyNumber)} (was #${displayJersey(m.previousNumber)})`
            : `${m.name} → ${m.toTeamName}, #${displayJersey(m.jerseyNumber)}`
        )
      )
      setPicked(new Set())
      await loadSquads()
      notifyDataUpdated()
    } catch (tradeError) {
      setError(tradeError instanceof Error ? tradeError.message : 'That trade did not go through')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Trade players" size="lg">
      <FormError>{error}</FormError>

      <div className="grid gap-6 sm:grid-cols-2">
        <TradeColumn
          heading="Club"
          teamId={leftId}
          teams={teams}
          players={left}
          exclude={rightId}
          picked={picked}
          onTeamChange={(id) => {
            setLeftId(id)
            setPicked(new Set())
            setResult(null)
          }}
          onToggle={toggle}
        />
        <TradeColumn
          heading="Trading with"
          teamId={rightId}
          teams={teams}
          players={right}
          exclude={leftId}
          picked={picked}
          onTeamChange={(id) => {
            setRightId(id)
            setPicked(new Set())
            setResult(null)
          }}
          onToggle={toggle}
        />
      </div>

      {(fromPlayerIds.length > 0 || toPlayerIds.length > 0) && (
        <p className="mt-5 border border-hairline px-4 py-3 font-util text-[12px] text-ink-secondary">
          {fromPlayerIds.length} from {teamName(squads.find((s) => s.teamId === leftId)?.slug)} ·{' '}
          {toPlayerIds.length} from{' '}
          {rightId ? teamName(squads.find((s) => s.teamId === rightId)?.slug) : '—'}
        </p>
      )}

      {result && (
        <div className="mt-5 border border-hairline px-4 py-3">
          <p className="eyebrow">Traded</p>
          <ul className="mt-2 space-y-1">
            {result.map((line) => (
              <li key={line} className="font-util text-[12px] text-ink">
                {line}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button onClick={reset} className={buttonSecondary} disabled={isSaving}>
          Clear
        </button>
        <button onClick={submit} className={buttonPrimary} disabled={!canTrade || isSaving}>
          {isSaving ? 'Trading…' : 'Trade'}
        </button>
      </div>
    </Modal>
  )
}
