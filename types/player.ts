/**
 * Player types.
 */

export interface Player {
  id: string
  name: string
  /** Null when no shirt number has been assigned yet -- displayed as "TBD". */
  jerseyNumber: number | null
  /** Team slug in UI code, team UUID in write payloads. */
  teamId: string
  isActive: boolean
  /**
   * Captains are placed on their team before the draft rather than picked in
   * it, so they are on a roster while their registration is still sitting in
   * the signups table undrafted.
   */
  isCaptain?: boolean
  /** Goalkeeper | Defender | Midfielder | Forward | Any. See lib/positions.ts. */
  position?: string
  /** Age at registration. Null for a player added by hand without one. */
  age?: number | null
  /**
   * An explicit portrait path. Null is the normal case -- the profile then
   * looks for a file named after the player, and falls back to initials.
   */
  headshotUrl?: string | null
  createdAt: string
  updatedAt: string
}

/** How a shirt number should read on screen. */
export function displayJersey(jerseyNumber: number | null | undefined): string {
  return jerseyNumber === null || jerseyNumber === undefined
    ? 'TBD'
    : String(jerseyNumber)
}
