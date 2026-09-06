/**
 * Trade players between two clubs. Admin only.
 *
 *   POST -> { fromTeamId, toTeamId, fromPlayerIds: string[], toPlayerIds: string[] }
 *
 * Not necessarily even: either side may send nobody, so this covers a straight
 * swap, a two-for-one, and a plain move to another club.
 *
 * Only `players.team_id` moves. `signups.drafted_team_id` is deliberately left
 * alone -- it records who drafted a player, which stays true after they are
 * traded. Migration 020 is the exception, and for a different reason: it fixed
 * a pick recorded against the wrong club, which is a correction, not a trade.
 *
 * Shirt numbers are the awkward part, since they are unique within a club. A
 * player keeps their number where it is free on the club they are joining, and
 * takes the nearest free one where it is not -- the same rule the draft uses
 * when a pick's registered number is taken. Every change is reported back, so
 * the admin sees it here rather than discovering it on the team page later.
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { fail, readJson, requireAdmin } from '@/lib/apiAuth'
import { isNumberFree, suggestNumbers } from '@/lib/draft'
import { composeTradeAnnouncement } from '@/lib/tradeAnnouncement'

interface TradeBody {
  fromTeamId?: string
  toTeamId?: string
  fromPlayerIds?: string[]
  toPlayerIds?: string[]
  /** Post the trade to the commissioner's board. Defaults to true. */
  announce?: boolean
  /**
   * Shirt numbers chosen by the admin, by player id, answering a previous
   * `needsNumbers` response. Null means leave them without one for now.
   */
  numbers?: Record<string, number | null>
}

interface MovedPlayer {
  id: string
  name: string
  toTeamName: string
  jerseyNumber: number | null
  /** Set only when the player could not keep the number they arrived with. */
  previousNumber?: number | null
  /** True when this player was their old club's captain. */
  wasCaptain?: boolean
}

interface PlayerRow {
  id: string
  name: string
  team_id: string
  jersey_number: number | null
  is_captain: boolean | null
}

/** What a player looked like before the trade, so a failure can be undone. */
interface PriorState {
  id: string
  team_id: string
  jersey_number: number | null
  is_captain: boolean | null
}

export async function POST(request: Request) {
  const denied = await requireAdmin()
  if (denied) return denied

  const body = await readJson<TradeBody>(request)
  const fromTeamId = body?.fromTeamId
  const toTeamId = body?.toTeamId
  const fromPlayerIds = body?.fromPlayerIds ?? []
  const toPlayerIds = body?.toPlayerIds ?? []

  if (!fromTeamId || !toTeamId) return fail('Both clubs are required')
  if (fromTeamId === toTeamId) return fail('Pick two different clubs')
  if (fromPlayerIds.length === 0 && toPlayerIds.length === 0) {
    return fail('Choose at least one player to move')
  }

  const [teamsResult, playersResult] = await Promise.all([
    // `*` so short_name comes along for the announcement without naming a
    // column that an unmigrated database would reject.
    supabaseAdmin.from('teams').select('*').in('id', [fromTeamId, toTeamId]),
    supabaseAdmin.from('players').select('*'),
  ])

  if (teamsResult.error || playersResult.error) {
    console.error('Error reading data for trade:', teamsResult.error ?? playersResult.error)
    return fail('Failed to read the clubs', 500)
  }

  const teams = (teamsResult.data ?? []) as {
    id: string
    name: string
    short_name?: string | null
  }[]
  const players = (playersResult.data ?? []) as PlayerRow[]

  const fromTeam = teams.find((t) => t.id === fromTeamId)
  const toTeam = teams.find((t) => t.id === toTeamId)
  if (!fromTeam || !toTeam) return fail('One of those clubs no longer exists', 404)

  const byId = new Map(players.map((p) => [p.id, p]))

  // Every named player must exist and still be on the club sending them --
  // otherwise a stale page could move someone who has already been traded.
  const moves: { player: PlayerRow; destination: { id: string; name: string } }[] = []
  for (const [ids, owner, destination] of [
    [fromPlayerIds, fromTeam, toTeam],
    [toPlayerIds, toTeam, fromTeam],
  ] as const) {
    for (const id of ids) {
      const player = byId.get(id)
      if (!player) return fail('One of those players no longer exists', 404)
      if (player.team_id !== owner.id) {
        return fail(
          `${player.name} is not on ${owner.name} any more — reload and try again`,
          409
        )
      }
      moves.push({ player, destination })
    }
  }

  /*
   * Numbers are worked out against a running picture of both squads rather
   * than the one we read: in a swap each club loses and gains players at once,
   * so a number freed by someone leaving is available to whoever arrives.
   */
  const squads = new Map<string, (number | null)[]>()
  for (const team of [fromTeam, toTeam]) {
    const leaving = new Set(
      moves.filter((m) => m.player.team_id === team.id).map((m) => m.player.id)
    )
    squads.set(
      team.id,
      players.filter((p) => p.team_id === team.id && !leaving.has(p.id)).map((p) => p.jersey_number)
    )
  }

  /*
   * Every write is recorded so a failure part-way through can be undone.
   *
   * Without this a four-player swap that fails on the third move leaves two
   * players already on their new clubs and no way to tell which half applied.
   * The draft's pick route rolls back for the same reason. Postgres would give
   * us a real transaction, but the REST client cannot open one, so the undo is
   * done by hand.
   */
  const applied: PriorState[] = []
  const rollback = async () => {
    for (const prior of [...applied].reverse()) {
      const { error } = await supabaseAdmin
        .from('players')
        .update({
          team_id: prior.team_id,
          jersey_number: prior.jersey_number,
          is_captain: prior.is_captain,
        })
        .eq('id', prior.id)
      if (error) console.error('Rollback failed for player', prior.id, error)
    }
  }

  /*
   * Settle every shirt number before writing anything.
   *
   * The old behaviour was to quietly hand an arriving player the nearest free
   * number when theirs was taken. Nothing broke, which was the problem: a
   * number changed without anyone being told, and the first sign of it could
   * be a shirt printed wrong. The draft asks rather than guesses, and a trade
   * should too.
   */
  const chosen = body?.numbers ?? {}
  const needsNumbers: {
    playerId: string
    playerName: string
    teamName: string
    requested: number | null
    heldBy: string
    suggestions: number[]
  }[] = []
  const resolved = new Map<string, number | null>()

  for (const { player, destination } of moves) {
    const taken = squads.get(destination.id) ?? []
    const wanted = player.jersey_number

    // An answer from a previous attempt wins, as long as it is still free.
    if (Object.prototype.hasOwnProperty.call(chosen, player.id)) {
      const pick = chosen[player.id]
      if (pick === null) {
        resolved.set(player.id, null)
        continue
      }
      if (!isNumberFree(pick, taken)) {
        return fail(`#${pick} is not free on ${destination.name}`, 409)
      }
      resolved.set(player.id, pick)
      taken.push(pick)
      continue
    }

    if (wanted === null || !taken.includes(wanted)) {
      resolved.set(player.id, wanted)
      if (wanted !== null) taken.push(wanted)
      continue
    }

    // Taken by somebody who is staying put -- the admin has to decide.
    const holder = players.find(
      (p) => p.team_id === destination.id && p.jersey_number === wanted
    )
    needsNumbers.push({
      playerId: player.id,
      playerName: player.name,
      teamName: destination.name,
      requested: wanted,
      heldBy: holder?.name ?? 'someone already there',
      suggestions: suggestNumbers(wanted, taken),
    })
  }

  if (needsNumbers.length > 0) {
    // Nothing has been written at this point, so this is a question, not a
    // half-finished trade.
    return NextResponse.json({ needsNumbers }, { status: 409 })
  }

  /*
   * Written in two passes, and the reason is the UNIQUE(team_id, jersey_number)
   * constraint.
   *
   * The numbers settled above are correct for the finished trade, but the
   * database checks that constraint on every single UPDATE, not at the end. In
   * a straight swap of two players who both wear #7, moving the first one over
   * lands them on a club where the second is still wearing #7 -- and the write
   * is rejected even though the final state would have been perfectly valid.
   * Fourteen of the twenty-four numbers in this league are worn on more than
   * one club, so that is most swaps, not an edge case.
   *
   * So: park everyone on their new club with no number at all, then hand the
   * numbers out. Postgres treats NULLs as distinct in a UNIQUE constraint, so
   * the parking pass cannot collide with anything, and by the time numbers are
   * assigned nobody is still holding one they are about to give up.
   */

  // Pass one: move them, with no number.
  for (const { player, destination } of moves) {
    const { data: updated, error } = await supabaseAdmin
      .from('players')
      .update({
        team_id: destination.id,
        jersey_number: null,
        // A captaincy does not travel with the player. They were captain of the
        // club they are leaving, and who leads the club they are joining is
        // that club's decision.
        is_captain: false,
      })
      .eq('id', player.id)
      // Only if they are still where we thought they were.
      .eq('team_id', player.team_id)
      // Without select() a zero-row update returns no error, so a player moved
      // by someone else in the meantime would silently not move at all -- and
      // the announcement would say they had.
      .select('id')

    if (error) {
      console.error('Error moving player in trade:', error)
      await rollback()
      return fail(`Failed to move ${player.name} — nothing was changed`, 500)
    }

    if (!updated || updated.length === 0) {
      await rollback()
      return fail(
        `${player.name} was moved by someone else while this trade was open — nothing was changed. Reload and try again.`,
        409
      )
    }

    applied.push({
      id: player.id,
      team_id: player.team_id,
      jersey_number: player.jersey_number,
      is_captain: player.is_captain,
    })
  }

  // Pass two: hand out the numbers, now that none of them are held hostage.
  const moved: MovedPlayer[] = []
  for (const { player, destination } of moves) {
    const wanted = player.jersey_number
    // Settled in the pre-flight above, so nothing is decided here.
    const jerseyNumber = resolved.get(player.id) ?? null

    if (jerseyNumber !== null) {
      const { error } = await supabaseAdmin
        .from('players')
        .update({ jersey_number: jerseyNumber })
        .eq('id', player.id)

      if (error) {
        // 23505 here would mean the number was free when we worked it out and
        // taken by the time we wrote it -- worth naming, because everything
        // else in this handler reads as a generic failure.
        console.error('Error assigning a shirt number in trade:', error)
        await rollback()
        return fail(
          error.code === '23505'
            ? `#${jerseyNumber} was taken on ${destination.name} before the trade finished — nothing was changed.`
            : `Failed to give ${player.name} a number — nothing was changed`,
          error.code === '23505' ? 409 : 500
        )
      }
    }

    moved.push({
      id: player.id,
      name: player.name,
      toTeamName: destination.name,
      jerseyNumber,
      ...(jerseyNumber !== wanted ? { previousNumber: wanted } : {}),
      ...(player.is_captain ? { wasCaptain: true } : {}),
    })
  }

  /*
   * The board post is written last and its failure is swallowed on purpose:
   * the players have already moved, and refusing the whole request at this
   * point would report a failure for a trade that did in fact happen. The
   * response says whether it was posted, so the admin can write one by hand
   * if it was not.
   */
  let announced = false
  if (body?.announce !== false) {
    const announcement = composeTradeAnnouncement(
      { name: fromTeam.name, shortName: fromTeam.short_name },
      { name: toTeam.name, shortName: toTeam.short_name },
      moved.filter((m) => m.toTeamName === toTeam.name),
      moved.filter((m) => m.toTeamName === fromTeam.name)
    )

    if (announcement) {
      const { error } = await supabaseAdmin
        .from('commissioner_posts')
        .insert({ body: announcement, media_type: 'none' })

      if (error) console.error('Trade went through but the board post failed:', error)
      else announced = true
    }
  }

  return NextResponse.json({ moved, announced })
}
