/**
 * Data parsing utilities for YM JAX Soccer League
 * Handles CSV parsing for roster and schedule data
 */

import { Player } from '@/types/player'
import { Game, GameStatus } from '@/types/game'

/**
 * Parses roster CSV data into structured Player objects
 * Handles multiple formats: "Name-Number", "Name Number", "Name - Number"
 * 
 * @param csvText - Raw CSV text content
 * @returns Array of Player objects with parsed data
 */
export function parseRosterCSV(csvText: string): Player[] {
  const lines = csvText.trim().split('\n')
  const players: Player[] = []
  
  if (lines.length < 2) {
    return players // No data
  }
  
  // First line contains team names
  const teamNames = lines[0].split(',').map(t => t.trim().toLowerCase())
  
  // Remaining lines contain player data
  for (let i = 1; i < lines.length; i++) {
    const columns = lines[i].split(',')
    
    columns.forEach((cell, teamIndex) => {
      if (!cell || !cell.trim()) return
      
      const trimmed = cell.trim()
      const teamId = teamNames[teamIndex]
      
      // Parse player name and jersey number
      // Handle formats: "Name-Number", "Name Number", "Name - Number"
      const parsed = parsePlayerNameAndNumber(trimmed)
      
      if (parsed.name) {
        players.push({
          id: `${teamId}-${parsed.name.replace(/\s+/g, '-').toLowerCase()}`,
          name: parsed.name,
          jerseyNumber: parsed.number,
          teamId,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        })
      }
    })
  }
  
  return players
}

/**
 * Parses a player string into name and jersey number
 * Handles various formatting: "Name-7", "Name 5", "Name - 12"
 * 
 * @param playerString - Raw player string from CSV
 * @returns Object with name and number
 */
function parsePlayerNameAndNumber(playerString: string): { name: string; number: number } {
  // Try to find number at the end of string
  // Patterns: "Name-7", "Name 7", "Name - 7"
  
  // Remove extra spaces around dashes
  const normalized = playerString.replace(/\s*-\s*/g, '-')
  
  // Split by dash or space, looking for number at end
  const parts = normalized.split(/[-\s]+/)
  
  // Last part might be the number
  const lastPart = parts[parts.length - 1]
  const number = parseInt(lastPart, 10)
  
  if (!isNaN(number)) {
    // Number found, name is everything before it
    const name = parts.slice(0, -1).join(' ').trim()
    return { name, number }
  }
  
  // No number found, return name with default number
  return { name: playerString.trim(), number: 0 }
}

/**
 * Groups players by team
 * 
 * @param players - Array of players
 * @returns Map of teamId to players array
 */
export function groupPlayersByTeam(players: Player[]): Map<string, Player[]> {
  const grouped = new Map<string, Player[]>()
  
  players.forEach(player => {
    if (!grouped.has(player.teamId)) {
      grouped.set(player.teamId, [])
    }
    grouped.get(player.teamId)!.push(player)
  })
  
  return grouped
}

/**
 * Parses schedule CSV data into structured Game objects
 * Handles the specific format from league_data/schedule.csv
 * 
 * CSV Format:
 * Row 7: ,Thursday 12/25/2025,Game 1,Panthers,
 * Row 8: ,,12/25 @6:15 PM,Eagles,
 * 
 * @param csvText - Raw CSV text content from schedule.csv
 * @returns Array of Game objects with parsed data
 */
export function parseScheduleCSV(csvText: string): Game[] {
  const lines = csvText.trim().split('\n')
  const games: Game[] = []
  
  let currentDate = ''
  let currentGameNumber = 0
  let weekNumber = 1
  let lastDate = ''
  let gameCounter = 1
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const columns = line.split(',').map(c => c.trim())
    
    // Skip empty lines or header rows
    if (columns.every(c => !c) || columns.includes('Schedule') || columns.includes('Score')) {
      continue
    }
    
    // Check for playoff markers - skip for now (can add playoff games later)
    if (columns.some(c => c.includes('Playoffs') || c.includes('Play-ins') || c.includes('Semi Finals') || c.includes('Finals'))) {
      continue
    }
    
    // Look for date pattern in column 1 (e.g., "Thursday 12/25/2025", "Friday 1/2/2026")
    if (columns[1] && (columns[1].includes('/') || columns[1].match(/\d{1,2}\/\d{1,2}\/\d{4}/))) {
      // Extract just the date part if it includes day name
      const dateParts = columns[1].match(/(\d{1,2}\/\d{1,2}\/\d{4})/)
      if (dateParts) {
        currentDate = dateParts[1]
        
        // Increment week number if we've moved to a new date
        if (lastDate && currentDate !== lastDate) {
          weekNumber++
        }
        lastDate = currentDate
      }
    }
    
    // Look for game row (has "Game" in column 2)
    if (columns[2] && columns[2].includes('Game ')) {
      const gameMatch = columns[2].match(/Game (\d+)/)
      if (gameMatch) {
        currentGameNumber = parseInt(gameMatch[1])
      }
      
      const team1Raw = columns[3]
      
      // Next line should have time and team 2
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1]
        const nextColumns = nextLine.split(',').map(c => c.trim())
        
        const timeRaw = nextColumns[2] // e.g., "12/25 @6:15 PM" or "1/2 @8:00 PM"
        const team2Raw = nextColumns[3]
        
        if (team1Raw && team2Raw && timeRaw) {
          // Parse time (extract time part after @)
          const timeMatch = timeRaw.match(/@(.+)/)
          const time = timeMatch ? timeMatch[1].trim() : ''
          
          // Convert date from M/D/YYYY to YYYY-MM-DD
          const [month, day, year] = currentDate.split('/')
          const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
          
          // Normalize team names to match team IDs
          const team1Id = normalizeTeamName(team1Raw)
          const team2Id = normalizeTeamName(team2Raw)
          
          if (team1Id && team2Id) {
            games.push({
              id: `game-${currentGameNumber || gameCounter}`,
              weekNumber,
              date: isoDate,
              time,
              location: 'Mandarin Park', // Default location
              homeTeamId: team1Id,
              awayTeamId: team2Id,
              homeScore: null,
              awayScore: null,
              status: 'scheduled' as GameStatus,
              statistics: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            })
            
            gameCounter++
          }
        }
        
        // Skip the next line since we've already processed it
        i++
      }
    }
  }
  
  return games
}

/**
 * Normalizes team names from CSV to match team IDs in config
 * @param teamName - Raw team name from CSV
 * @returns Normalized team ID
 */
function normalizeTeamName(teamName: string): string {
  const normalized = teamName.trim().toLowerCase()
  
  // Map team names to IDs
  const teamMap: Record<string, string> = {
    'eagles': 'eagles',
    'panthers': 'panthers',
    'lions': 'lions',
    'dolphins': 'dolphins',
    'knights': 'knights',
    'warriors': 'warriors',
  }
  
  return teamMap[normalized] || ''
}

