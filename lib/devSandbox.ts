/**
 * Local-only draft and phase testing.
 *
 * Local dev and the live Vercel site read and write the same Supabase
 * project -- there is no separate "local" database. Testing the draft for
 * real here would draft real players and flip the live phase for every
 * visitor to the site.
 *
 * While running under `next dev` (never in a production build, which is what
 * Vercel deploys), phase changes and draft picks made from the admin UI are
 * kept in this browser's localStorage instead of being written to Supabase.
 * `getLeagueConfig()` and the draft board layer these back on top of the real
 * data when reading, so the site behaves as if the change went through, but
 * nothing ever leaves this machine.
 */

export const devSandboxActive = process.env.NODE_ENV !== 'production'

const STORAGE_KEY = 'cspl-dev-sandbox'

export interface SandboxPick {
  signupId: string
  name: string
  teamId: string
  jerseyNumber: number | null
  pickNumber: number
  draftedAt: string
}

interface SandboxState {
  /** league_config columns overridden locally, e.g. { phase: 'draft' }. */
  config: Record<string, unknown>
  picks: SandboxPick[]
  /** Team ids in draft order, index 0 = pick 1. Null = use the real order. */
  draftOrder: string[] | null
}

const EMPTY_STATE: SandboxState = { config: {}, picks: [], draftOrder: null }

function read(): SandboxState {
  if (!devSandboxActive || typeof window === 'undefined') return EMPTY_STATE
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? { ...EMPTY_STATE, ...JSON.parse(raw) } : EMPTY_STATE
  } catch {
    return EMPTY_STATE
  }
}

function write(state: SandboxState) {
  if (!devSandboxActive || typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function getSandboxConfig(): Record<string, unknown> {
  return read().config
}

export function setSandboxConfig(columns: Record<string, unknown>) {
  const state = read()
  write({ ...state, config: { ...state.config, ...columns } })
}

export function getSandboxPicks(): SandboxPick[] {
  return read().picks
}

export function addSandboxPick(pick: SandboxPick) {
  const state = read()
  write({ ...state, picks: [...state.picks, pick] })
}

/** Removes and returns the most recent local pick, or null if there is none. */
export function undoLastSandboxPick(): SandboxPick | null {
  const state = read()
  if (state.picks.length === 0) return null
  const last = state.picks[state.picks.length - 1]
  write({ ...state, picks: state.picks.slice(0, -1) })
  return last
}

export function getSandboxDraftOrder(): string[] | null {
  return read().draftOrder
}

export function setSandboxDraftOrder(order: string[]) {
  write({ ...read(), draftOrder: order })
}

/** Wipes every locally-drafted pick, phase override and draft order for this browser. */
export function resetSandbox() {
  write(EMPTY_STATE)
}
