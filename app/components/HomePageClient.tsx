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
import { ChevronDown } from 'lucide-react'
import { WeeklyGames } from './WeeklyGames'
import { TeamLogos } from './TeamLogos'
import { StatLeaders } from './StatLeaders'
import { CurrentWeekControl } from './CurrentWeekControl'
import { PlayoffBracket } from './PlayoffBracket'
import { ChampionshipGameCard } from './ChampionshipGameCard'
import { SignupForm } from './SignupForm'
import { LiveNow } from './LiveNow'
import { useAdmin } from '@/lib/adminContext'
import { useTeams } from '@/lib/teamsContext'
import { LEAGUE } from '@/config/league'
import {
  getGamesByWeek,
  getStatLeaders,
  getLeagueConfig,
  countGames,
} from '@/lib/supabaseData'
import { hasOpenAwards } from '@/lib/supabaseAwards'
import { LeagueConfig, LeaguePhase } from '@/lib/supabase'
import { LeaderboardEntry } from '@/types/statistic'
import { Game } from '@/types/game'

/** The headline and supporting line for each phase. */
const HERO_COPY: Record<LeaguePhase, { title: string; body: string }> = {
  signups: {
    title: 'Registration is open',
    body: 'Sign up to play this season. Once registration closes we hold the draft, and teams are announced here.',
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

interface HeroAction {
  href: string
  label: string
  variant: 'primary' | 'secondary'
}

/**
 * The hero's buttons for the current phase.
 *
 * The governing rule is that a button never points at a page that is empty in
 * this phase. Before the draft there are no fixtures, standings or statistics,
 * so the only thing worth offering is the team list.
 */
function heroActions(state: {
  phase: LeaguePhase
  hasTeams: boolean
  hasFixtures: boolean
  awardsOpen: boolean
}): HeroAction[] {
  const { phase, hasTeams, hasFixtures, awardsOpen } = state
  const meetTheTeams = (variant: HeroAction['variant']): HeroAction[] =>
    hasTeams ? [{ href: '#teams', label: 'Meet the teams', variant }] : []

  switch (phase) {
    // The registration form sits beside the headline, so it is the call to
    // action; a button pointing at it would be redundant.
    case 'signups':
      return meetTheTeams('secondary')

    case 'preseason':
    case 'draft':
      return meetTheTeams('primary')

    case 'season':
      return hasFixtures
        ? [
            { href: '/schedule', label: 'View schedule', variant: 'primary' },
            { href: '/standings', label: 'Standings', variant: 'secondary' },
          ]
        : [{ href: '/standings', label: 'Standings', variant: 'primary' }]

    // The bracket is already directly below the hero during the playoffs, so
    // the button offers voting instead -- but only if a vote is actually open.
    case 'playoffs':
      return awardsOpen
        ? [
            { href: '/stats', label: 'Vote for awards', variant: 'primary' },
            { href: '/standings', label: 'Standings', variant: 'secondary' },
          ]
        : [{ href: '/standings', label: 'Standings', variant: 'primary' }]
  }
}

const BUTTON_STYLES: Record<HeroAction['variant'], string> = {
  primary:
    'rounded-pill bg-surface-inverse px-5 py-2.5 text-[14px] font-medium text-ink-inverse transition-opacity hover:opacity-85',
  secondary:
    'rounded-pill border border-hairline-strong px-5 py-2.5 text-[14px] font-medium text-ink transition-colors hover:bg-surface-hover',
}

export function HomePageClient() {
  const { isAdmin } = useAdmin()
  const { teams } = useTeams()
  const [config, setConfig] = useState<LeagueConfig | null>(null)
  const [currentWeekGames, setCurrentWeekGames] = useState<Game[]>([])
  const [gameCount, setGameCount] = useState(0)
  const [awardsOpen, setAwardsOpen] = useState(false)
  const [goalLeaders, setGoalLeaders] = useState<LeaderboardEntry[]>([])
  const [assistLeaders, setAssistLeaders] = useState<LeaderboardEntry[]>([])
  const [saveLeaders, setSaveLeaders] = useState<LeaderboardEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  /** Mobile only: the league details table starts collapsed. */
  const [showDetails, setShowDetails] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const leagueConfig = await getLeagueConfig()
      setConfig(leagueConfig)

      const week = leagueConfig?.current_week ?? 1
      const [games, totalGames, openAwards, goals, assists, saves] =
        await Promise.all([
          getGamesByWeek(week),
          countGames(),
          hasOpenAwards(),
          getStatLeaders('goal', 5),
          getStatLeaders('assist', 5),
          getStatLeaders('save', 5),
        ])

      setCurrentWeekGames(games)
      setGameCount(totalGames)
      setAwardsOpen(openAwards)
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

  const isRegistering = phase === 'signups'
  const isPreSeason =
    phase === 'signups' || phase === 'preseason' || phase === 'draft'

  const actions = heroActions({
    phase,
    hasTeams: teams.length > 0,
    hasFixtures: gameCount > 0,
    awardsOpen,
  })

  return (
    <div>
      <LiveNow />

      <section className="mx-auto max-w-6xl px-5 pt-20 pb-16 sm:px-8 sm:pt-28 sm:pb-20">
        {/* While registration is open the form sits beside the headline, so the
            first thing on the page is the thing we want people to do. */}
        <div
          className={
            isRegistering
              ? 'grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-16'
              : ''
          }
        >
          <div>
            <h1
              className={`font-semibold text-ink ${
                isRegistering
                  ? 'text-[2.5rem] sm:text-[3.25rem]'
                  : 'max-w-3xl text-[2.75rem] sm:text-[4rem]'
              }`}
            >
              {hero.title}
            </h1>
            <p className="mt-5 max-w-xl text-[17px] leading-relaxed text-ink-secondary">
              {hero.body}
            </p>

            {actions.length > 0 && (
              <div className="mt-9 flex flex-wrap items-center gap-3">
                {actions.map(({ href, label, variant }) =>
                  href.startsWith('#') ? (
                    <a key={href} href={href} className={BUTTON_STYLES[variant]}>
                      {label}
                    </a>
                  ) : (
                    <Link key={href} href={href} className={BUTTON_STYLES[variant]}>
                      {label}
                    </Link>
                  )
                )}
              </div>
            )}

            {/* The facts a prospective player needs before filling the form
                in. Only while registration is open -- once the season starts
                the schedule and standings pages say all of this.

                Collapsed behind a toggle on narrow screens, where the whole
                table between the headline and the form would push the form
                off the first screen. Always open from `lg` up, where it sits
                beside the form rather than above it. */}
            {isRegistering && (
              <div className="mt-10 max-w-xl">
                <button
                  type="button"
                  onClick={() => setShowDetails((open) => !open)}
                  aria-expanded={showDetails}
                  aria-controls="league-details"
                  className="flex w-full items-center justify-between gap-4 rounded-lg border border-hairline bg-surface px-5 py-3.5 text-[14px] font-medium text-ink transition-colors hover:bg-surface-hover lg:hidden"
                >
                  League details
                  <ChevronDown
                    size={18}
                    className={`shrink-0 text-ink-tertiary transition-transform ${
                      showDetails ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                <dl
                  id="league-details"
                  className={`rounded-lg border border-hairline bg-surface max-lg:mt-2 lg:block ${
                    showDetails ? '' : 'max-lg:hidden'
                  }`}
                >
                  {LEAGUE.details.map(([label, value]) => (
                    <div
                      key={label}
                      className="grid gap-1 border-t border-hairline px-5 py-3.5 first:border-t-0 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4 sm:px-6"
                    >
                      <dt className="text-[13px] font-medium text-ink-tertiary">
                        {label}
                      </dt>
                      <dd className="whitespace-pre-line text-[14px] leading-relaxed text-ink">
                        {value}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>

          {isRegistering && (
            <div id="register" className="scroll-mt-20">
              <SignupForm />
            </div>
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
