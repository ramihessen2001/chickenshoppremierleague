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
