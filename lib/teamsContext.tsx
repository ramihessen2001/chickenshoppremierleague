/**
 * Teams, loaded once from the database and shared across the app.
 *
 * The previous build hardcoded the six teams in config/teams.ts and pinned them
 * with a `TeamId` union type, so changing the league's teams meant editing code
 * in a dozen components. Teams now come from the `teams` table: add a row and
 * the whole site picks it up.
 *
 * Lookups are by slug because that is what games and players carry through the
 * UI, and what /teams/[teamId] uses in the URL.
 */

'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react'
import { supabase } from './supabase'
import { fallbackTeamLogo } from '@/config/league'

export interface LeagueTeam {
  /** Database UUID -- what games and players actually reference. */
  id: string
  /** URL-friendly identifier, used throughout the UI and in /teams/[slug]. */
  slug: string
  name: string
  logoUrl: string
  primaryColor: string
  displayOrder: number
}

interface TeamsContextValue {
  teams: LeagueTeam[]
  isLoading: boolean
  /** Look up a team by slug. Returns undefined for unknown or empty slugs. */
  getTeam: (slug: string | null | undefined) => LeagueTeam | undefined
  /** Look up a team by database UUID. */
  getTeamByUuid: (id: string | null | undefined) => LeagueTeam | undefined
  /** Display name, falling back to "TBD" for an unfilled slot. */
  teamName: (slug: string | null | undefined) => string
  /** Logo path, falling back to a conventional path for the slug. */
  teamLogo: (slug: string | null | undefined) => string
  refresh: () => Promise<void>
}

const TeamsContext = createContext<TeamsContextValue | null>(null)

export function TeamsProvider({ children }: { children: ReactNode }) {
  const [teams, setTeams] = useState<LeagueTeam[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('teams')
      .select('id, name, slug, logo_url, primary_color, display_order')
      .order('display_order')
      .order('name')

    if (error) {
      console.error('Error loading teams:', error)
      setIsLoading(false)
      return
    }

    setTeams(
      (data ?? []).map((row) => ({
        id: row.id,
        slug: row.slug,
        name: row.name,
        logoUrl: row.logo_url || fallbackTeamLogo(row.slug),
        primaryColor: row.primary_color || '#523232',
        displayOrder: row.display_order ?? 0,
      }))
    )
    setIsLoading(false)
  }, [])

  useEffect(() => {
    // load() is async, so its setState runs once the fetch resolves rather than
    // during this render. The rule's heuristic cannot see through the await.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()

    // Admin edits dispatch this event; re-read so renames and new teams appear
    // without a page reload.
    const handleUpdate = () => load()
    window.addEventListener('dataUpdated', handleUpdate)
    return () => window.removeEventListener('dataUpdated', handleUpdate)
  }, [load])

  const value = useMemo<TeamsContextValue>(() => {
    const bySlug = new Map(teams.map((team) => [team.slug, team]))
    const byUuid = new Map(teams.map((team) => [team.id, team]))

    const getTeam = (slug: string | null | undefined) =>
      slug ? bySlug.get(slug) : undefined

    return {
      teams,
      isLoading,
      getTeam,
      getTeamByUuid: (id) => (id ? byUuid.get(id) : undefined),
      teamName: (slug) => getTeam(slug)?.name ?? (slug ? slug : 'TBD'),
      teamLogo: (slug) =>
        getTeam(slug)?.logoUrl ?? (slug ? fallbackTeamLogo(slug) : ''),
      refresh: load,
    }
  }, [teams, isLoading, load])

  return <TeamsContext.Provider value={value}>{children}</TeamsContext.Provider>
}

export function useTeams(): TeamsContextValue {
  const context = useContext(TeamsContext)
  if (!context) {
    throw new Error('useTeams must be used within a TeamsProvider')
  }
  return context
}
