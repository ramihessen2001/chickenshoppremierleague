/**
 * Homepage.
 *
 * During the regular season this shows the current week's fixtures. Once the
 * admin flips `playoffs_started` in the league config, the bracket and the
 * championship card take over. Last season that switch was made by commenting
 * out the weekly games in the source, which is why they had to be restored by
 * hand for a new season.
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { WeeklyGames } from './WeeklyGames'
import { TeamLogos } from './TeamLogos'
import { StatLeaders } from './StatLeaders'
import { CurrentWeekControl } from './CurrentWeekControl'
import { PlayoffBracket } from './PlayoffBracket'
import { ChampionshipGameCard } from './ChampionshipGameCard'
import { useAdmin } from '@/lib/adminContext'
import { LEAGUE } from '@/config/league'
import {
  getGamesByWeek,
  getStatLeaders,
  getLeagueConfig,
} from '@/lib/supabaseData'
import { LeagueConfig } from '@/lib/supabase'
import { LeaderboardEntry } from '@/types/statistic'
import { Game } from '@/types/game'

export function HomePageClient() {
  const { isAdmin } = useAdmin()
  const [config, setConfig] = useState<LeagueConfig | null>(null)
  const [currentWeekGames, setCurrentWeekGames] = useState<Game[]>([])
  const [goalLeaders, setGoalLeaders] = useState<LeaderboardEntry[]>([])
  const [assistLeaders, setAssistLeaders] = useState<LeaderboardEntry[]>([])
  const [saveLeaders, setSaveLeaders] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const leagueConfig = await getLeagueConfig()
      setConfig(leagueConfig)

      const week = leagueConfig?.current_week ?? 1

      const [games, goals, assists, saves] = await Promise.all([
        getGamesByWeek(week),
        getStatLeaders('goal', 5),
        getStatLeaders('assist', 5),
        getStatLeaders('save', 5),
      ])

      setCurrentWeekGames(games)
      setGoalLeaders(goals)
      setAssistLeaders(assists)
      setSaveLeaders(saves)
    } catch (error) {
      console.error('Error loading homepage data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const handleUpdate = () => fetchData()
    window.addEventListener('dataUpdated', handleUpdate)
    return () => window.removeEventListener('dataUpdated', handleUpdate)
  }, [fetchData])

  const handleWeekChange = async (newWeek: number) => {
    setConfig((current) => (current ? { ...current, current_week: newWeek } : current))
    setCurrentWeekGames(await getGamesByWeek(newWeek))
  }

  if (isLoading) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center">
        <p className="text-black text-xl">Loading league data...</p>
      </div>
    )
  }

  const currentWeek = config?.current_week ?? 1
  const totalWeeks = config?.total_weeks ?? 10
  const playoffsStarted = config?.playoffs_started ?? false

  const navLink =
    'inline-block px-6 py-3 bg-[#D47F7D] hover:bg-[#D47F7D]/90 rounded-lg font-semibold transition-colors text-black'

  return (
    <div className="w-full">
      <section className="py-8 px-4 sm:px-6 text-center">
        <p className="text-lg sm:text-xl text-[#523232] font-semibold tracking-wide">
          {config?.season ?? LEAGUE.fallbackSeason}
        </p>
      </section>

      <section className="py-6 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-center gap-4">
          <Link href="/schedule" className={navLink}>
            Full Season Schedule
          </Link>
          <Link href="/standings" className={navLink}>
            Standings
          </Link>
          <Link href="/stats" className={navLink}>
            Player Stats &amp; Awards
          </Link>
        </div>
      </section>

      {LEAGUE.jerseyShopUrl && (
        <section className="px-4 sm:px-6 mb-6">
          <div className="max-w-7xl mx-auto text-center">
            <a
              href={LEAGUE.jerseyShopUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#B2D497] hover:bg-[#B2D497]/90 rounded-lg font-bold transition-colors text-black text-lg shadow-lg"
            >
              <ShoppingBag size={20} />
              Buy a league jersey
            </a>
          </div>
        </section>
      )}

      {isAdmin && (
        <section className="px-4 sm:px-6 mb-4">
          <div className="max-w-7xl mx-auto">
            <CurrentWeekControl
              currentWeek={currentWeek}
              totalWeeks={totalWeeks}
              playoffsStarted={playoffsStarted}
              onWeekChange={handleWeekChange}
              onConfigChange={fetchData}
            />
          </div>
        </section>
      )}

      {playoffsStarted ? (
        <>
          <ChampionshipGameCard />
          <PlayoffBracket />
        </>
      ) : (
        <WeeklyGames games={currentWeekGames} weekNumber={currentWeek} />
      )}

      <TeamLogos />

      <StatLeaders goals={goalLeaders} assists={assistLeaders} saves={saveLeaders} />
    </div>
  )
}
