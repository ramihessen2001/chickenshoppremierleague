/**
 * The live draft board.
 *
 * One component for the room and for the person running it: everybody sees the
 * same board, and the pick controls appear only for an admin. That way there is
 * no second screen to keep in step -- the admin's board IS the public board.
 *
 * State is polled rather than pushed. A draft is a handful of picks over an
 * hour or two, so a short poll is far less machinery than a realtime
 * subscription for the same result, and it recovers by itself if a phone
 * sleeps or the wifi drops.
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { Undo2 } from 'lucide-react'
import { useAdmin } from '@/lib/adminContext'
import { PageHeader } from './PageHeader'

/** How often the board re-reads while the draft is live. */
const POLL_MS = 5000

interface RosterEntry {
  name: string
  jerseyNumber: number | null
  pickNumber: number
}

interface BoardTeam {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  draftPosition: number | null
  roster: RosterEntry[]
}

interface AvailablePlayer {
  id: string
  name: string
  position: string | null
  experience: string | null
  requestedNumber: number | null
}

interface Board {
  teams: BoardTeam[]
  available: AvailablePlayer[]
  picks: {
    pickNumber: number
    name: string
    teamId: string | null
    jerseyNumber: number | null
  }[]
  onTheClock: { teamId: string; pickNumber: number; round: number } | null
  isComplete: boolean
  totalPicks: number
}

/** The 409 the pick API returns when a registered number is already taken. */
interface NumberPrompt {
  signupId: string
  playerName: string
  teamName: string
  requested: number | null
  suggestions: number[]
}

export function DraftBoard() {
  const { isAdmin } = useAdmin()
  const [board, setBoard] = useState<Board | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [prompt, setPrompt] = useState<NumberPrompt | null>(null)

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/draft/board', { cache: 'no-store' })
      if (!response.ok) throw new Error('Failed to load the board')
      setBoard(await response.json())
    } catch (loadError) {
      console.error('Error loading draft board:', loadError)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    // Pause polling while a number is being chosen, so the board cannot
    // re-render the prompt out from under whoever is answering it.
    if (prompt) return
    const timer = setInterval(load, POLL_MS)
    return () => clearInterval(timer)
  }, [load, prompt])

  const pick = async (signupId: string, jerseyNumber?: number) => {
    setBusyId(signupId)
    setError(null)
    try {
      const response = await fetch('/api/admin/draft/pick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signupId, jerseyNumber }),
      })
      const result = await response.json()

      if (!response.ok) {
        if (result.needsNumber) {
          setPrompt({
            signupId,
            playerName: result.playerName ?? 'This player',
            teamName: result.teamName ?? '',
            requested: result.requested ?? null,
            suggestions: result.suggestions ?? [],
          })
        } else {
          setError(result.error ?? 'That pick did not go through')
        }
        return
      }

      setPrompt(null)
      await load()
    } catch {
      setError('That pick did not go through. Check the connection and retry.')
    } finally {
      setBusyId(null)
    }
  }

  const undo = async () => {
    if (!confirm('Undo the most recent pick?')) return
    setError(null)
    try {
      const response = await fetch('/api/admin/draft/pick', { method: 'DELETE' })
      const result = await response.json()
      if (!response.ok) setError(result.error ?? 'Could not undo that pick')
      await load()
    } catch {
      setError('Could not undo that pick')
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-[15px] text-ink-tertiary">Loading the board…</p>
      </div>
    )
  }

  if (!board) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
        <p className="text-[15px] text-ink-secondary">
          The draft board could not be loaded. Refresh to try again.
        </p>
      </div>
    )
  }

  const onClockTeam = board.onTheClock
    ? board.teams.find((team) => team.id === board.onTheClock!.teamId)
    : null
  const drafted = board.totalPicks - board.available.length

  return (
    <>
      <PageHeader
        eyebrow="Live"
        title="Draft"
        description={
          board.isComplete
            ? `The draft is complete — all ${board.totalPicks} players are on a team.`
            : `${drafted} of ${board.totalPicks} players drafted.`
        }
        actions={
          isAdmin && drafted > 0 && !board.isComplete ? (
            <button
              onClick={undo}
              className="inline-flex items-center gap-1.5 rounded-pill border border-hairline-strong px-4 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-surface-hover"
            >
              <Undo2 size={15} />
              Undo last pick
            </button>
          ) : undefined
        }
      />

      <div className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
        {error && (
          <p className="mb-6 rounded-lg border border-hairline-strong bg-surface-sunken px-4 py-3 text-[14px] text-ink">
            {error}
          </p>
        )}

        {/* On the clock ------------------------------------------------- */}
        {onClockTeam && !board.isComplete && (
          <div className="mb-8 flex flex-wrap items-center gap-4 rounded-lg border border-hairline bg-surface-sunken px-5 py-4">
            {onClockTeam.logoUrl && (
              <Image
                src={onClockTeam.logoUrl}
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 shrink-0 object-contain"
              />
            )}
            <div className="min-w-0">
              <p className="text-[12px] font-semibold uppercase tracking-wider text-ink-tertiary">
                On the clock · Pick {board.onTheClock!.pickNumber} · Round{' '}
                {board.onTheClock!.round}
              </p>
              <p className="text-[19px] font-semibold text-ink">{onClockTeam.name}</p>
            </div>
          </div>
        )}

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem]">
          {/* Available players ------------------------------------------ */}
          <section aria-labelledby="available-heading">
            <h2
              id="available-heading"
              className="text-[17px] font-semibold text-ink"
            >
              Available{' '}
              <span className="font-normal text-ink-tertiary">
                ({board.available.length})
              </span>
            </h2>

            {board.available.length === 0 ? (
              <p className="mt-4 text-[14px] text-ink-tertiary">
                Every registered player has been drafted.
              </p>
            ) : (
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {board.available.map((player) => (
                  <li
                    key={player.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-hairline bg-surface px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-medium text-ink">
                        {player.name}
                      </p>
                      <p className="truncate text-[13px] text-ink-tertiary">
                        {[
                          player.position,
                          player.experience,
                          player.requestedNumber !== null
                            ? `#${player.requestedNumber}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(' · ') || 'No preference given'}
                      </p>
                    </div>

                    {isAdmin && !board.isComplete && (
                      <button
                        onClick={() => pick(player.id)}
                        disabled={busyId === player.id}
                        className="shrink-0 rounded-pill bg-surface-inverse px-3.5 py-1.5 text-[13px] font-medium text-ink-inverse transition-opacity hover:opacity-85 disabled:opacity-50"
                      >
                        {busyId === player.id ? '…' : 'Draft'}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Latest picks ----------------------------------------------- */}
          <section aria-labelledby="picks-heading">
            <h2 id="picks-heading" className="text-[17px] font-semibold text-ink">
              Latest picks
            </h2>

            {board.picks.length === 0 ? (
              <p className="mt-4 text-[14px] text-ink-tertiary">
                No picks yet.
              </p>
            ) : (
              <ol className="mt-4 space-y-2">
                {board.picks.slice(0, 12).map((entry) => {
                  const team = board.teams.find((t) => t.id === entry.teamId)
                  return (
                    <li
                      key={entry.pickNumber}
                      className="flex items-center gap-3 rounded-lg border border-hairline bg-surface px-4 py-2.5"
                    >
                      <span className="w-7 shrink-0 text-[12px] font-semibold text-ink-tertiary">
                        {entry.pickNumber}
                      </span>
                      {team?.logoUrl && (
                        <Image
                          src={team.logoUrl}
                          alt=""
                          width={22}
                          height={22}
                          className="h-[22px] w-[22px] shrink-0 object-contain"
                        />
                      )}
                      <span className="min-w-0 flex-1 truncate text-[14px] text-ink">
                        {entry.name}
                        {entry.jerseyNumber !== null && (
                          <span className="text-ink-tertiary"> #{entry.jerseyNumber}</span>
                        )}
                      </span>
                    </li>
                  )
                })}
              </ol>
            )}
          </section>
        </div>

        {/* Rosters -------------------------------------------------------- */}
        <section className="mt-12" aria-labelledby="rosters-heading">
          <h2 id="rosters-heading" className="text-[17px] font-semibold text-ink">
            Rosters
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {board.teams.map((team) => (
              <div
                key={team.id}
                className={`rounded-lg border bg-surface p-4 ${
                  team.id === board.onTheClock?.teamId
                    ? 'border-hairline-strong'
                    : 'border-hairline'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {team.logoUrl && (
                    <Image
                      src={team.logoUrl}
                      alt=""
                      width={26}
                      height={26}
                      className="h-[26px] w-[26px] shrink-0 object-contain"
                    />
                  )}
                  <p className="min-w-0 flex-1 truncate text-[15px] font-medium text-ink">
                    {team.name}
                  </p>
                  <span className="text-[13px] text-ink-tertiary">
                    {team.roster.length}
                  </span>
                </div>

                {team.roster.length === 0 ? (
                  <p className="mt-3 text-[13px] text-ink-tertiary">No picks yet</p>
                ) : (
                  <ul className="mt-3 space-y-1.5">
                    {team.roster.map((entry) => (
                      <li
                        key={entry.pickNumber}
                        className="flex items-baseline gap-2 text-[13px]"
                      >
                        <span className="w-6 shrink-0 text-ink-tertiary">
                          {entry.jerseyNumber !== null ? `#${entry.jerseyNumber}` : '—'}
                        </span>
                        <span className="min-w-0 truncate text-ink">{entry.name}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Number clash prompt ---------------------------------------------- */}
      {prompt && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-lg border border-hairline bg-surface p-6">
            <h2 className="text-[19px] font-semibold text-ink">Pick a number</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-secondary">
              {prompt.playerName} registered with{' '}
              {prompt.requested !== null ? (
                <strong className="font-medium text-ink">#{prompt.requested}</strong>
              ) : (
                'no number'
              )}
              , which is already taken on {prompt.teamName}. Choose another to
              complete the pick.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {prompt.suggestions.map((number) => (
                <button
                  key={number}
                  onClick={() => pick(prompt.signupId, number)}
                  disabled={busyId === prompt.signupId}
                  className="rounded-pill border border-hairline-strong px-4 py-2 text-[14px] font-medium text-ink transition-colors hover:bg-surface-hover disabled:opacity-50"
                >
                  #{number}
                </button>
              ))}
            </div>

            <button
              onClick={() => setPrompt(null)}
              className="mt-6 text-[14px] text-ink-secondary underline-offset-4 hover:underline"
            >
              Cancel this pick
            </button>
          </div>
        </div>
      )}
    </>
  )
}
