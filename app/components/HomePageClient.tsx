/**
 * HomePageClient - Client-side wrapper for homepage with real-time data from Supabase
 */

'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { WeeklyGames } from './WeeklyGames'
import { TeamLogos } from './TeamLogos'
import { StatLeaders } from './StatLeaders'
import { CurrentWeekControl } from './CurrentWeekControl'
import { PlayoffBracket } from './PlayoffBracket'
import { ChampionshipGameCard } from './ChampionshipGameCard'
import { useAdmin } from '@/lib/adminContext'
import { getGamesByWeek, getStatLeaders, getCurrentWeek, getLeagueConfig } from '@/lib/supabaseData'
import { LeagueConfig } from '@/lib/supabase'
import { LeaderboardEntry } from '@/types/statistic'
import { Game } from '@/types/game'

export function HomePageClient() {
  const { isAdmin } = useAdmin()
  const [currentWeekGames, setCurrentWeekGames] = useState<Game[]>([])
  const [currentWeek, setCurrentWeek] = useState<number>(1)
  const [totalWeeks, setTotalWeeks] = useState<number>(12)
  const [leagueConfig, setLeagueConfig] = useState<LeagueConfig | null>(null)
  const [goalLeaders, setGoalLeaders] = useState<LeaderboardEntry[]>([])
  const [assistLeaders, setAssistLeaders] = useState<LeaderboardEntry[]>([])
  const [saveLeaders, setSaveLeaders] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Fetch data from Supabase
    const fetchData = async () => {
      try {
        setIsLoading(true)
        
        // Fetch league configuration
        const config = await getLeagueConfig()
        setLeagueConfig(config)
        
        // Get current week and total weeks
        const week = await getCurrentWeek()
        setCurrentWeek(week)
        setTotalWeeks(config?.total_weeks || 12)
        
        // Fetch current week's games
        const games = await getGamesByWeek(week)
        setCurrentWeekGames(games)
        
        // Fetch stat leaders
        const [goals, assists, saves] = await Promise.all([
          getStatLeaders('goal', 5),
          getStatLeaders('assist', 5),
          getStatLeaders('save', 5)
        ])
        
        setGoalLeaders(goals)
        setAssistLeaders(assists)
        setSaveLeaders(saves)
        
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchData()
    
    // Listen for data updates (when games are edited)
    const handleDataUpdate = () => {
      fetchData()
    }
    
    window.addEventListener('dataUpdated', handleDataUpdate)
    
    return () => {
      window.removeEventListener('dataUpdated', handleDataUpdate)
    }
  }, [])

  const handleWeekChange = async (newWeek: number) => {
    // Update local state
    setCurrentWeek(newWeek)
    
    // Fetch games for new week
    const games = await getGamesByWeek(newWeek)
    setCurrentWeekGames(games)
  }

  if (isLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <p className="text-white text-xl">Loading league data...</p>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Hero/Title Section */}
      <section className="py-8 px-4 sm:px-6 text-center">
        <div className="max-w-7xl mx-auto">
          <p className="text-lg sm:text-xl text-[#D47F7D] font-semibold tracking-wide">
            {leagueConfig?.season || 'YM JAX Winter League 2025'}
          </p>
        </div>
      </section>
      
      {/* Navigation Buttons */}
      <section className="py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/schedule"
              className="inline-block px-6 py-3 bg-[#D47F7D] hover:bg-[#D47F7D]/90 rounded-lg font-semibold transition-colors"
              aria-label="View full season schedule"
            >
              View Full Season Schedule
            </Link>
            <Link
              href="/standings"
              className="inline-block px-6 py-3 bg-[#D47F7D] hover:bg-[#D47F7D]/90 rounded-lg font-semibold transition-colors"
              aria-label="View league standings"
            >
              View Standings
            </Link>
            <Link
              href="/stats"
              className="inline-block px-6 py-3 bg-[#D47F7D] hover:bg-[#D47F7D]/90 rounded-lg font-semibold transition-colors"
              aria-label="View player statistics"
            >
              Vote for Awards!
            </Link>
          </div>
        </div>
      </section>
      
      {/* Jersey Shop Button */}
      <section className="px-4 sm:px-6 mb-6">
        <div className="max-w-7xl mx-auto text-center">
          <a
            href="https://purofc.com/products/cspl-ls-kit?utm_source=ig&utm_medium=social&utm_content=link_in_bio&fbclid=PAZXh0bgNhZW0CMTEAc3J0YwZhcHBfaWQMMjU2MjgxMDQwNTU4AAGnJDz_R6-ssdFZIp6o44P1sD0rIlgLpPr_LkrozTWhWZ7qtLzsUUe2xKvG9rg_aem__w0H0iFA9xPKDe8NhmqqFw"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#B2D497] hover:bg-[#B2D497]/90 rounded-lg font-bold transition-colors text-black text-lg shadow-lg"
            aria-label="Buy a league jersey"
          >
            <ShoppingBag size={20} />
            Buy a league jersey here
          </a>
        </div>
      </section>
      
      {/* Admin: Current Week Control */}
      {isAdmin && (
        <section className="px-4 sm:px-6 mb-4">
          <div className="max-w-7xl mx-auto">
            <CurrentWeekControl 
              currentWeek={currentWeek}
              totalWeeks={totalWeeks}
              onWeekChange={handleWeekChange}
            />
          </div>
        </section>
      )}
      
      {/* EPIC CHAMPIONSHIP GAME CARD - ABOVE EVERYTHING */}
      <ChampionshipGameCard />
      
      {/* Playoff Bracket - Show during playoffs, hide regular season games */}
      <PlayoffBracket />
      
      {/* Weekly Games Section - Hidden during playoffs */}
      {/* <WeeklyGames games={currentWeekGames} weekNumber={currentWeek} /> */}
      
      {/* Team Logos Grid */}
      <TeamLogos />
      
      {/* Statistical Leaders */}
      <StatLeaders
        goals={goalLeaders}
        assists={assistLeaders}
        saves={saveLeaders}
      />
    </div>
  )
}

