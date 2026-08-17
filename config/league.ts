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

  /**
   * The Puro wordmark. Wide -- roughly 3.2:1 -- so it needs a wide slot, not a
   * square one. The header used to carry it; it now shows the league crest
   * instead. Kept for when a Puro mark is wanted somewhere again.
   */
  wordmarkUrl: '/images/puro_wordmark.png',

  /** White version of the wordmark, for dark surfaces. */
  wordmarkWhiteUrl: '/images/puro_wordmark_white.png',

  /**
   * The league crest, shown in the header and on the share card. Portrait
   * (3:4), so height is what you set -- give it width auto.
   */
  crestUrl: '/images/league_logo.svg',

  /**
   * The at-a-glance facts shown beside the registration form while signups are
   * open. Edited by hand each season: unlike the week count and current week,
   * none of this is in `league_config`. A newline in a value becomes a line
   * break on the page.
   */
  details: [
    [
      'Location',
      'Islamic Center of Northeast Florida (ICNEF)\n2333 St Johns Bluff Rd S, Jacksonville, FL 32246',
    ],
    ['Ages allowed', '14–25'],
    ['League dates', 'September 28, 2026 – November 27, 2026'],
    [
      'Format',
      '7 Week League Format\n2 Week Playoffs\nAll Teams are drafted on August 29, 2026',
    ],
    [
      'Matchdays',
      'Every Monday and Wednesday, 6:00–9:00 PM (Each team plays once a week)',
    ],
    ['Sign-up fee', '$40 (Payment methods are shown after completing registration)'],
    // The places/waitlist row is deliberately not listed: the cap is enforced
    // from `rosterCap` below, and the form says so itself once it is reached.
  ] as [string, string][],

  /**
   * Last day to register, ISO. The hero counts down to this, so the deadline is
   * written once here rather than restated in copy that would go stale.
   */
  registrationDeadline: '2026-08-28',

  /**
   * How many players the league has room for.
   *
   * Counted in *confirmed* signups, not registrations: people register far
   * more freely than they pay, so the total is always the larger and much
   * softer number. Once this many are confirmed, new registrations are taken
   * as waitlisted rather than refused.
   */
  rosterCap: 64,

  /**
   * How the sign-up fee is paid. Shown only on the confirmation panel after a
   * registration goes through, which is why the details table above just says
   * the amount.
   */
  payment: {
    amount: '$40',
    methods: [
      { label: 'Zelle', handle: 'moussawood2007@gmail.com' },
      { label: 'Cash App', handle: '$MoussaWood' },
      { label: 'Venmo', handle: '@Moussa-Wood' },
    ],
  },

  /**
   * Where the "buy a kit" button points, or null to hide it everywhere.
   * Currently hidden. The previous season's shop link, for when it returns:
   * https://purofc.com/products/cspl-ls-kit
   */
  jerseyShopUrl: null as string | null,

  /** Branding for the man-of-the-match award. */
  manOfTheMatch: {
    label: 'Puro Man of The Match',
    // The dark wordmark: these badges sit on white and light grey surfaces, so
    // the white version was invisible after the redesign.
    badgeImageUrl: '/images/puro_wordmark.png',
  },

  /**
   * Whether the homepage shows this week's fixtures and the stat leaders once
   * `phase` reaches "season". Off for the start of a new season: `games` and
   * `game_statistics` still hold last season's rows (there is no per-season
   * archive table yet), so turning these on before real games are scheduled
   * would show last year's results as if they were this year's. Flip back on
   * once this season's fixtures exist.
   */
  showHomeFixtures: false,
  showHomeStats: false,
}

/** Fallback logo path for a team with no logo_url set in the database. */
export function fallbackTeamLogo(slug: string): string {
  return `/images/teams/${slug}.png`
}
