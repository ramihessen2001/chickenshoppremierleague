/**
 * The wording of a trade announcement.
 *
 * Kept apart from the route that writes it so the phrasing can be read and
 * changed without going near the database, the way lib/draft.ts holds the
 * snake order. Pure and dependency-free.
 *
 * The shape follows the announcements the commissioner was already writing by
 * hand on the board -- clubs in caps, players as they are spelled on the
 * roster, and the two sides separated by FOR:
 *
 *   CENTRAL SPORTING CLUB OF PURO (CSCP) and S.C RAMALLAH have executed a trade:
 *
 *   Momen (Now S.C RAMALLAH)
 *
 *   FOR
 *
 *   Mohammad Elyas Mohammadi (Now CSCP)
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

/** What a "(Now ...)" tag says: the short name where there is one. */
function tagLabel(club: AnnouncementClub): string {
  return (club.shortName || club.name).toUpperCase()
}

function moveLines(moves: AnnouncementMove[], destination: AnnouncementClub): string {
  return moves.map((m) => `${m.name} (Now ${tagLabel(destination)})`).join('\n')
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

  const parts: string[] = []

  if (fromMoves.length > 0 && toMoves.length > 0) {
    parts.push(`${headingLabel(fromClub)} and ${headingLabel(toClub)} have executed a trade:`)
    parts.push(moveLines(fromMoves, toClub))
    parts.push('FOR')
    parts.push(moveLines(toMoves, fromClub))
  } else {
    // One-way. Calling this a trade would be wrong, and an empty half after
    // FOR reads like something failed to save.
    const sending = fromMoves.length > 0 ? fromClub : toClub
    const receiving = fromMoves.length > 0 ? toClub : fromClub
    const moves = fromMoves.length > 0 ? fromMoves : toMoves

    parts.push(
      moves.length === 1
        ? `${headingLabel(sending)} have sent ${moves[0].name} to ${headingLabel(receiving)}.`
        : `${headingLabel(sending)} have sent the following to ${headingLabel(receiving)}:`
    )
    if (moves.length > 1) parts.push(moveLines(moves, receiving))
  }

  // Only worth a line when a number actually had to change -- otherwise this
  // is noise on every post.
  const renumbered = [...fromMoves, ...toMoves].filter(
    (m) => m.previousNumber !== undefined && m.previousNumber !== m.jerseyNumber
  )
  if (renumbered.length > 0) {
    parts.push(
      renumbered
        .map(
          (m) =>
            `${m.name} now wears #${m.jerseyNumber ?? 'TBD'}` +
            (m.previousNumber === null ? '.' : ` (was #${m.previousNumber}).`)
        )
        .join('\n')
    )
  }

  return parts.join('\n\n')
}
