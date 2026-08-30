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
  /** Forward | Midfielder | Defender | Goalkeeper */
  position?: string
  createdAt: string
  updatedAt: string
}

/** How a shirt number should read on screen. */
export function displayJersey(jerseyNumber: number | null | undefined): string {
  return jerseyNumber === null || jerseyNumber === undefined
    ? 'TBD'
    : String(jerseyNumber)
}
