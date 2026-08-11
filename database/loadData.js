/**
 * Load CSV Data to Supabase
 * 
 * This script reads roster and schedule CSV files and loads them into
 * the Supabase database. Run after setting up the schema.
 * 
 * Usage:
 *   npm install csv-parse @supabase/supabase-js
 *   node database/loadData.js
 */

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env.local
// This is a simple implementation without needing the dotenv package
function loadEnvFile() {
  const envPath = path.join(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      // Skip comments and empty lines
      if (line.trim().startsWith('#') || !line.trim()) return;
      
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        let value = valueParts.join('=').trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1);
        }
        process.env[key.trim()] = value;
      }
    });
    console.log('✅ Loaded environment variables from .env.local\n');
  } else {
    console.error('❌ Error: .env.local file not found!');
    console.error('   Expected location:', envPath);
    process.exit(1);
  }
}

// Load .env.local
loadEnvFile();

console.log('🔍 Checking environment variables...');
console.log('   SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Found (' + process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + '...)' : 'NOT FOUND');
console.log('   SERVICE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Found (' + process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 30) + '...)' : 'NOT FOUND');
console.log('');

// Supabase configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase client with service role key (bypasses RLS for data loading)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Utility function to create slug from team name
function createSlug(name) {
  return name.toLowerCase().replace(/\s+/g, '-');
}

// Parse roster CSV and extract team/player data
function parseRosterCSV(filePath) {
  const csvContent = fs.readFileSync(filePath, 'utf-8');
  const rows = parse(csvContent, { 
    skip_empty_lines: true,
    relax_column_count: true 
  });

  // First row contains team names
  const teamNames = rows[0].filter(name => name.trim() !== '');
  
  // Initialize teams structure
  const teams = teamNames.map(name => ({
    name: name.trim(),
    slug: createSlug(name.trim()),
    logo_url: `/league_data/images/${createSlug(name.trim())}_logo.png`,
    players: []
  }));

  // Process player rows (rows 1+)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    
    // Each column corresponds to a team
    for (let teamIndex = 0; teamIndex < teams.length; teamIndex++) {
      const playerData = row[teamIndex];
      
      if (!playerData || playerData.trim() === '') {
        continue; // Skip empty cells
      }

      // Parse player data: "Name-Number" or "Name Number"
      const trimmed = playerData.trim();
      let name, jerseyNumber;

      // Try to extract jersey number
      // Patterns: "Name-7", "Name - 7", "Name 7"
      const match = trimmed.match(/^(.+?)[-\s]+(\d+)\s*$/);
      
      if (match) {
        name = match[1].trim();
        jerseyNumber = parseInt(match[2], 10);
      } else {
        // No number found, use name only
        name = trimmed;
        jerseyNumber = 0; // Default jersey number
      }

      teams[teamIndex].players.push({
        name,
        jersey_number: jerseyNumber,
        is_active: true
      });
    }
  }

  return teams;
}

// Parse schedule CSV and extract game data
function parseScheduleCSV(filePath) {
  const csvContent = fs.readFileSync(filePath, 'utf-8');
  const rows = parse(csvContent, { 
    skip_empty_lines: false,
    relax_column_count: true 
  });

  const games = [];
  let currentDate = null;
  let gameNumber = 0;
  let weekNumber = 1;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    
    // Skip empty rows
    if (row.every(cell => !cell || cell.trim() === '')) {
      continue;
    }

    // Check if this is a date header row (column index 1)
    if (row[1] && (row[1].includes('/') || row[1].includes('Saturday') || row[1].includes('Friday') || row[1].includes('Thursday') || row[1].includes('Tuesday') || row[1].includes('Sunday'))) {
      const dateStr = row[1].trim();
      
      // Skip playoff section markers
      if (dateStr.includes('Playoffs') || dateStr.includes('Play-ins') || dateStr.includes('Semi Finals') || dateStr.includes('Finals')) {
        continue;
      }

      // Try to extract date
      const dateMatch = dateStr.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
      if (dateMatch) {
        currentDate = dateMatch[1];
        // Each new date group represents a new week (roughly)
        if (gameNumber > 0 && gameNumber % 3 === 0) {
          weekNumber++;
        }
      }
    }

    // Check if this is a game row (has "Game" in column 2)
    if (row[2] && row[2].includes('Game')) {
      gameNumber++;
      
      const gameLabel = row[2].trim(); // e.g., "Game 1"
      const team1 = row[3] ? row[3].trim() : '';
      
      // Next row should have time and team2
      if (i + 1 < rows.length) {
        const nextRow = rows[i + 1];
        const timeStr = nextRow[2] ? nextRow[2].trim() : ''; // e.g., "12/25 @6:15 PM"
        const team2 = nextRow[3] ? nextRow[3].trim() : '';

        if (team1 && team2) {
          // Extract time from timeStr (format: "12/25 @6:15 PM")
          let time = 'TBD';
          const timeMatch = timeStr.match(/@(.+)/);
          if (timeMatch) {
            time = timeMatch[1].trim();
          }

          // Determine if playoff game
          const isPlayoff = gameNumber > 15; // Games 16+ are playoffs
          let playoffRound = null;
          if (isPlayoff) {
            if (gameLabel.includes('16') || gameLabel.includes('17')) {
              playoffRound = 'play-in';
            } else if (gameLabel.includes('Semi')) {
              playoffRound = 'semi-final';
            } else if (gameLabel.includes('Final')) {
              playoffRound = 'final';
            }
          }

          games.push({
            game_number: gameNumber,
            week_number: isPlayoff ? null : weekNumber,
            date: currentDate || '2025-12-25', // Default date if not found
            time: time,
            location: 'Field TBD',
            home_team: team1,
            away_team: team2,
            status: 'scheduled',
            is_playoff: isPlayoff,
            playoff_round: playoffRound
          });
        }
        
        i++; // Skip the next row since we processed it
      }
    }
  }

  return games;
}

// Convert MM/DD/YYYY to YYYY-MM-DD
function formatDate(dateStr) {
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const month = parts[0].padStart(2, '0');
    const day = parts[1].padStart(2, '0');
    const year = parts[2];
    return `${year}-${month}-${day}`;
  }
  return dateStr;
}

// Main function to load all data
async function loadData() {
  console.log('🚀 Starting data load to Supabase...\n');

  try {
    // Step 1: Load teams and players from rosters.csv
    console.log('📋 Step 1: Loading teams and players...');
    const rostersPath = path.join(__dirname, '../league_data/rosters.csv');
    const teamsData = parseRosterCSV(rostersPath);

    console.log(`   Found ${teamsData.length} teams:`);
    teamsData.forEach(team => {
      console.log(`   - ${team.name}: ${team.players.length} players`);
    });

    // Insert teams
    const teamIdMap = {}; // Map team name to UUID
    for (const team of teamsData) {
      const { data: insertedTeam, error } = await supabase
        .from('teams')
        .insert({
          name: team.name,
          slug: team.slug,
          logo_url: team.logo_url
        })
        .select()
        .single();

      if (error) {
        console.error(`   ❌ Error inserting team ${team.name}:`, error.message);
        continue;
      }

      teamIdMap[team.name] = insertedTeam.id;
      console.log(`   ✅ Inserted team: ${team.name} (${insertedTeam.id})`);

      // Insert players for this team
      const duplicateJerseys = new Map(); // Track jersey numbers
      
      for (const player of team.players) {
        // Check for duplicate jersey numbers within this team
        if (duplicateJerseys.has(player.jersey_number)) {
          const existingPlayer = duplicateJerseys.get(player.jersey_number);
          console.error(`   ⚠️  DUPLICATE JERSEY #${player.jersey_number} on ${team.name}:`);
          console.error(`       - ${existingPlayer.name} (already added)`);
          console.error(`       - ${player.name} (skipped)`);
          console.error(`       → Please fix rosters.csv - each player on a team must have a unique jersey number`);
          continue; // Skip this player
        }
        
        duplicateJerseys.set(player.jersey_number, player);
        
        const { error: playerError } = await supabase
          .from('players')
          .insert({
            name: player.name,
            jersey_number: player.jersey_number,
            team_id: insertedTeam.id,
            is_active: player.is_active
          });

        if (playerError) {
          console.error(`   ❌ Error inserting player ${player.name}:`, playerError.message);
        }
      }
      console.log(`   ✅ Inserted ${team.players.length - (team.players.length - duplicateJerseys.size)} players for ${team.name}`);
    }

    console.log('\n');

    // Step 2: Load games from schedule.csv
    console.log('📅 Step 2: Loading game schedule...');
    const schedulePath = path.join(__dirname, '../league_data/schedule.csv');
    const gamesData = parseScheduleCSV(schedulePath);

    console.log(`   Found ${gamesData.length} games\n`);

    // Insert games
    let inserted = 0;
    let skipped = 0;

    for (const game of gamesData) {
      // Get team IDs
      const homeTeamId = teamIdMap[game.home_team];
      const awayTeamId = teamIdMap[game.away_team];

      // Skip games with placeholder teams (Winner of X, seed names, etc.)
      if (!homeTeamId || !awayTeamId) {
        skipped++;
        console.log(`   ⏭️  Skipped Game ${game.game_number}: ${game.home_team} vs ${game.away_team} (playoff placeholder)`);
        continue;
      }

      const { error } = await supabase
        .from('games')
        .insert({
          game_number: game.game_number,
          week_number: game.week_number,
          date: formatDate(game.date),
          time: game.time,
          location: game.location,
          home_team_id: homeTeamId,
          away_team_id: awayTeamId,
          status: game.status,
          is_playoff: game.is_playoff,
          playoff_round: game.playoff_round
        });

      if (error) {
        console.error(`   ❌ Error inserting game ${game.game_number}:`, error.message);
      } else {
        inserted++;
        console.log(`   ✅ Game ${game.game_number}: ${game.home_team} vs ${game.away_team} on ${game.date}`);
      }
    }

    console.log(`\n   Inserted ${inserted} games, skipped ${skipped} playoff placeholders\n`);

    // Step 3: Verify data
    console.log('🔍 Step 3: Verifying data...');
    
    const { count: teamCount } = await supabase
      .from('teams')
      .select('*', { count: 'exact', head: true });
    
    const { count: playerCount } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true });
    
    const { count: gameCount } = await supabase
      .from('games')
      .select('*', { count: 'exact', head: true });

    console.log(`   ✅ Teams in database: ${teamCount}`);
    console.log(`   ✅ Players in database: ${playerCount}`);
    console.log(`   ✅ Games in database: ${gameCount}`);

    console.log('\n✨ Data load complete! ✨\n');

  } catch (error) {
    console.error('❌ Fatal error during data load:', error);
    process.exit(1);
  }
}

// Check for required environment variables
if (!SUPABASE_URL || SUPABASE_URL === 'YOUR_SUPABASE_URL' || SUPABASE_URL.includes('xxxxx')) {
  console.error('❌ Error: SUPABASE_URL not configured!');
  console.error('\nPlease check your .env.local file and ensure:');
  console.error('  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
  console.error('\nFound:', SUPABASE_URL || 'undefined');
  process.exit(1);
}

if (!SUPABASE_SERVICE_KEY || SUPABASE_SERVICE_KEY === 'YOUR_SERVICE_ROLE_KEY' || SUPABASE_SERVICE_KEY.includes('your_service')) {
  console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY not configured!');
  console.error('\nPlease check your .env.local file and ensure:');
  console.error('  SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key');
  console.error('\nFound:', SUPABASE_SERVICE_KEY ? SUPABASE_SERVICE_KEY.substring(0, 20) + '...' : 'undefined');
  process.exit(1);
}

// Run the data load
loadData();

