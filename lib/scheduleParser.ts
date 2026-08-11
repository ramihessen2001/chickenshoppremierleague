/**
 * Parse schedule CSV and initialize localStorage with real game data
 * This should be called once when the app first loads
 */

export async function initializeScheduleFromCSV() {
  if (typeof window === 'undefined') return
  
  // Check if already initialized with CSV data
  const alreadyInitialized = localStorage.getItem('ym_soccer_schedule_csv_loaded')
  if (alreadyInitialized) return
  
  try {
    const response = await fetch('/schedule.csv')
    if (!response.ok) {
      console.error('Failed to load schedule.csv')
      return
    }
    
    const csvText = await response.text()
    const lines = csvText.split('\n')
    
    const games: any[] = []
    let currentDate = ''
    let weekNumber = 1
    let gamesInWeek = 0
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const columns = line.split(',')
      
      // Check for date header (column 2)
      if (columns[1] && columns[1].includes('/')) {
        currentDate = columns[1].trim()
        
        // Increment week after every 3 games
        if (gamesInWeek >= 3) {
          weekNumber++
          gamesInWeek = 0
        }
      }
      
      // Check for game row (has "Game" in column 3)
      if (columns[2] && columns[2].includes('Game ')) {
        const gameName = columns[2].trim()
        const team1 = columns[3]?.trim()
        
        // Next line has time and team2
        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1]
          const nextColumns = nextLine.split(',')
          const timeLocation = nextColumns[2]?.trim()
          const team2 = nextColumns[3]?.trim()
          
          if (team1 && team2 && timeLocation) {
            // Parse date
            const dateMatch = timeLocation.match(/(\d+\/\d+)/)
            const timeMatch = timeLocation.match(/(@?\s*)(\d+:\d+\s*(?:AM|PM)?)/i)
            
            if (dateMatch) {
              const [month, day] = dateMatch[1].split('/')
              const year = parseInt(month) === 1 ? 2026 : 2025
              const gameDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
              const gameTime = timeMatch ? timeMatch[2].trim() : 'TBD'
              
              // Map team names to IDs
              const teamMap: Record<string, string> = {
                'Eagles': 'eagles',
                'Panthers': 'panthers',
                'Lions': 'lions',
                'Dolphins': 'dolphins',
                'Knights': 'knights',
                'Warriors': 'warriors'
              }
              
              const homeTeamId = teamMap[team1]
              const awayTeamId = teamMap[team2]
              
              if (homeTeamId && awayTeamId) {
                games.push({
                  id: `game-${games.length + 1}`,
                  weekNumber,
                  date: gameDate,
                  time: gameTime,
                  location: 'ICNEF Field',
                  homeTeamId,
                  awayTeamId,
                  homeScore: null,
                  awayScore: null,
                  status: 'scheduled',
                  statistics: [],
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
                })
                
                gamesInWeek++
              }
            }
          }
        }
      }
    }
    
    console.log(`Loaded ${games.length} games from schedule.csv`)
    
    // Save to localStorage
    localStorage.setItem('ym_soccer_games', JSON.stringify(games))
    localStorage.setItem('ym_soccer_schedule_csv_loaded', 'true')
    localStorage.setItem('ym_soccer_initialized', 'true')
    
  } catch (error) {
    console.error('Error loading schedule from CSV:', error)
  }
}

