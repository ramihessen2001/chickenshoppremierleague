/**
 * The wording of a full-time result announcement.
 *
 * Posted automatically to the commissioner's board the moment a game's box
 * score is saved as completed for the first time -- see lib/boxScore.ts.
 * Same shape as lib/tradeAnnouncement.ts: a headline, one fact per paragraph,
 * a tick to confirm it's done. Pure and dependency-free, kept apart from the
 * write path for the same reason the trade wording is.
 */

export interface AnnouncementClub {
  name: string
  /** Used in the score line, where the full name would run long. */
  shortName?: string | null
}

export interface AnnouncementScorer {
  name: string
  count: number
}

function headingLabel(club: AnnouncementClub): string {
  const full = club.name.toUpperCase()
  const short = club.shortName?.toUpperCase()
  return short && short !== full ? `${full} (${short})` : full
}

function tagLabel(club: AnnouncementClub): string {
  return (club.shortName || club.name).toUpperCase()
}

/** "Ahmed", "Ahmed x2, Yusuf" -- x2 only shown once a player has more than one. */
function scorerList(scorers: AnnouncementScorer[]): string {
  return scorers.map((s) => (s.count > 1 ? `${s.name} x${s.count}` : s.name)).join(', ')
}

export function composeResultAnnouncement(
  home: AnnouncementClub,
  away: AnnouncementClub,
  homeScore: number,
  awayScore: number,
  homeScorers: AnnouncementScorer[],
  awayScorers: AnnouncementScorer[],
  playerOfGameName?: string | null
): string {
  const parts: string[] = [
    `⏱️ FULL-TIME: ${tagLabel(home)} ${homeScore}-${awayScore} ${tagLabel(away)}`,
    `${headingLabel(home)} v ${headingLabel(away)} finishes ${homeScore}-${awayScore}.`,
  ]

  if (homeScorers.length > 0 || awayScorers.length > 0) {
    const sides = [
      homeScorers.length > 0 ? `${scorerList(homeScorers)} (${tagLabel(home)})` : null,
      awayScorers.length > 0 ? `${scorerList(awayScorers)} (${tagLabel(away)})` : null,
    ].filter((side): side is string => side !== null)
    parts.push(`⚽ ${sides.join(' · ')}`)
  }

  if (playerOfGameName) {
    parts.push(`Man of the match: ${playerOfGameName}.`)
  }

  parts.push('Full time. ✅')

  return parts.join('\n\n')
}
