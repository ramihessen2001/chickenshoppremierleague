/**
 * Homepage.
 *
 * A quiet hero, then the week's fixtures, then leaders, then teams. During the
 * playoffs the bracket and final replace the weekly fixtures, driven by the
 * `playoffs_started` flag rather than by commenting out code.
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { WeeklyGames } from './WeeklyGames'
import { TeamLogos } from './TeamLogos'
import { StatLeaders } from './StatLeaders'
import { CurrentWeekControl } from './CurrentWeekControl'
import { PlayoffBracket } from './PlayoffBracket'
import { ChampionshipGameCard } from './ChampionshipGameCard'
import { useAdmin } from '@/lib/adminContext'
import { LEAGUE } from '@/config/league'
import { getGamesByWeek, getStatLeaders, getLeagueConfig } from '@/lib/supabaseData'
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
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-[15px] text-ink-tertiary">Loading…</p>
      </div>
    )
  }

  const currentWeek = config?.current_week ?? 1
  const totalWeeks = config?.total_weeks ?? 10
  const playoffsStarted = config?.playoffs_started ?? false

  return (
    <div>
      {/* Hero. One idea per line, nothing competing for attention. */}
      <section className="mx-auto max-w-6xl px-5 pt-20 pb-16 sm:px-8 sm:pt-28 sm:pb-20">
        <p className="eyebrow">{config?.season ?? LEAGUE.fallbackSeason}</p>
        <h1 className="mt-4 max-w-3xl text-[2.75rem] font-semibold text-ink sm:text-[4rem]">
          {LEAGUE.name}
        </h1>
        <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-ink-secondary">
          Fixtures, results, standings and statistics — updated through the
          season.
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Link
            href="/schedule"
            className="rounded-pill bg-surface-inverse px-5 py-2.5 text-[14px] font-medium text-ink-inverse transition-opacity hover:opacity-85"
          >
            View schedule
          </Link>
          <Link
            href="/stats"
            className="rounded-pill border border-hairline-strong px-5 py-2.5 text-[14px] font-medium text-ink transition-colors hover:bg-surface-hover"
          >
            Player stats
          </Link>
          {LEAGUE.jerseyShopUrl && (
            <a
              href={LEAGUE.jerseyShopUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-1 text-[14px] font-medium text-accent-ink transition-opacity hover:opacity-70"
            >
              Buy a kit →
            </a>
          )}
        </div>
      </section>

      {isAdmin && (
        <section className="mx-auto max-w-6xl px-5 pb-10 sm:px-8">
          <CurrentWeekControl
            currentWeek={currentWeek}
            totalWeeks={totalWeeks}
            playoffsStarted={playoffsStarted}
            onWeekChange={handleWeekChange}
            onConfigChange={fetchData}
          />
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

      <StatLeaders goals={goalLeaders} assists={assistLeaders} saves={saveLeaders} />

      <TeamLogos />
    </div>
  )
}
