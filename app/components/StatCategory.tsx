/**
 * StatCategory component for YM JAX Soccer League
 * Displays a single statistic category (goals, assists, etc.) by team
 */

import { GameStatistic } from '@/types/statistic'
import { PuroPlayerBadge } from './PuroPlayerBadge'

interface StatCategoryProps {
  title: string
  homeTeamName: string
  awayTeamName: string
  homeStats: GameStatistic[]
  awayStats: GameStatistic[]
  playerOfGameId?: string | null
}

export function StatCategory({ 
  title, 
  homeTeamName, 
  awayTeamName, 
  homeStats, 
  awayStats,
  playerOfGameId 
}: StatCategoryProps) {
  // Don't render if no stats for either team
  if (homeStats.length === 0 && awayStats.length === 0) {
    return null
  }
  
  return (
    <div>
      <h3 className="text-xl font-bold uppercase text-[#D47F7D] mb-4">{title}</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Home team stats */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-3">{homeTeamName}</h4>
          {homeStats.length === 0 ? (
            <p className="text-gray-400 text-sm">None</p>
          ) : (
            <ul className="space-y-2">
              {homeStats.map(stat => {
                const playerName = stat.playerName || 'Unknown Player'
                const jerseyNumber = stat.jerseyNumber || 0
                const count = stat.count || 1
                const isPlayerOfGame = stat.playerId === playerOfGameId
                
                return (
                  <li key={stat.id} className="text-white">
                    <PuroPlayerBadge
                      playerName={playerName}
                      jerseyNumber={jerseyNumber}
                      isPlayerOfGame={isPlayerOfGame}
                    />
                    {count > 1 && <span className="text-[#D47F7D] ml-2">×{count}</span>}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
        
        {/* Away team stats */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-3">{awayTeamName}</h4>
          {awayStats.length === 0 ? (
            <p className="text-gray-400 text-sm">None</p>
          ) : (
            <ul className="space-y-2">
              {awayStats.map(stat => {
                const playerName = stat.playerName || 'Unknown Player'
                const jerseyNumber = stat.jerseyNumber || 0
                const count = stat.count || 1
                const isPlayerOfGame = stat.playerId === playerOfGameId
                
                return (
                  <li key={stat.id} className="text-white">
                    <PuroPlayerBadge
                      playerName={playerName}
                      jerseyNumber={jerseyNumber}
                      isPlayerOfGame={isPlayerOfGame}
                    />
                    {count > 1 && <span className="text-[#D47F7D] ml-2">×{count}</span>}
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

