/**
 * The live draft board. PUBLIC.
 *
 *   GET -> { teams, available, picks, onTheClock, isComplete }
 *
 * Public because the whole point is that the room can follow the draft on their
 * phones. `signups` holds email addresses and phone numbers and has no RLS read
 * policy, so this route reads it with the service role and projects only what is
 * safe to show: name, position, experience and the requested shirt number.
 * Contact details and notes never leave the server.
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { fail } from '@/lib/apiAuth'
import { DRAFTABLE_STATUSES, roundForPick, teamOnPick } from '@/lib/draft'

/** Never send these to the browser, whatever else changes. */
const PUBLIC_SIGNUP_COLUMNS =
  'id, name, position, experience, jersey_number, status, pick_number, drafted_at, drafted_team_id, player_id'

export interface DraftBoardTeam {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  primaryColor: string | null
  draftPosition: number | null
  roster: { name: string; jerseyNumber: number | null; pickNumber: number }[]
}

export async function GET() {
  const [teamsResult, signupsResult, playersResult] = await Promise.all([
    supabaseAdmin
      .from('teams')
      .select('id, name, slug, logo_url, primary_color, draft_position')
      .order('draft_position', { nullsFirst: false }),
    supabaseAdmin.from('signups').select(PUBLIC_SIGNUP_COLUMNS),
    supabaseAdmin.from('players').select('id, jersey_number'),
  ])

  if (teamsResult.error || signupsResult.error || playersResult.error) {
    console.error(
      'Error loading draft board:',
      teamsResult.error ?? signupsResult.error ?? playersResult.error
    )
    return fail('Failed to load the draft board', 500)
  }

  const numberByPlayer = new Map(
    (playersResult.data ?? []).map((p) => [p.id, p.jersey_number as number | null])
  )

  const signups = signupsResult.data ?? []
  const drafted = signups
    .filter((s) => s.pick_number !== null)
    .sort((a, b) => (a.pick_number as number) - (b.pick_number as number))

  const available = signups
    .filter((s) => s.pick_number === null && DRAFTABLE_STATUSES.includes(s.status))
    .map((s) => ({
      id: s.id,
      name: s.name,
      position: s.position,
      experience: s.experience,
      requestedNumber: s.jersey_number as number | null,
    }))
    // Alphabetical: the board is scanned by name, not by registration time.
    .sort((a, b) => a.name.localeCompare(b.name))

  const teams: DraftBoardTeam[] = (teamsResult.data ?? []).map((team) => ({
    id: team.id,
    name: team.name,
    slug: team.slug,
    logoUrl: team.logo_url,
    primaryColor: team.primary_color,
    draftPosition: team.draft_position,
    roster: drafted
      .filter((s) => s.drafted_team_id === team.id)
      .map((s) => ({
        name: s.name,
        jerseyNumber: s.player_id ? numberByPlayer.get(s.player_id) ?? null : null,
        pickNumber: s.pick_number as number,
      })),
  }))

  // The draft runs until the pool is empty, so the last pick is however many
  // players are in it -- there is no fixed roster size to run out against.
  const totalPicks = drafted.length + available.length
  const nextPick = drafted.length + 1
  const orderable = teams.map((t) => ({ id: t.id, draftPosition: t.draftPosition }))
  const next = teamOnPick(orderable, nextPick, totalPicks)

  // The next few teams after the one on the clock, so the broadcast hero can
  // show what's coming without anyone having to work out the snake order.
  const teamById = new Map(teams.map((t) => [t.id, t]))
  const onDeck = [1, 2, 3]
    .map((offset) => teamOnPick(orderable, nextPick + offset, totalPicks))
    .filter((t): t is NonNullable<typeof t> => t !== null)
    .map((t) => {
      const team = teamById.get(t.id)!
      return { id: team.id, name: team.name, logoUrl: team.logoUrl }
    })

  return NextResponse.json({
    teams,
    available,
    // Most recent first: this feeds the "latest picks" list.
    picks: drafted
      .slice()
      .reverse()
      .map((s) => ({
        pickNumber: s.pick_number as number,
        name: s.name,
        teamId: s.drafted_team_id,
        jerseyNumber: s.player_id ? numberByPlayer.get(s.player_id) ?? null : null,
        draftedAt: s.drafted_at as string | null,
      })),
    onTheClock: next
      ? {
          teamId: next.id,
          pickNumber: nextPick,
          round: roundForPick(
            teams.filter((t) => t.draftPosition !== null).length,
            nextPick
          ),
        }
      : null,
    onDeck,
    isComplete: available.length === 0 && drafted.length > 0,
    totalPicks,
  })
}
