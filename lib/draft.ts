/**
 * Snake draft order and shirt numbers.
 *
 * Pure functions with no database access, so the rules can be reasoned about
 * (and tested) on their own. Both the pick API and the board UI derive their
 * state from these, which is what keeps the admin console and the public board
 * showing the same thing.
 */

/** The minimum a team needs for the order; the real row carries much more. */
export interface DraftTeam {
  id: string
  name: string
  /** Slot in the order, 1..N. */
  draftPosition: number
}

/** Shirt numbers a player can register for -- matches the signups CHECK. */
export const MIN_JERSEY = 0
export const MAX_JERSEY = 99

/**
 * Who can be picked.
 *
 * Registrations that were withdrawn or pushed onto the waitlist are not in the
 * pool; `drafted` players have already gone. Pending is included deliberately:
 * on the night you draft whoever turned up, and chasing the fee is a separate
 * job from filling the rosters.
 */
export const DRAFTABLE_STATUSES = ['confirmed', 'pending']

/**
 * Whether a registration can still be picked.
 *
 * Status alone is not enough. A captain is put on their team before the draft
 * starts, which links their registration to a player row while leaving it
 * `confirmed` and unpicked -- so on status alone they would sit in the pool
 * and could be drafted onto a second team. Anyone already holding a roster
 * place is out, however they got there.
 */
export function isDraftable(signup: {
  status: string
  pick_number: number | null
  player_id: string | null
}): boolean {
  return (
    signup.pick_number === null &&
    signup.player_id === null &&
    DRAFTABLE_STATUSES.includes(signup.status)
  )
}

/**
 * Teams in draft order, lowest `draftPosition` first.
 *
 * Teams without a position are dropped rather than sorted to the end: a team
 * with no slot is not in the draft, and silently giving it the last pick would
 * be worse than leaving it out.
 */
export function draftOrder<T extends { draftPosition: number | null }>(
  teams: T[]
): T[] {
  return teams
    .filter((team): team is T & { draftPosition: number } => team.draftPosition !== null)
    .sort((a, b) => a.draftPosition - b.draftPosition)
}

/** The minimum shape the snake needs from a team. */
export interface DraftableTeam {
  draftPosition: number | null
  /**
   * How many rounds this team takes part in, or null for every round.
   *
   * Set where a club starts the draft with players already on its books and so
   * needs fewer picks to reach the same squad size -- Fall 2026 gives Dakar
   * and Mansoura three players each before a pick is made, so they take part
   * in six rounds while everyone else keeps going.
   */
  draftRounds?: number | null
}

/** Nothing sane reaches this; it only stops a malformed order looping forever. */
const MAX_ROUNDS = 200

function roundsFor(team: DraftableTeam): number {
  return team.draftRounds ?? Number.POSITIVE_INFINITY
}

/**
 * Walks the draft one pick at a time.
 *
 * Modular arithmetic used to be enough here -- with a fixed set of teams, the
 * team on pick N is a division and a remainder. It stops working the moment a
 * team can finish early, because every later round has a different length, so
 * the sequence is generated rather than calculated.
 *
 * Odd rounds run down the order and even rounds back up it, among whichever
 * teams are still picking.
 */
function* pickSequence<T extends DraftableTeam>(
  teams: T[],
  maxPicks?: number
): Generator<{ team: T; round: number; pickNumber: number }> {
  const order = draftOrder(teams)
  if (order.length === 0) return

  let pickNumber = 0
  for (let round = 1; round <= MAX_ROUNDS; round++) {
    const active = order.filter((team) => roundsFor(team) >= round)
    if (active.length === 0) return

    const sequence = round % 2 === 1 ? active : [...active].reverse()
    for (const team of sequence) {
      pickNumber++
      if (maxPicks !== undefined && pickNumber > maxPicks) return
      yield { team, round, pickNumber }
    }
  }
}

/**
 * Which team makes pick `pickNumber` (1-indexed), and in which round.
 *
 * Returns null when there are no teams, once every roster is full, or once
 * every team has used the rounds it was given.
 */
export function resolvePick<T extends DraftableTeam>(
  teams: T[],
  pickNumber: number,
  maxPicks?: number
): { team: T; round: number } | null {
  if (pickNumber < 1) return null
  for (const slot of pickSequence(teams, maxPicks)) {
    if (slot.pickNumber === pickNumber) return { team: slot.team, round: slot.round }
  }
  return null
}

/** Which team makes pick `pickNumber` (1-indexed), or null. */
export function teamOnPick<T extends DraftableTeam>(
  teams: T[],
  pickNumber: number,
  maxPicks?: number
): T | null {
  return resolvePick(teams, pickNumber, maxPicks)?.team ?? null
}

/**
 * The round a pick falls in, 1-indexed, for display.
 *
 * Takes the teams rather than a count, because rounds stop being a fixed size
 * once a team can finish early.
 */
export function roundForPick<T extends DraftableTeam>(
  teams: T[],
  pickNumber: number
): number {
  return resolvePick(teams, pickNumber)?.round ?? 1
}

/**
 * Shirt numbers still free on a team.
 *
 * `taken` is what the roster already uses; nulls in it are ignored, since an
 * unassigned number blocks nothing.
 */
export function freeNumbers(taken: (number | null)[]): number[] {
  const used = new Set(taken.filter((n): n is number => n !== null))
  const free: number[] = []
  for (let n = MIN_JERSEY; n <= MAX_JERSEY; n++) {
    if (!used.has(n)) free.push(n)
  }
  return free
}

/**
 * The numbers to offer when a player's registered number is already taken,
 * nearest first.
 *
 * Ordered by distance from what they asked for, so a player who wanted 7 is
 * offered 6 and 8 before 70 -- the numbers they are most likely to accept are
 * the ones they see first.
 */
export function suggestNumbers(
  requested: number | null,
  taken: (number | null)[],
  limit = 8
): number[] {
  const free = freeNumbers(taken)
  if (requested === null) return free.slice(0, limit)

  return [...free]
    .sort((a, b) => Math.abs(a - requested) - Math.abs(b - requested) || a - b)
    .slice(0, limit)
}

/** Whether a number can be given to a player on this team. */
export function isNumberFree(
  number: number,
  taken: (number | null)[]
): boolean {
  if (!Number.isInteger(number) || number < MIN_JERSEY || number > MAX_JERSEY) {
    return false
  }
  return !taken.includes(number)
}
