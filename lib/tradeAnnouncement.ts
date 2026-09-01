/**
 * The wording of a trade announcement.
 *
 * Kept apart from the route that writes it so the phrasing can be read and
 * changed without going near the database, the way lib/draft.ts holds the
 * snake order. Pure and dependency-free.
 *
 * Written in the style of Fabrizio Romano's transfer posts, which is a
 * particular shape rather than just emoji: the deal in the first line with the
 * catchphrase, then one fact per paragraph, then the tick to confirm it is
 * done. Kept spare on purpose -- the joke stops being funny if every line is
 * shouting.
 */

export interface AnnouncementClub {
  name: string
  /** Used in the "(Now ...)" tags, where the full name would run long. */
  shortName?: string | null
}

export interface AnnouncementMove {
  name: string
  jerseyNumber: number | null
  /** Set only where the receiving club could not honour their old number. */
  previousNumber?: number | null
}

/** "CENTRAL SPORTING CLUB OF PURO (CSCP)", or just the name when there is no short one. */
function headingLabel(club: AnnouncementClub): string {
  const full = club.name.toUpperCase()
  const short = club.shortName?.toUpperCase()
  return short && short !== full ? `${full} (${short})` : full
}

/** The short form, for use inside a sentence where the full name would run long. */
function tagLabel(club: AnnouncementClub): string {
  return (club.shortName || club.name).toUpperCase()
}

/** "A", "A and B", "A, B and C" -- these are read aloud, not scanned. */
function names(moves: AnnouncementMove[]): string {
  const list = moves.map((m) => m.name)
  if (list.length <= 1) return list[0] ?? ''
  return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`
}

/**
 * The post body for a completed trade.
 *
 * `fromMoves` leave `fromClub` for `toClub`, and `toMoves` the other way. Both
 * sides are optional: a club can send players without getting any back, and
 * that is announced as a transfer rather than dressed up as a trade with an
 * empty half.
 *
 * Returns null when nothing moved, so the caller has nothing to post.
 */
export function composeTradeAnnouncement(
  fromClub: AnnouncementClub,
  toClub: AnnouncementClub,
  fromMoves: AnnouncementMove[],
  toMoves: AnnouncementMove[]
): string | null {
  if (fromMoves.length === 0 && toMoves.length === 0) return null

  /*
   * The headline leads with the bigger side of the deal, so a two-for-one
   * reads as the two arriving rather than the one leaving.
   *
   * Only two clubs matter after that: the one the headline players are
   * leaving, and the one they are joining. Anyone going the other way is by
   * definition leaving `leadTo` and joining `leadFrom`, so there is no third
   * direction to track.
   */
  const leadFromLeft = fromMoves.length >= toMoves.length
  const lead = leadFromLeft ? fromMoves : toMoves
  const other = leadFromLeft ? toMoves : fromMoves
  const leadFrom = leadFromLeft ? fromClub : toClub
  const leadTo = leadFromLeft ? toClub : fromClub

  const parts: string[] = [`🚨 ${names(lead)} to ${tagLabel(leadTo)} — here we go!`]

  if (other.length > 0) {
    parts.push(
      `Agreement reached between ${headingLabel(leadFrom)} and ${headingLabel(leadTo)}.`
    )
    parts.push(
      other.length === 1
        ? `${names(other)} makes the move in the opposite direction, joining ${tagLabel(leadFrom)}.`
        : `${names(other)} go the other way to ${tagLabel(leadFrom)} as part of the deal.`
    )
  } else {
    // Nobody coming back. Romano would call this a straight move rather than
    // leave the reader waiting for the other half.
    parts.push(
      `A straight move from ${headingLabel(leadFrom)}, with no player going the other way.`
    )
  }

  // Only worth a line when a number actually had to change -- otherwise this
  // is noise on every post.
  const renumbered = [...fromMoves, ...toMoves].filter(
    (m) => m.previousNumber !== undefined && m.previousNumber !== m.jerseyNumber
  )
  if (renumbered.length > 0) {
    parts.push(
      renumbered
        .map((m) =>
          m.jerseyNumber === null
            ? `Squad number to be confirmed for ${m.name}.`
            : `Squad number confirmed: ${m.name} will wear #${m.jerseyNumber}` +
              (m.previousNumber === null ? '.' : `, previously #${m.previousNumber}.`)
        )
        .join('\n')
    )
  }

  parts.push('Deal completed. ✅')

  return parts.join('\n\n')
}
