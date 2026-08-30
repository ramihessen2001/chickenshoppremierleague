/**
 * Team types.
 */

import { Player } from './player'

export interface Team {
  /** Slug, e.g. "falcons" -- what the UI and URLs use. */
  id: string
  /** Database UUID, needed when writing games or players. */
  uuid?: string
  name: string
  logoUrl: string
  roster: Player[]
  primaryColor?: string
  /**
   * The sponsor's trading name, e.g. "JAX FISH AND CHICKEN" -- deliberately not
   * the team name. Undefined for a team whose sponsorship has not been sold
   * yet, which is the state most teams start a season in.
   */
  sponsorName?: string
  /** Sponsor logo path. Only meaningful alongside `sponsorName`. */
  sponsorLogoUrl?: string
  /** Kit mockup showing the full set, home and away in one image. */
  kitImageUrl?: string
  createdAt: string
  updatedAt: string
}

/**
 * A team slug.
 *
 * This used to be a union of the six team names, which meant the league could
 * not change its teams without a type error in a dozen files. Teams now live in
 * the database, so this is just a string.
 */
export type TeamId = string
