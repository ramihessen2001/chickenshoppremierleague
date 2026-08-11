/**
 * Client-side schedule loader
 * Load schedule.csv data directly in the browser
 * 
 * Instructions:
 * 1. Open your app in the browser
 * 2. Open DevTools Console (F12)
 * 3. Copy/paste this entire file into the console
 * 4. It will load the schedule data into localStorage
 * 5. Refresh the page to see the new schedule
 */

// Schedule CSV data from league_data/schedule.csv
const scheduleCSV = `,,,,
,,,,
,,,,
,Schedule,,,
,,,,
,,,,Score
,Thursday 12/25/2025,Game 1,Panthers,
,,12/25 @6:15 PM,Eagles,
,,,,
,,Game 2,Lions,
,,12/25 @8:00 PM,Dolphins,
,,,,
,,Game 3,Knights,
,,12/25 @9:15 PM,Warriors,
,,,,
,,,,
,Friday 12/26/2025,Game 4,Eagles,
,,12/26 @6:15 PM,Lions,
,,,,
,,Game 5,Panthers,
,,12/26 @8:00 PM,Warriors,
,,,,
,,Game 6,Knights,
,,12/26 @9:15,Dolphins,
,,,,
,,,,
,Sunday 12/28/2025,Game 7,Panthers,
,,12/28 @6:15 PM,Knights,
,,,,
,,Game 8,Dolphins,
,,12/28 @8:00 PM,Eagles,
,,,,
,,Game 9,Warriors,
,,12/28 @9:15 PM,Lions,
,,,,
,,,,
,Tuesday 12/30/2025,Game 10,Panthers,
,,12/30 @6:15 PM,Lions,
,,,,
,,Game 11,Eagles,
,,12/30 @8:00 PM,Knights,
,,,,
,,Game 12,Warriors,
,,12/30 @9:15 PM,Dolphins,
,,,,
,,,,
,Friday 1/2/2026,Game 13,Panthers,
,,1/2 @6:15 PM,Dolphins,
,,,,
,,Game 14,Eagles,
,,1/2 @8:00 PM,Warriors,
,,,,
,,Game 15,Knights,
,,1/2 @9:15 PM,Lions,
,,,,
,,,,
,,,,
,Playoffs begin,,,
,,,,
,Play-ins,,,
,,,,
,Saturday,Game 16,3rd seed,
,,1/3 @TBD,6th seed,
,,,,
,,Game 17,4th seed,
,,1/3 @TBD,5th seed,
,,,,
,,,,
,Semi Finals,,,
,,,,
,,,,
,Friday,Semi-final 1,Winner of Game 16,
,,1/9 @TBD,1st seed,
,,,,
,,Semi-final 2,Winner of Game 17,
,,1/9 @TBD,2nd seed,
,,,,
,,,,
,Finals,,,
,,,,
,,,,
,Saturday,Finals,Winner of Semi-final 1,
,,1/10 @TBD,Winner of Semi-final 2,`

// Parse function (inline for browser use)
function parseSchedule(csvText) {
  const lines = csvText.trim().split('\n')
  const games = []
  
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
    
    // Check for playoff markers - skip for now
    if (columns.some(c => c.includes('Playoffs') || c.includes('Play-ins') || c.includes('Semi Finals') || c.includes('Finals'))) {
      continue
    }
    
    // Look for date pattern in column 1
    if (columns[1] && (columns[1].includes('/') || columns[1].match(/\d{1,2}\/\d{1,2}\/\d{4}/))) {
      const dateParts = columns[1].match(/(\d{1,2}\/\d{1,2}\/\d{4})/)
      if (dateParts) {
        currentDate = dateParts[1]
        
        if (lastDate && currentDate !== lastDate) {
          weekNumber++
        }
        lastDate = currentDate
      }
    }
    
    // Look for game row
    if (columns[2] && columns[2].includes('Game ')) {
      const gameMatch = columns[2].match(/Game (\d+)/)
      if (gameMatch) {
        currentGameNumber = parseInt(gameMatch[1])
      }
      
      const team1Raw = columns[3]
      
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1]
        const nextColumns = nextLine.split(',').map(c => c.trim())
        
        const timeRaw = nextColumns[2]
        const team2Raw = nextColumns[3]
        
        if (team1Raw && team2Raw && timeRaw) {
          const timeMatch = timeRaw.match(/@(.+)/)
          const time = timeMatch ? timeMatch[1].trim() : ''
          
          const [month, day, year] = currentDate.split('/')
          const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
          
          const team1Id = team1Raw.trim().toLowerCase()
          const team2Id = team2Raw.trim().toLowerCase()
          
          if (team1Id && team2Id) {
            games.push({
              id: `game-${currentGameNumber || gameCounter}`,
              weekNumber,
              date: isoDate,
              time,
              location: 'Mandarin Park',
              homeTeamId: team1Id,
              awayTeamId: team2Id,
              homeScore: null,
              awayScore: null,
              status: 'scheduled',
              statistics: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            })
            
            gameCounter++
          }
        }
        
        i++
      }
    }
  }
  
  return games
}

// Parse and load the schedule
console.log('🏆 Loading YM JAX Soccer League Schedule...')
const parsedGames = parseSchedule(scheduleCSV)
console.log(`✅ Parsed ${parsedGames.length} games from schedule.csv`)

// Save to localStorage
localStorage.setItem('ym_soccer_games', JSON.stringify(parsedGames))
localStorage.setItem('ym_soccer_initialized', 'true')

console.log('💾 Schedule saved to localStorage!')
console.log('🔄 Refresh the page to see the new schedule')
console.log(`\n📅 Games by week:`)
const byWeek = {}
parsedGames.forEach(g => {
  byWeek[g.weekNumber] = (byWeek[g.weekNumber] || 0) + 1
})
Object.keys(byWeek).sort((a,b) => parseInt(a) - parseInt(b)).forEach(week => {
  console.log(`  Week ${week}: ${byWeek[week]} games`)
})

// Trigger data refresh event
if (typeof window !== 'undefined') {
  window.dispatchEvent(new Event('dataUpdated'))
  console.log('\n✅ Data refresh triggered! Schedule should update automatically.')
}




