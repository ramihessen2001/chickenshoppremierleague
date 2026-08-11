/**
 * Seed the league with teams, players and a fixture list.
 *
 * Usage:
 *   1. Run database/schema.sql against your Supabase project first.
 *   2. Fill in database/seed-data.json (teams, players, optional games).
 *   3. node database/seed.js            -- add data, keeping what is there
 *      node database/seed.js --reset    -- wipe games/players/teams first
 *
 * Reads credentials from .env.local. Uses the service role key, so it must only
 * ever be run from your machine, never from the browser.
 */

const fs = require('fs')
const path = require('path')
const { createClient } = require('@supabase/supabase-js')

const ROOT = path.join(__dirname, '..')
const RESET = process.argv.includes('--reset')

/* ------------------------------------------------------------------ env --- */

function loadEnv() {
  const envPath = path.join(ROOT, '.env.local')
  if (!fs.existsSync(envPath)) {
    console.error('Missing .env.local. Copy .env.example and fill it in.')
    process.exit(1)
  }

  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const separator = trimmed.indexOf('=')
    if (separator === -1) continue

    const key = trimmed.slice(0, separator).trim()
    let value = trimmed.slice(separator + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    process.env[key] = value
  }
}

loadEnv()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || url.includes('your-project')) {
  console.error('NEXT_PUBLIC_SUPABASE_URL is not set in .env.local')
  process.exit(1)
}
if (!serviceKey || serviceKey.includes('your_')) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is not set in .env.local')
  process.exit(1)
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

/* ----------------------------------------------------------------- data --- */

const dataPath = path.join(__dirname, 'seed-data.json')
if (!fs.existsSync(dataPath)) {
  console.error(`Missing ${dataPath}. See database/README.md for the format.`)
  process.exit(1)
}

const seedData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'))
const teams = seedData.teams ?? []
const games = seedData.games ?? []

const slugify = (name) =>
  name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/* ----------------------------------------------------------------- run  --- */

async function reset() {
  console.log('Resetting games, players and teams...')
  // Order matters: statistics and nominees cascade from these.
  for (const table of ['game_statistics', 'games', 'award_nominees', 'players', 'teams']) {
    const { error } = await supabase.from(table).delete().not('id', 'is', null)
    if (error) {
      console.error(`  Failed to clear ${table}: ${error.message}`)
      process.exit(1)
    }
    console.log(`  cleared ${table}`)
  }
}

async function seedTeams() {
  console.log(`\nInserting ${teams.length} teams...`)
  const idBySlug = new Map()

  for (const [index, team] of teams.entries()) {
    const slug = team.slug || slugify(team.name)

    const { data, error } = await supabase
      .from('teams')
      .upsert(
        {
          name: team.name,
          slug,
          logo_url: team.logoUrl ?? `/images/teams/${slug}.png`,
          primary_color: team.primaryColor ?? '#523232',
          display_order: team.displayOrder ?? index,
        },
        { onConflict: 'slug' }
      )
      .select('id')
      .single()

    if (error) {
      console.error(`  ${team.name}: ${error.message}`)
      continue
    }

    idBySlug.set(slug, data.id)
    console.log(`  ${team.name} (${slug})`)

    const players = team.players ?? []
    if (players.length === 0) continue

    // Guard against a duplicate shirt number inside one team's list, which the
    // database would reject anyway -- better to name the players involved.
    const seen = new Map()
    const rows = []

    for (const player of players) {
      const name = typeof player === 'string' ? player : player.name
      const jersey =
        typeof player === 'string'
          ? null
          : player.jerseyNumber === undefined
            ? null
            : player.jerseyNumber

      if (jersey !== null && seen.has(jersey)) {
        console.error(
          `    duplicate #${jersey}: "${seen.get(jersey)}" and "${name}" -- skipping "${name}"`
        )
        continue
      }
      if (jersey !== null) seen.set(jersey, name)

      rows.push({
        name,
        jersey_number: jersey,
        team_id: data.id,
        position: typeof player === 'string' ? null : (player.position ?? null),
        is_active: true,
      })
    }

    const { error: playerError } = await supabase.from('players').insert(rows)
    if (playerError) {
      console.error(`    players: ${playerError.message}`)
    } else {
      console.log(`    ${rows.length} players`)
    }
  }

  return idBySlug
}

async function seedGames(idBySlug) {
  if (games.length === 0) {
    console.log('\nNo games in seed-data.json -- add them here or in the admin UI.')
    return
  }

  console.log(`\nInserting ${games.length} games...`)

  // Regular season games count from 1, playoff games from 100, matching the
  // convention the app and the admin UI use.
  let nextRegular = 1
  let nextPlayoff = 100

  for (const game of games) {
    const isPlayoff = Boolean(game.isPlayoff || game.playoffRound)
    const number = isPlayoff ? nextPlayoff++ : nextRegular++

    const homeId = game.homeTeam ? idBySlug.get(slugify(game.homeTeam)) : null
    const awayId = game.awayTeam ? idBySlug.get(slugify(game.awayTeam)) : null

    // Playoff slots may legitimately be empty ("winner of the play-in").
    if (!isPlayoff && (!homeId || !awayId)) {
      console.error(
        `  game ${number}: unknown team (${game.homeTeam} vs ${game.awayTeam}) -- skipped`
      )
      continue
    }

    const { error } = await supabase.from('games').insert({
      game_number: number,
      week_number: isPlayoff ? 0 : (game.week ?? 1),
      date: game.date,
      time: game.time ?? 'TBD',
      location: game.location ?? 'TBD',
      home_team_id: homeId ?? null,
      away_team_id: awayId ?? null,
      status: 'scheduled',
      is_playoff: isPlayoff,
      playoff_round: game.playoffRound ?? null,
    })

    if (error) {
      console.error(`  game ${number}: ${error.message}`)
    } else {
      console.log(
        `  ${isPlayoff ? game.playoffRound : `week ${game.week ?? 1}`}: ${game.homeTeam ?? 'TBD'} vs ${game.awayTeam ?? 'TBD'} on ${game.date}`
      )
    }
  }
}

async function main() {
  if (RESET) await reset()

  const idBySlug = await seedTeams()
  await seedGames(idBySlug)

  const counts = {}
  for (const table of ['teams', 'players', 'games']) {
    const { count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
    counts[table] = count
  }

  console.log('\nDone.')
  console.log(`  teams:   ${counts.teams}`)
  console.log(`  players: ${counts.players}`)
  console.log(`  games:   ${counts.games}`)
}

main().catch((error) => {
  console.error('Seed failed:', error)
  process.exit(1)
})
