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
import { suggestNumbers } from '@/lib/draft'

interface TradeBody {
  fromTeamId?: string
  toTeamId?: string
  fromPlayerIds?: string[]
  toPlayerIds?: string[]
}

interface MovedPlayer {
  id: string
  name: string
  toTeamName: string
  jerseyNumber: number | null
  /** Set only when the player could not keep the number they arrived with. */
  previousNumber?: number | null
}

interface PlayerRow {
  id: string
  name: string
  team_id: string
  jersey_number: number | null
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
    supabaseAdmin.from('teams').select('id, name').in('id', [fromTeamId, toTeamId]),
    supabaseAdmin.from('players').select('id, name, team_id, jersey_number'),
  ])

  if (teamsResult.error || playersResult.error) {
    console.error('Error reading data for trade:', teamsResult.error ?? playersResult.error)
    return fail('Failed to read the clubs', 500)
  }

  const teams = (teamsResult.data ?? []) as { id: string; name: string }[]
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

  const moved: MovedPlayer[] = []
  for (const { player, destination } of moves) {
    const taken = squads.get(destination.id) ?? []
    const wanted = player.jersey_number

    let jerseyNumber: number | null
    if (wanted === null) {
      jerseyNumber = null
    } else if (!taken.includes(wanted)) {
      jerseyNumber = wanted
    } else {
      jerseyNumber = suggestNumbers(wanted, taken, 1)[0] ?? null
    }

    const { error } = await supabaseAdmin
      .from('players')
      .update({ team_id: destination.id, jersey_number: jerseyNumber })
      .eq('id', player.id)
      // Only if they are still where we thought they were.
      .eq('team_id', player.team_id)

    if (error) {
      console.error('Error moving player in trade:', error)
      return fail(`Failed to move ${player.name}`, 500)
    }

    taken.push(jerseyNumber)
    moved.push({
      id: player.id,
      name: player.name,
      toTeamName: destination.name,
      jerseyNumber,
      ...(jerseyNumber !== wanted ? { previousNumber: wanted } : {}),
    })
  }

  return NextResponse.json({ moved })
}
