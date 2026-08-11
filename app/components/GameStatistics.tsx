/**
 * Full box score: score line, man of the match, and every tracked statistic.
 */

'use client'

import { Game } from '@/types/game'
import { displayJersey } from '@/types/player'
import { GameStatistic } from '@/types/statistic'
import { useTeams } from '@/lib/teamsContext'
import { StatCategory } from './StatCategory'
import { formatDate, formatTime } from '@/lib/dateUtils'
import { LEAGUE } from '@/config/league'
import Image from 'next/image'
import { Trophy } from 'lucide-react'

interface GameStatisticsProps {
  game: Game
}

export function GameStatistics({ game }: GameStatisticsProps) {
  const { teamName } = useTeams()
  const homeTeamName = teamName(game.homeTeamId)
  const awayTeamName = teamName(game.awayTeamId)

  // Group statistics by type and team
  const homeStats = groupStatsByType(game.statistics.filter(s => s.teamId === game.homeTeamId))
  const awayStats = groupStatsByType(game.statistics.filter(s => s.teamId === game.awayTeamId))

  return (
    <div>
      {/* Score header */}
      <div className="text-center mb-8">
        <h2 id="box-score-title" className="text-3xl sm:text-4xl font-black text-white mb-4">
          FINAL SCORE
        </h2>
        <div className="flex items-center justify-center gap-4 sm:gap-8 mb-4">
          <div className="text-center">
            <p className="text-xl font-bold text-white mb-2">{homeTeamName}</p>
            <p className="text-5xl font-black text-[#D47F7D]">{game.homeScore}</p>
          </div>
          <span className="text-3xl text-gray-400">-</span>
          <div className="text-center">
            <p className="text-xl font-bold text-white mb-2">{awayTeamName}</p>
            <p className="text-5xl font-black text-[#D47F7D]">{game.awayScore}</p>
          </div>
        </div>
        <p className="text-gray-400">
          {formatDate(game.date)} • {formatTime(game.time)} • {game.location}
        </p>
      </div>
      
      {/* Player of the Game Highlight */}
      {game.playerOfGame && (
        <div className="mb-8">
          <div className="bg-gradient-to-r from-[#FFD700]/20 via-[#FFD700]/10 to-[#FFD700]/20 border-2 border-[#FFD700] rounded-lg p-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-4">
              <Image
                src={LEAGUE.manOfTheMatch.badgeImageUrl}
                alt=""
                width={60}
                height={60}
                className="rounded-full animate-pulse"
              />
              <div className="text-center">
                <div className="flex items-center gap-2 justify-center mb-2">
                  <Trophy size={24} className="text-[#FFD700]" />
                  <h3 className="text-xl font-black text-[#FFD700] uppercase tracking-wide">
                    {LEAGUE.manOfTheMatch.label}
                  </h3>
                  <Trophy size={24} className="text-[#FFD700]" />
                </div>
                <p className="text-3xl font-black text-white">
                  #{displayJersey(game.playerOfGame.jerseyNumber)} {game.playerOfGame.name}
                </p>
                {game.playerOfGame.position && (
                  <p className="text-sm text-gray-300 mt-1">
                    {game.playerOfGame.position}
                  </p>
                )}
              </div>
              <Image
                src={LEAGUE.manOfTheMatch.badgeImageUrl}
                alt=""
                width={60}
                height={60}
                className="rounded-full animate-pulse"
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Gold divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-[#B8860B] to-transparent my-8" />
      
      {/* Statistics */}
      {game.statistics.length === 0 ? (
        <div className="text-center py-8">
          <div className="bg-[#1a1a1a] border border-[#523232] rounded-lg p-6 max-w-md mx-auto">
            <p className="text-gray-400 mb-4">
              Detailed statistics not yet entered for this game.
            </p>
            <p className="text-sm text-gray-500">
              Goal scorers, assists, saves, and other statistics will appear here once they're added by an admin.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Goals */}
          <StatCategory
            title="Goals"
            homeTeamName={homeTeamName}
            awayTeamName={awayTeamName}
            homeStats={homeStats.goal || []}
            awayStats={awayStats.goal || []}
            playerOfGameId={game.playerOfGameId}
          />
          
          {/* Assists */}
          <StatCategory
            title="Assists"
            homeTeamName={homeTeamName}
            awayTeamName={awayTeamName}
            homeStats={homeStats.assist || []}
            awayStats={awayStats.assist || []}
            playerOfGameId={game.playerOfGameId}
          />
          
          {/* Saves */}
          <StatCategory
            title="Saves"
            homeTeamName={homeTeamName}
            awayTeamName={awayTeamName}
            homeStats={homeStats.save || []}
            awayStats={awayStats.save || []}
            playerOfGameId={game.playerOfGameId}
          />
          
          {/* Cards (if any) */}
          {(homeStats.yellow_card?.length || awayStats.yellow_card?.length ||
            homeStats.red_card?.length || awayStats.red_card?.length ||
            homeStats.blue_card?.length || awayStats.blue_card?.length) ? (
            <>
              <StatCategory
                title="Yellow Cards"
                homeTeamName={homeTeamName}
                awayTeamName={awayTeamName}
                homeStats={homeStats.yellow_card || []}
                awayStats={awayStats.yellow_card || []}
                playerOfGameId={game.playerOfGameId}
              />
              
              <StatCategory
                title="Red Cards"
                homeTeamName={homeTeamName}
                awayTeamName={awayTeamName}
                homeStats={homeStats.red_card || []}
                awayStats={awayStats.red_card || []}
                playerOfGameId={game.playerOfGameId}
              />
              
              <StatCategory
                title="Blue Cards"
                homeTeamName={homeTeamName}
                awayTeamName={awayTeamName}
                homeStats={homeStats.blue_card || []}
                awayStats={awayStats.blue_card || []}
                playerOfGameId={game.playerOfGameId}
              />
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}

// Helper function to group statistics by type
function groupStatsByType(stats: GameStatistic[]): Record<string, GameStatistic[]> {
  return stats.reduce((acc, stat) => {
    if (!acc[stat.type]) {
      acc[stat.type] = []
    }
    acc[stat.type].push(stat)
    return acc
  }, {} as Record<string, GameStatistic[]>)
}

