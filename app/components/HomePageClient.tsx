/**
 * Homepage.
 *
 * What it leads with follows `league_config.phase`, so the site tracks the
 * season without a deploy: registration while signups are open, then a holding
 * message through the draft, then fixtures, then the bracket.
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
import { SignupForm } from './SignupForm'
import { LiveNow } from './LiveNow'
import { useAdmin } from '@/lib/adminContext'
import { LEAGUE } from '@/config/league'
import { getGamesByWeek, getStatLeaders, getLeagueConfig } from '@/lib/supabaseData'
import { LeagueConfig, LeaguePhase } from '@/lib/supabase'
import { LeaderboardEntry } from '@/types/statistic'
import { Game } from '@/types/game'

/** The headline and supporting line for each phase. */
const HERO_COPY: Record<LeaguePhase, { title: string; body: string }> = {
  signups: {
    title: 'Registration is open',
    body: 'Sign up below to play this season. Once registration closes we hold the draft, and teams are announced here.',
  },
  preseason: {
    title: 'Registration is closed',
    body: 'Thanks to everyone who signed up. The draft is next — teams and the fixture list will appear here.',
  },
  draft: {
    title: 'Draft in progress',
    body: 'Teams are being picked now. Rosters appear here as they fill.',
  },
  season: {
    title: LEAGUE.name,
    body: 'Fixtures, results, standings and statistics — updated through the season.',
  },
  playoffs: {
    title: 'Playoffs',
    body: 'The bracket, the final, and everything that got us here.',
  },
}

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

  const phase: LeaguePhase = config?.phase ?? 'season'
  const currentWeek = config?.current_week ?? 1
  const totalWeeks = config?.total_weeks ?? 10
  const hero = HERO_COPY[phase]

  // Before the season starts there are no results to link to, so the hero
  // offers registration instead of pages that would be empty.
  const isPreSeason =
    phase === 'signups' || phase === 'preseason' || phase === 'draft'

  return (
    <div>
      <LiveNow />

      <section className="mx-auto max-w-6xl px-5 pt-20 pb-16 sm:px-8 sm:pt-28 sm:pb-20">
        <p className="eyebrow">{config?.season ?? LEAGUE.fallbackSeason}</p>
        <h1 className="mt-4 max-w-3xl text-[2.75rem] font-semibold text-ink sm:text-[4rem]">
          {hero.title}
        </h1>
        <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-ink-secondary">
          {hero.body}
        </p>

        <div className="mt-9 flex flex-wrap items-center gap-3">
          {phase === 'signups' ? (
            <a
              href="#register"
              className="rounded-pill bg-surface-inverse px-5 py-2.5 text-[14px] font-medium text-ink-inverse transition-opacity hover:opacity-85"
            >
              Register to play
            </a>
          ) : (
            <Link
              href="/schedule"
              className="rounded-pill bg-surface-inverse px-5 py-2.5 text-[14px] font-medium text-ink-inverse transition-opacity hover:opacity-85"
            >
              View schedule
            </Link>
          )}

          {!isPreSeason && (
            <Link
              href="/stats"
              className="rounded-pill border border-hairline-strong px-5 py-2.5 text-[14px] font-medium text-ink transition-colors hover:bg-surface-hover"
            >
              Player stats
            </Link>
          )}

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
            phase={phase}
            currentWeek={currentWeek}
            totalWeeks={totalWeeks}
            onWeekChange={handleWeekChange}
            onConfigChange={fetchData}
          />
        </section>
      )}

      {phase === 'signups' && (
        <section
          id="register"
          className="mx-auto max-w-3xl scroll-mt-20 px-5 pb-16 sm:px-8"
          aria-labelledby="register-heading"
        >
          <h2
            id="register-heading"
            className="text-[28px] font-semibold text-ink sm:text-[32px]"
          >
            Register
          </h2>
          <p className="mt-3 text-[15px] text-ink-secondary">
            One registration per player. We&apos;ll be in touch before the draft.
          </p>
          <div className="mt-8">
            <SignupForm />
          </div>
        </section>
      )}

      {phase === 'playoffs' && (
        <>
          <ChampionshipGameCard />
          <PlayoffBracket />
        </>
      )}

      {phase === 'season' && (
        <WeeklyGames games={currentWeekGames} weekNumber={currentWeek} />
      )}

      {!isPreSeason && (
        <StatLeaders goals={goalLeaders} assists={assistLeaders} saves={saveLeaders} />
      )}

      <TeamLogos />
    </div>
  )
}
