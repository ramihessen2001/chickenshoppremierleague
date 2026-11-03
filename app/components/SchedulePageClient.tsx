/**
 * Schedule page: loads the season and hands it to FullSchedule to render.
 *
 * Only *this* season's fixtures are listed. Previous seasons stay in the games
 * table -- team pages and their results histories are built from them -- but a
 * fixture list that opened on last year's played games would read as though the
 * season had already started, so anything before the configured start date is
 * filtered out here rather than deleted.
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import { FullSchedule } from '@/app/components/FullSchedule'
import { getAllGames, getLeagueConfig } from '@/lib/supabaseData'
import { isHiddenWeek, REVOLUTION_HIDDEN_WEEKS } from '@/lib/revolution'
import { Game } from '@/types/game'

export function SchedulePageClient() {
  const [games, setGames] = useState<Game[]>([])
  const [currentWeek, setCurrentWeek] = useState(1)
  const [totalWeeks, setTotalWeeks] = useState(10)
  const [revolution, setRevolution] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [config, allGames] = await Promise.all([getLeagueConfig(), getAllGames()])
      if (config) {
        setCurrentWeek(config.current_week)
        setTotalWeeks(config.total_weeks)
        setRevolution(config.revolution_view ?? false)
      }

      // Both dates are ISO (YYYY-MM-DD), so a string compare orders them.
      // Games after the end date are kept: a fixture can be rearranged into a
      // later week, and dropping it would hide a real game.
      // The Revolution view also leaves out the early matchweeks' games.
      const seasonStart = config?.start_date
      setGames(
        allGames.filter(
          (game) =>
            (!seasonStart || game.date >= seasonStart) &&
            !(config?.revolution_view && isHiddenWeek(game.weekNumber))
        )
      )
    } catch (error) {
      console.error('Error fetching schedule:', error)
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

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-[15px] text-ink-tertiary">Loading…</p>
      </div>
    )
  }

  return (
    <FullSchedule
      games={games}
      currentWeek={currentWeek}
      totalWeeks={totalWeeks}
      firstWeek={revolution ? REVOLUTION_HIDDEN_WEEKS + 1 : 1}
    />
  )
}
