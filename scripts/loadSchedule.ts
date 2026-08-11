/**
 * Script to load schedule.csv into the application
 * Run this to import the actual league schedule from schedule.csv
 * 
 * Usage:
 * 1. Place schedule.csv in league_data/schedule.csv
 * 2. Run this script to parse and load it into localStorage
 * 3. Or copy the output to lib/sampleData.ts FULL_SEASON_GAMES
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { parseScheduleCSV } from '../lib/dataParser'

// Load the schedule CSV file
const csvPath = join(process.cwd(), 'league_data', 'schedule.csv')
const csvContent = readFileSync(csvPath, 'utf-8')

// Parse the CSV
const games = parseScheduleCSV(csvContent)

console.log('\n🏆 YM JAX Soccer League - Schedule Loaded!\n')
console.log(`✅ Parsed ${games.length} games from schedule.csv\n`)

// Display first few games
console.log('📅 Sample Games:')
games.slice(0, 5).forEach(game => {
  console.log(`  Week ${game.weekNumber}: ${game.homeTeamId} vs ${game.awayTeamId} - ${game.date} at ${game.time}`)
})

console.log('\n📊 Games by Week:')
const gamesByWeek = new Map<number, number>()
games.forEach(game => {
  gamesByWeek.set(game.weekNumber, (gamesByWeek.get(game.weekNumber) || 0) + 1)
})
gamesByWeek.forEach((count, week) => {
  console.log(`  Week ${week}: ${count} games`)
})

console.log('\n💾 To use this schedule in your application:')
console.log('  1. Copy the JSON output below')
console.log('  2. Replace FULL_SEASON_GAMES in lib/sampleData.ts')
console.log('  3. Or run initializeLocalStorage() in browser console to reload\n')

console.log('\n📝 JSON Output:\n')
console.log(JSON.stringify(games, null, 2))

// Export for potential use
export { games }




