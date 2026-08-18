/**
 * Archives the current season's rosters, games, stats and standings, then
 * resets the live tables so the next season starts from zero. Admin only.
 *
 *   POST -> { label }   the season being archived, e.g. "Fall 2025"
 *
 * Copies everything first, one row at a time so each archived row's id can
 * be paired directly with the live row it came from -- no bulk-insert
 * correlation guesswork. The live tables are only touched once every copy
 * below has succeeded, so a failure partway through leaves the season
 * un-reset rather than half-archived and half-gone. Teams themselves are
 * not deleted -- their identity (name/logo/colour) carries into next
 * season; draft position is cleared so the next draft starts fresh.
 */

import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { fail, readJson, requireAdmin } from '@/lib/apiAuth'

interface ArchiveBody {
  label?: string
}

/** Inserts one row and returns its new id, or null (and logs) on failure. */
async function insertOne(
  table: string,
  row: Record<string, unknown>
): Promise<string | null> {
  const { data, error } = await supabaseAdmin.from(table).insert(row).select('id').single()
  if (error) {
    console.error(`Error archiving into ${table}:`, error)
    return null
  }
  return data.id as string
}

export async function POST(request: Request) {
  const denied = await requireAdmin()
  if (denied) return denied

  const body = await readJson<ArchiveBody>(request)
  if (!body?.label?.trim()) return fail('label is required')
  const label = body.label.trim()

  // ---- Read everything live, up front. -----------------------------------
  const [teamsResult, playersResult, gamesResult, statsResult, standingsResult] =
    await Promise.all([
      supabaseAdmin.from('teams').select('*'),
      supabaseAdmin.from('players').select('*'),
      supabaseAdmin.from('games').select('*'),
      supabaseAdmin.from('game_statistics').select('*'),
      supabaseAdmin.from('standings').select('*'),
    ])

  const readError =
    teamsResult.error ||
    playersResult.error ||
    gamesResult.error ||
    statsResult.error ||
    standingsResult.error
  if (readError) {
    console.error('Error reading live data to archive:', readError)
    return fail('Failed to read the current season', 500)
  }

  const teams = teamsResult.data ?? []
  const players = playersResult.data ?? []
  const games = gamesResult.data ?? []
  const stats = statsResult.data ?? []
  const standingsRows = standingsResult.data ?? []

  // ---- Copy phase: nothing below is deleted until this all succeeds. -----
  const archiveSeasonId = await insertOne('archive_seasons', { label })
  if (!archiveSeasonId) return fail('Failed to start the archive', 500)

  const teamIdMap = new Map<string, string>() // live id -> archive id
  for (const team of teams) {
    const archiveId = await insertOne('archive_teams', {
      archive_season_id: archiveSeasonId,
      name: team.name,
      slug: team.slug,
      logo_url: team.logo_url,
      primary_color: team.primary_color,
      display_order: team.display_order,
    })
    if (!archiveId) return fail(`Failed to archive team "${team.name}"`, 500)
    teamIdMap.set(team.id, archiveId)
  }

  const playerIdMap = new Map<string, string>()
  for (const player of players) {
    const archiveId = await insertOne('archive_players', {
      archive_season_id: archiveSeasonId,
      archive_team_id: teamIdMap.get(player.team_id) ?? null,
      name: player.name,
      jersey_number: player.jersey_number,
      position: player.position,
    })
    if (!archiveId) return fail(`Failed to archive player "${player.name}"`, 500)
    playerIdMap.set(player.id, archiveId)
  }

  const gameIdMap = new Map<string, string>()
  for (const game of games) {
    const archiveId = await insertOne('archive_games', {
      archive_season_id: archiveSeasonId,
      game_number: game.game_number,
      week_number: game.week_number,
      date: game.date,
      time: game.time,
      location: game.location,
      home_archive_team_id: game.home_team_id
        ? (teamIdMap.get(game.home_team_id) ?? null)
        : null,
      away_archive_team_id: game.away_team_id
        ? (teamIdMap.get(game.away_team_id) ?? null)
        : null,
      home_score: game.home_score,
      away_score: game.away_score,
      status: game.status,
      is_playoff: game.is_playoff,
      playoff_round: game.playoff_round,
      player_of_game_archive_id: game.player_of_game_id
        ? (playerIdMap.get(game.player_of_game_id) ?? null)
        : null,
    })
    if (!archiveId) return fail(`Failed to archive game #${game.game_number}`, 500)
    gameIdMap.set(game.id, archiveId)
  }

  for (const stat of stats) {
    const archiveId = await insertOne('archive_game_statistics', {
      archive_game_id: gameIdMap.get(stat.game_id) ?? null,
      archive_player_id: playerIdMap.get(stat.player_id) ?? null,
      archive_team_id: teamIdMap.get(stat.team_id) ?? null,
      stat_type: stat.stat_type,
      count: stat.count,
      timestamp: stat.timestamp,
    })
    if (!archiveId) return fail('Failed to archive a game statistic', 500)
  }

  for (const row of standingsRows) {
    const archiveTeamId = teamIdMap.get(row.team_id)
    if (!archiveTeamId) continue
    const archiveId = await insertOne('archive_standings', {
      archive_season_id: archiveSeasonId,
      archive_team_id: archiveTeamId,
      games_played: row.games_played,
      wins: row.wins,
      draws: row.draws,
      losses: row.losses,
      goals_for: row.goals_for,
      goals_against: row.goals_against,
    })
    if (!archiveId) return fail('Failed to archive a standings row', 500)
  }

  // ---- Reset phase: only reached once every copy above has succeeded. ----
  const resetSteps = await Promise.all([
    supabaseAdmin.from('game_statistics').delete().not('id', 'is', null),
    supabaseAdmin.from('games').delete().not('id', 'is', null),
    supabaseAdmin.from('players').delete().not('id', 'is', null),
    supabaseAdmin
      .from('standings')
      .update({
        games_played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goals_for: 0,
        goals_against: 0,
      })
      .not('id', 'is', null),
    supabaseAdmin.from('teams').update({ draft_position: null }).not('id', 'is', null),
  ])

  const resetError = resetSteps.find((r) => r.error)?.error
  if (resetError) {
    console.error('Error resetting live tables after archiving:', resetError)
    return fail(
      `The season was archived as "${label}", but clearing the live tables failed partway through -- check the data by hand before starting the new season.`,
      500
    )
  }

  return NextResponse.json({ archiveSeasonId })
}
