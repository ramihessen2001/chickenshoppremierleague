/**
 * League identity.
 *
 * Anything here is branding that does not change during a season. Season-level
 * values (season label, week count, start/end dates, current week) live in the
 * `league_config` table so they can be changed without a redeploy.
 *
 * Teams are NOT listed here -- they are read from the database at runtime, so
 * adding or renaming a team is data entry rather than a code change.
 */

export const LEAGUE = {
  /** Full name, used in the header and page titles. */
  name: 'Chicken Shop Premier League',

  /** Short form, used where space is tight. */
  shortName: 'CSPL',

  /** Fallback season label, used only if league_config cannot be read. */
  fallbackSeason: 'Fall 2026',

  /** Shown in <meta name="description">. */
  description:
    'Schedules, rosters, standings, statistics and results for the Chicken Shop Premier League.',

  keywords: 'CSPL, Chicken Shop Premier League, soccer league, schedule, standings, stats',

  /** Path to the league crest in /public. */
  logoUrl: '/images/league_logo.png',

  /**
   * Where the "buy a kit" button points, or null to hide it everywhere.
   * Currently hidden. The previous season's shop link, for when it returns:
   * https://purofc.com/products/cspl-ls-kit
   */
  jerseyShopUrl: null as string | null,

  /** Branding for the man-of-the-match award. */
  manOfTheMatch: {
    label: 'Puro Man of The Match',
    badgeImageUrl: '/images/puro_white.png',
  },
}

/** Fallback logo path for a team with no logo_url set in the database. */
export function fallbackTeamLogo(slug: string): string {
  return `/images/teams/${slug}.png`
}
