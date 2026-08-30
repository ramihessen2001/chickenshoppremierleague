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
import { isDraftable, roundForPick, teamOnPick } from '@/lib/draft'

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
  /** Captains have no pickNumber -- they were placed, not picked. */
  roster: {
    name: string
    jerseyNumber: number | null
    pickNumber: number | null
    isCaptain?: boolean
  }[]
}

export async function GET() {
  const [teamsResult, signupsResult, playersResult] = await Promise.all([
    supabaseAdmin
      .from('teams')
      .select('id, name, slug, logo_url, primary_color, draft_position')
      .order('draft_position', { nullsFirst: false }),
    supabaseAdmin.from('signups').select(PUBLIC_SIGNUP_COLUMNS),
    // `*` rather than a column list: is_captain arrives in migration 015, and
    // naming it explicitly fails the whole query on a database that has not
    // been migrated -- which would take the draft board down rather than just
    // show no captains. The roster is small; the extra columns cost nothing.
    supabaseAdmin.from('players').select('*'),
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
  const captainsByTeam = (playersResult.data ?? []).filter((p) => p.is_captain === true)

  const signups = signupsResult.data ?? []
  const drafted = signups
    .filter((s) => s.pick_number !== null)
    .sort((a, b) => (a.pick_number as number) - (b.pick_number as number))

  const available = signups
    .filter((s) =>
      isDraftable({
        status: s.status,
        pick_number: s.pick_number as number | null,
        player_id: (s.player_id as string | null) ?? null,
      })
    )
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
    // Captain first, then the picks in the order they were made: that is how
    // the panel reads on the night, and a captain has no pick number to sort by.
    roster: [
      ...captainsByTeam
        .filter((c) => c.team_id === team.id)
        .map((c) => ({
          name: c.name as string,
          jerseyNumber: c.jersey_number as number | null,
          pickNumber: null,
          isCaptain: true,
        })),
      ...drafted
        .filter((s) => s.drafted_team_id === team.id)
        .map((s) => ({
          name: s.name,
          jerseyNumber: s.player_id ? numberByPlayer.get(s.player_id) ?? null : null,
          pickNumber: s.pick_number as number,
        })),
    ],
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
