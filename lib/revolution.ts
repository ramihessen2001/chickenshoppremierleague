'use client'

/**
 * Revolution: a special view of the site the admin switches on from the admin
 * bar (league_config.revolution_view). While it is on, the schedule leaves out
 * the first few matchweeks, team pages leave out their results, and the
 * standings are hidden everywhere they are linked. Nothing is deleted.
 */

import { useEffect, useState } from 'react'
import { getLeagueConfig } from './supabaseData'

/** Matchweeks 1 to this one are left off the schedule. */
export const REVOLUTION_HIDDEN_WEEKS = 3

/** Whether a game's matchweek is one the schedule leaves out (never a playoff game). */
export function isHiddenWeek(weekNumber: number): boolean {
  return weekNumber >= 1 && weekNumber <= REVOLUTION_HIDDEN_WEEKS
}

/**
 * Whether the Revolution view is on, refreshed on `dataUpdated`. Null while
 * loading, so a page can hold back rather than flash what it is about to hide.
 */
export function useRevolution(): boolean | null {
  const [on, setOn] = useState<boolean | null>(null)

  useEffect(() => {
    const load = () => {
      getLeagueConfig().then((config) => setOn(config?.revolution_view ?? false))
    }
    load()
    window.addEventListener('dataUpdated', load)
    return () => window.removeEventListener('dataUpdated', load)
  }, [])

  return on
}
