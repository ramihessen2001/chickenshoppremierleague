'use client'

import { useEffect, useState } from 'react'
import { getLeagueConfig } from './supabaseData'
import { LeaguePhase } from './supabase'

/** The current league phase, refreshed on `dataUpdated`. Null while loading. */
export function usePhase(): LeaguePhase | null {
  const [phase, setPhase] = useState<LeaguePhase | null>(null)

  useEffect(() => {
    const load = () => {
      getLeagueConfig().then((config) => setPhase(config?.phase ?? null))
    }
    load()
    window.addEventListener('dataUpdated', load)
    return () => window.removeEventListener('dataUpdated', load)
  }, [])

  return phase
}
