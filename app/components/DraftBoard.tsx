/**
 * The live draft board.
 *
 * One component for the room and for the person running it: everybody sees the
 * same board, and the pick controls appear only for an admin. That way there is
 * no second screen to keep in step -- the admin's board IS the public board.
 *
 * On a wide screen this is also the broadcast view: an on-the-clock hero, a
 * pick ticker, and three independently-scrolling zones (available players,
 * latest picks, rosters) sized to fit one viewport, so whoever is running the
 * draft can put this straight into an OBS browser source with nothing to
 * scroll past. Below that breakpoint it falls back to a normal stacked page,
 * since a phone checking in on the draft has no stream to fit.
 *
 * State is polled rather than pushed. A draft is a handful of picks over an
 * hour or two, so a short poll is far less machinery than a realtime
 * subscription for the same result, and it recovers by itself if a phone
 * sleeps or the wifi drops.
 */

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Undo2, FlaskConical } from 'lucide-react'
import { useAdmin } from '@/lib/adminContext'
import { isNumberFree, roundForPick, suggestNumbers, teamOnPick } from '@/lib/draft'
import { setDraftOrder } from '@/lib/supabaseData'
import { LEAGUE } from '@/config/league'
import { PickAnnouncement, AnnouncedPick } from './PickAnnouncement'
import { Modal } from './Modal'
import {
  addSandboxPick,
  devSandboxActive,
  getSandboxDraftOrder,
  getSandboxPicks,
  resetSandbox,
  undoLastSandboxPick,
  type SandboxPick,
} from '@/lib/devSandbox'

/** How often the board re-reads while the draft is live. */
const POLL_MS = 5000

/** Board order for the "Available" groups; anything else falls into Flexible. */
const POSITION_GROUPS = ['Forward', 'Midfielder', 'Defender', 'Goalkeeper'] as const

interface RosterEntry {
  name: string
  jerseyNumber: number | null
  /** Null for a captain: they were placed on the team, not picked. */
  pickNumber: number | null
  isCaptain?: boolean
}

interface BoardTeam {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  /** The club's own colour. The API sends it; the announcement reads it. */
  primaryColor: string | null
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

interface OnDeckTeam {
  id: string
  name: string
  logoUrl: string | null
}

interface Board {
  teams: BoardTeam[]
  available: AvailablePlayer[]
  picks: {
    pickNumber: number
    name: string
    teamId: string | null
    jerseyNumber: number | null
    draftedAt: string | null
  }[]
  onTheClock: { teamId: string; pickNumber: number; round: number } | null
  onDeck: OnDeckTeam[]
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

/** A team's mark: its uploaded logo, or a plain initial when it has none yet. */
function TeamBadge({
  team,
  size,
}: {
  team: { name: string; logoUrl: string | null } | null | undefined
  size: number
}) {
  const hasLogo = Boolean(team?.logoUrl)
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold ${
        hasLogo ? '' : 'bg-surface-inverse text-ink-inverse'
      }`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {team?.logoUrl ? (
        <Image
          src={team.logoUrl}
          alt=""
          width={size}
          height={size}
          className="h-full w-full object-contain"
        />
      ) : (
        (team?.name?.[0] ?? '?')
      )}
    </span>
  )
}

/** Which "Available" group a player's preference falls into. */
function positionGroup(position: string | null): string {
  return position && (POSITION_GROUPS as readonly string[]).includes(position)
    ? position
    : 'Flexible'
}

/**
 * Layers locally-drafted picks and a locally-set draft order (see
 * lib/devSandbox.ts) on top of the real board, so the on-the-clock team, the
 * available pool and the rosters all look right while testing -- without any
 * of it having come from Supabase. A no-op once there is nothing local to
 * layer in.
 */
function applySandbox(real: Board): Board {
  const sandboxPicks = getSandboxPicks()
  const orderOverride = getSandboxDraftOrder()
  if (sandboxPicks.length === 0 && !orderOverride) return real

  const teamsWithOrder = orderOverride
    ? real.teams.map((team) => {
        const index = orderOverride.indexOf(team.id)
        return { ...team, draftPosition: index === -1 ? null : index + 1 }
      })
    : real.teams

  const sandboxedIds = new Set(sandboxPicks.map((p) => p.signupId))
  const available = real.available.filter((p) => !sandboxedIds.has(p.id))

  const picks = [
    ...sandboxPicks.map((p) => ({
      pickNumber: p.pickNumber,
      name: p.name,
      teamId: p.teamId,
      jerseyNumber: p.jerseyNumber,
      draftedAt: p.draftedAt,
    })),
    ...real.picks,
  ].sort((a, b) => b.pickNumber - a.pickNumber)

  const teams = teamsWithOrder.map((team) => {
    const extra = sandboxPicks
      .filter((p) => p.teamId === team.id)
      .map((p) => ({ name: p.name, jerseyNumber: p.jerseyNumber, pickNumber: p.pickNumber }))
    return extra.length === 0
      ? team
      : {
          ...team,
          // Captains have no pick number and stay at the front.
          roster: [...team.roster, ...extra].sort(
            (a, b) => (a.pickNumber ?? -1) - (b.pickNumber ?? -1)
          ),
        }
  })

  const draftedCount = real.totalPicks - available.length
  const nextPick = draftedCount + 1
  const orderable = teams.map((t) => ({ id: t.id, draftPosition: t.draftPosition }))
  const next = teamOnPick(orderable, nextPick, real.totalPicks)
  const onDeck = [1, 2, 3]
    .map((offset) => teamOnPick(orderable, nextPick + offset, real.totalPicks))
    .filter((t): t is NonNullable<typeof t> => t !== null)
    .map((t) => {
      const team = teams.find((tm) => tm.id === t.id)!
      return { id: team.id, name: team.name, logoUrl: team.logoUrl }
    })

  return {
    ...real,
    available,
    picks,
    teams,
    onDeck,
    onTheClock: next
      ? {
          teamId: next.id,
          pickNumber: nextPick,
          round: roundForPick(teams.filter((t) => t.draftPosition !== null).length, nextPick),
        }
      : null,
    isComplete: available.length === 0 && draftedCount > 0,
  }
}

/** Same rules as the real pick API (app/api/admin/draft/pick), run against
 *  the board already in hand instead of Supabase. */
function computeSandboxPick(
  board: Board,
  signupId: string,
  jerseyNumber?: number
):
  | { ok: true; pick: SandboxPick }
  | {
      ok: false
      needsNumber: true
      playerName: string
      teamName: string
      requested: number | null
      suggestions: number[]
    }
  | { ok: false; needsNumber: false; error: string } {
  const signup = board.available.find((p) => p.id === signupId)
  if (!signup) {
    return { ok: false, needsNumber: false, error: 'That registration is no longer available' }
  }

  const draftedCount = board.totalPicks - board.available.length
  const nextPick = draftedCount + 1
  const orderable = board.teams.map((t) => ({ id: t.id, draftPosition: t.draftPosition }))
  const onClock = teamOnPick(orderable, nextPick, board.totalPicks)
  if (!onClock) {
    return {
      ok: false,
      needsNumber: false,
      error: 'No team is on the clock. Set a draft order on the teams before starting.',
    }
  }
  const team = board.teams.find((t) => t.id === onClock.id)!
  const taken = team.roster.map((r) => r.jerseyNumber)
  const requested = signup.requestedNumber

  let finalNumber: number | null
  if (jerseyNumber !== undefined && jerseyNumber !== null) {
    if (!isNumberFree(jerseyNumber, taken)) {
      return {
        ok: false,
        needsNumber: true,
        playerName: signup.name,
        teamName: team.name,
        requested,
        suggestions: suggestNumbers(requested, taken),
      }
    }
    finalNumber = jerseyNumber
  } else if (requested === null) {
    finalNumber = null
  } else if (isNumberFree(requested, taken)) {
    finalNumber = requested
  } else {
    return {
      ok: false,
      needsNumber: true,
      playerName: signup.name,
      teamName: team.name,
      requested,
      suggestions: suggestNumbers(requested, taken),
    }
  }

  return {
    ok: true,
    pick: {
      signupId,
      name: signup.name,
      teamId: team.id,
      jerseyNumber: finalNumber,
      pickNumber: nextPick,
      draftedAt: new Date().toISOString(),
    },
  }
}

interface DraftOrderTeam {
  id: string
  slug: string
  name: string
  logoUrl: string | null
}

/**
 * Sets the draft order with a livestream-friendly reveal: each pick slot
 * flickers through a few names before locking onto the team that actually
 * landed there, one slot at a time, rather than the whole order just
 * appearing at once. Saves the final order once every slot has locked in.
 * Does not touch the snake logic itself (lib/draft.ts) -- this only ever
 * decides who picks first.
 */
function DraftOrderReveal({
  teams,
  onDone,
}: {
  teams: DraftOrderTeam[]
  onDone: () => void | Promise<void>
}) {
  const [revealing, setRevealing] = useState(false)
  const [locked, setLocked] = useState<(DraftOrderTeam | null)[]>(() => teams.map(() => null))
  const [spinningIndex, setSpinningIndex] = useState<number | null>(null)
  const [spinningName, setSpinningName] = useState('')
  const [error, setError] = useState<string | null>(null)

  const reveal = async () => {
    setError(null)
    setRevealing(true)
    setLocked(teams.map(() => null))

    const shuffled = [...teams]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }

    // One slot can be spoken for before the draw. The rest of the order is
    // whatever the shuffle above produced, so pulling that team to the front
    // leaves every other slot random -- it does not re-rank anyone else.
    if (LEAGUE.firstPickTeamSlug) {
      const pinned = shuffled.findIndex((t) => t.slug === LEAGUE.firstPickTeamSlug)
      if (pinned > 0) {
        shuffled.unshift(...shuffled.splice(pinned, 1))
      }
    }

    const result: (DraftOrderTeam | null)[] = teams.map(() => null)
    for (let slot = 0; slot < shuffled.length; slot++) {
      setSpinningIndex(slot)
      for (let flicker = 0; flicker < 8; flicker++) {
        setSpinningName(teams[Math.floor(Math.random() * teams.length)].name)
        await new Promise((resolve) => setTimeout(resolve, 70))
      }
      result[slot] = shuffled[slot]
      setLocked([...result])
      setSpinningIndex(null)
      await new Promise((resolve) => setTimeout(resolve, 350))
    }

    setRevealing(false)

    try {
      await setDraftOrder(shuffled.map((t) => t.id))
      await onDone()
    } catch (revealError) {
      setError(
        revealError instanceof Error ? revealError.message : 'Could not save the draft order'
      )
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="max-w-md text-[13px] text-ink-secondary">
          Reveal the pick order live -- each slot locks in one at a time. The
          snake order (odd rounds forward, even rounds back) stays the same;
          this only decides who picks first.
        </p>
        <button
          onClick={reveal}
          disabled={revealing}
          className="shrink-0 rounded-pill bg-surface-inverse px-5 py-2.5 text-[13px] font-medium text-ink-inverse transition-opacity hover:opacity-85 disabled:opacity-50"
        >
          {revealing ? 'Revealing…' : locked.some(Boolean) ? 'Reveal again' : 'Reveal draft order'}
        </button>
      </div>

      {error && <p className="mt-3 text-[13px] text-negative">{error}</p>}

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {teams.map((_, i) => {
          const team = locked[i]
          const isSpinning = spinningIndex === i
          return (
            <div
              key={i}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 transition-colors ${
                team ? 'border-accent-ink/30 bg-accent-wash' : 'border-hairline bg-surface'
              }`}
            >
              <span className="tabular w-4 shrink-0 text-[12px] font-semibold text-ink-tertiary">
                {i + 1}
              </span>
              {team ? (
                <>
                  <TeamBadge team={team} size={20} />
                  <span className="truncate text-[13px] font-medium text-ink">{team.name}</span>
                </>
              ) : (
                <span className="truncate text-[13px] text-ink-tertiary">
                  {isSpinning ? spinningName : '—'}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function DraftBoard() {
  const { isAdmin } = useAdmin()
  const [board, setBoard] = useState<Board | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [prompt, setPrompt] = useState<NumberPrompt | null>(null)
  // Closed once the admin dismisses it. Re-opens on a fresh page load as
  // long as the draft still hasn't had a first pick.
  const [orderModalDismissed, setOrderModalDismissed] = useState(false)

  // The pick announcement is driven by the board, not by the click that made
  // the pick, so every device following the draft shows it. `seenPick` starts
  // as null and is set by the first board that arrives: that baseline is what
  // stops someone opening the page mid-draft from being shown a pick that
  // happened before they got there.
  const [announced, setAnnounced] = useState<AnnouncedPick | null>(null)
  const seenPick = useRef<number | null>(null)

  const load = useCallback(async () => {
    try {
      const response = await fetch('/api/draft/board', { cache: 'no-store' })
      if (!response.ok) throw new Error('Failed to load the board')
      const real: Board = await response.json()
      setBoard(devSandboxActive ? applySandbox(real) : real)
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

  // Watch the board for a pick we have not shown yet.
  useEffect(() => {
    if (!board) return
    const latestNumber = board.picks[0]?.pickNumber ?? 0

    if (seenPick.current === null) {
      seenPick.current = latestNumber
      return
    }
    if (latestNumber <= seenPick.current) return

    seenPick.current = latestNumber
    const latest = board.picks[0]
    const team = board.teams.find((t) => t.id === latest.teamId)
    const teamsInOrder = board.teams.filter((t) => t.draftPosition !== null).length

    setAnnounced({
      pickNumber: latest.pickNumber,
      round: roundForPick(teamsInOrder, latest.pickNumber),
      playerName: latest.name,
      jerseyNumber: latest.jerseyNumber,
      teamName: team?.name ?? 'Unassigned',
      teamLogoUrl: team?.logoUrl ?? null,
      teamColor: team?.primaryColor ?? null,
    })
  }, [board])

  const pick = async (signupId: string, jerseyNumber?: number) => {
    setBusyId(signupId)
    setError(null)

    // Local test mode: computed and stored in this browser only, never sent
    // to Supabase. See lib/devSandbox.ts.
    if (devSandboxActive) {
      if (board) {
        const result = computeSandboxPick(board, signupId, jerseyNumber)
        if (!result.ok) {
          if (result.needsNumber) {
            setPrompt({
              signupId,
              playerName: result.playerName,
              teamName: result.teamName,
              requested: result.requested,
              suggestions: result.suggestions,
            })
          } else {
            setError(result.error)
          }
        } else {
          addSandboxPick(result.pick)
          setPrompt(null)
          await load()
        }
      }
      setBusyId(null)
      return
    }

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

    if (devSandboxActive) {
      if (!undoLastSandboxPick()) setError('No local test picks to undo')
      await load()
      return
    }

    try {
      const response = await fetch('/api/admin/draft/pick', { method: 'DELETE' })
      const result = await response.json()
      if (!response.ok) setError(result.error ?? 'Could not undo that pick')
      await load()
    } catch {
      setError('Could not undo that pick')
    }
  }

  const resetLocalTestPicks = async () => {
    if (!confirm('Clear every local test pick and phase override?')) return
    resetSandbox()
    await load()
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
  const progressPct = board.totalPicks > 0 ? Math.round((drafted / board.totalPicks) * 100) : 0
  // Only before the first pick -- the order API refuses to change it once
  // the draft is under way.
  const canSetDraftOrder = isAdmin && drafted === 0 && !board.isComplete && board.teams.length > 1

  // Still needed below: the pick list marks the newest entry.
  const latestPick = board.picks[0] ?? null

  const availableGroups = [...POSITION_GROUPS, 'Flexible']
    .map((group) => ({
      group,
      players: board.available.filter((p) => positionGroup(p.position) === group),
    }))
    .filter((g) => g.players.length > 0)

  return (
    <>
      <PickAnnouncement pick={announced} onDismiss={() => setAnnounced(null)} />

      {/* Visually replaced by the compact bar below, kept for a11y/SEO. */}
      <h1 className="sr-only">Draft</h1>

      <div
        className={`mx-auto max-w-6xl px-5 pt-6 pb-10 sm:px-8 lg:flex lg:flex-col lg:overflow-hidden lg:pb-5 ${
          isAdmin ? 'lg:h-[calc(100dvh-92px)]' : 'lg:h-[calc(100dvh-56px)]'
        }`}
      >
        {/* Status row: progress + admin control ------------------------- */}
        <div className="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex min-w-[180px] flex-1 items-center gap-2.5">
            <p className="tabular shrink-0 text-[13px] text-ink-secondary">
              {board.isComplete
                ? `All ${board.totalPicks} players drafted`
                : `${drafted} of ${board.totalPicks} drafted`}
            </p>
            <div className="h-[5px] max-w-[220px] flex-1 overflow-hidden rounded-pill bg-hairline">
              <div
                className="h-full rounded-pill bg-accent transition-[width]"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {canSetDraftOrder && orderModalDismissed && (
            <button
              onClick={() => setOrderModalDismissed(false)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-pill border border-hairline-strong px-4 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-surface-hover"
            >
              Set draft order
            </button>
          )}

          {isAdmin && drafted > 0 && !board.isComplete && (
            <button
              onClick={undo}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-pill border border-hairline-strong px-4 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-surface-hover"
            >
              <Undo2 size={15} />
              Undo last pick
            </button>
          )}
        </div>

        {devSandboxActive && (
          <div className="mt-3 flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border border-accent-ink/25 bg-accent-wash px-4 py-2">
            <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-accent-ink">
              <FlaskConical size={14} />
              Local test mode — picks and phase changes stay in this browser,
              nothing is saved to Supabase.
            </p>
            {isAdmin && getSandboxPicks().length > 0 && (
              <button
                onClick={resetLocalTestPicks}
                className="ml-auto shrink-0 text-[12.5px] font-medium text-accent-ink underline-offset-2 transition-opacity hover:opacity-70 hover:underline"
              >
                Reset test picks
              </button>
            )}
          </div>
        )}

        {error && (
          <p className="mt-4 shrink-0 rounded-lg border border-hairline-strong bg-surface-sunken px-4 py-3 text-[14px] text-ink">
            {error}
          </p>
        )}

        {/* On the clock hero ---------------------------------------------- */}
        {onClockTeam && !board.isComplete && (
          <div className="mt-5 flex shrink-0 flex-wrap items-center gap-6 rounded-2xl bg-surface-inverse px-6 py-5">
            <div className="flex items-center gap-4">
              <TeamBadge team={onClockTeam} size={56} />
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-negative uppercase">
                  <span className="relative flex h-2 w-2" aria-hidden="true">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-negative opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-negative" />
                  </span>
                  On the clock
                  <span className="tabular font-medium normal-case text-white/60">
                    &nbsp;· Pick {board.onTheClock!.pickNumber} · Round{' '}
                    {board.onTheClock!.round}
                  </span>
                </p>
                <p className="mt-1 text-[26px] font-semibold text-ink-inverse">
                  {onClockTeam.name}
                </p>
              </div>
            </div>

            {board.onDeck.length > 0 && (
              <div className="flex min-w-0 items-center gap-3 border-l border-white/10 pl-6">
                <p className="shrink-0 text-[11px] font-semibold tracking-wider text-white/60 uppercase">
                  Next pick
                </p>
                <div className="flex min-w-0 items-center gap-2 overflow-hidden">
                  {board.onDeck.map((team, i) => (
                    // Index in the key too: a team on the turn of a round
                    // picks twice in a row, so its id can repeat here.
                    <span key={`${team.id}-${i}`} className="flex items-center gap-2">
                      {i > 0 && <span className="text-accent">→</span>}
                      <span className="flex items-center gap-1.5 rounded-pill bg-white/[0.07] py-1 pr-3 pl-1">
                        <TeamBadge team={team} size={22} />
                        <span className="whitespace-nowrap text-[13px] font-medium text-ink-inverse">
                          {team.name}
                        </span>
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {board.isComplete && (
          <div className="mt-5 shrink-0 rounded-2xl border border-hairline-strong bg-surface-sunken px-6 py-5 text-center">
            <p className="text-[15px] font-medium text-ink">
              The draft is complete — all {board.totalPicks} players are on a team.
            </p>
          </div>
        )}

        {/* Three zones: on a wide screen these scroll independently, on a
            narrow one they simply stack down the page. -------------------- */}
        <div className="mt-5 grid gap-4 lg:min-h-0 lg:flex-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.85fr)_minmax(0,1fr)]">
          {/* Available players, grouped by position ----------------------- */}
          <section
            aria-labelledby="available-heading"
            className="flex min-h-0 flex-col rounded-lg border border-hairline bg-surface lg:overflow-hidden"
          >
            <div className="flex shrink-0 items-baseline gap-2 border-b border-hairline px-4 py-3">
              <h2 id="available-heading" className="text-[14.5px] font-semibold text-ink">
                Available
              </h2>
              <span className="tabular text-[12.5px] text-ink-tertiary">
                {board.available.length}
              </span>
            </div>

            <div className="px-2.5 py-1.5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
              {board.available.length === 0 ? (
                <p className="px-2 py-4 text-[14px] text-ink-tertiary">
                  Every registered player has been drafted.
                </p>
              ) : (
                availableGroups.map(({ group, players }) => (
                  <div key={group}>
                    <div className="sticky top-0 z-10 flex items-center gap-1.5 bg-surface px-1.5 pt-2.5 pb-1.5">
                      <span className="h-[11px] w-[3px] shrink-0 rounded-full bg-accent" />
                      <span className="text-[11px] font-semibold tracking-wider text-ink-tertiary uppercase">
                        {group}
                      </span>
                      <span className="tabular text-[11px] text-ink-tertiary">
                        · {players.length}
                      </span>
                    </div>
                    {players.map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between gap-3 rounded-lg px-1.5 py-2 hover:bg-surface-sunken"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-medium text-ink">
                            {player.name}
                          </p>
                          <p className="truncate text-[12.5px] text-ink-tertiary">
                            {[
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
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Latest picks --------------------------------------------------- */}
          <section
            aria-labelledby="picks-heading"
            className="flex min-h-0 flex-col rounded-lg border border-hairline bg-surface lg:overflow-hidden"
          >
            <div className="shrink-0 border-b border-hairline px-4 py-3">
              <h2 id="picks-heading" className="text-[14.5px] font-semibold text-ink">
                Latest picks
              </h2>
            </div>

            <div className="px-2.5 py-1.5 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
              {board.picks.length === 0 ? (
                <p className="px-2 py-4 text-[14px] text-ink-tertiary">No picks yet.</p>
              ) : (
                board.picks.map((entry) => {
                  const team = board.teams.find((t) => t.id === entry.teamId)
                  const isLatest = entry.pickNumber === latestPick?.pickNumber
                  return (
                    <div
                      key={entry.pickNumber}
                      className={`flex items-center gap-2.5 rounded-lg px-2 py-2 ${
                        isLatest ? 'bg-accent-wash' : ''
                      }`}
                    >
                      <span
                        className={`tabular w-6 shrink-0 text-[12px] font-semibold ${
                          isLatest ? 'text-accent-ink' : 'text-ink-tertiary'
                        }`}
                      >
                        {entry.pickNumber}
                      </span>
                      <TeamBadge team={team} size={24} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-medium text-ink">
                          {entry.name}
                        </p>
                        <p
                          className={`truncate text-[11.5px] ${
                            isLatest ? 'text-accent-ink' : 'text-ink-tertiary'
                          }`}
                        >
                          {team?.name ?? 'Unassigned'}
                        </p>
                      </div>
                      {entry.jerseyNumber !== null && (
                        <span
                          className={`tabular shrink-0 text-[12px] ${
                            isLatest ? 'text-accent-ink' : 'text-ink-tertiary'
                          }`}
                        >
                          #{entry.jerseyNumber}
                        </span>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </section>

          {/* Rosters ---------------------------------------------------------- */}
          <section
            aria-labelledby="rosters-heading"
            className="flex min-h-0 flex-col rounded-lg border border-hairline bg-surface lg:overflow-hidden"
          >
            <div className="flex shrink-0 items-baseline gap-2 border-b border-hairline px-4 py-3">
              <h2 id="rosters-heading" className="text-[14.5px] font-semibold text-ink">
                Rosters
              </h2>
              <span className="tabular ml-auto text-[11px] text-ink-tertiary">
                {board.teams.length} teams
              </span>
            </div>

            <div className="px-2.5 py-1 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
              {board.teams.map((team) => {
                const onClock = team.id === board.onTheClock?.teamId && !board.isComplete
                return (
                  <div
                    key={team.id}
                    className={`rounded-lg px-2 py-2.5 ${onClock ? 'bg-accent-wash' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <TeamBadge team={team} size={22} />
                      <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink">
                        {team.name}
                      </p>
                      {onClock && (
                        <span className="shrink-0 text-[10px] font-semibold tracking-wider text-accent-ink uppercase">
                          On the clock
                        </span>
                      )}
                      <span className="tabular shrink-0 rounded-pill bg-surface-sunken px-2 py-0.5 text-[11.5px] font-semibold text-ink-tertiary">
                        {team.roster.length}
                      </span>
                    </div>

                    {team.roster.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 pl-[30px]">
                        {team.roster.map((entry) => (
                          <span
                            key={`${entry.pickNumber ?? 'c'}-${entry.name}`}
                            className="font-util text-[11px] text-ink-secondary"
                          >
                            {entry.isCaptain && (
                              <span className="mr-1 bg-ink px-1 text-[9px] font-bold text-ink-inverse">
                                C
                              </span>
                            )}
                            {entry.name}{' '}
                            <span className="text-ink-tertiary">
                              {entry.jerseyNumber !== null ? `#${entry.jerseyNumber}` : '—'}
                            </span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      </div>

      {/* Draft order: a pop-up so it sits on top of the board for a live
          reveal, closed by hand once the admin is happy with it. -------- */}
      <Modal
        isOpen={canSetDraftOrder && !orderModalDismissed}
        onClose={() => setOrderModalDismissed(true)}
        title="Set the draft order"
        size="lg"
      >
        <DraftOrderReveal teams={board.teams} onDone={load} />
      </Modal>

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
