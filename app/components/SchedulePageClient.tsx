/**
 * SchedulePageClient - Client-side wrapper for schedule with real-time data from Supabase
 */

'use client'

import { useEffect, useState } from 'react'
import { FullSchedule } from '@/app/components/FullSchedule'
import { getAllGames, getLeagueConfig } from '@/lib/supabaseData'
import { Game } from '@/types/game'

export function SchedulePageClient() {
  const [games, setGames] = useState<Game[]>([])
  const [currentWeek, setCurrentWeek] = useState<number>(1)
  const [totalWeeks, setTotalWeeks] = useState<number>(12)
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch league config
      const config = await getLeagueConfig()
      if (config) {
        setCurrentWeek(config.current_week)
        setTotalWeeks(config.total_weeks)
      }
      
      // Fetch all games from Supabase
      const allGames = await getAllGames()
      setGames(allGames)
    } catch (error) {
      console.error('Error fetching schedule:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    
    // Listen for data updates (custom event for when games are edited)
    const handleDataUpdate = () => {
      fetchData()
    }
    
    window.addEventListener('dataUpdated', handleDataUpdate)
    
    return () => {
      window.removeEventListener('dataUpdated', handleDataUpdate)
    }
  }, [])

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#A0CAC9] via-[#A0CAC9] to-[#FFE0AF] py-12 flex items-center justify-center">
        <p className="text-black text-xl">Loading schedule...</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#A0CAC9] via-[#A0CAC9] to-[#FFE0AF] py-12">
      <div className="max-w-7xl mx-auto px-6">
        <h1 className="text-4xl font-extrabold text-black uppercase text-center mb-10">
          Full Season Schedule
        </h1>
        <FullSchedule 
          games={games} 
          currentWeek={currentWeek}
          totalWeeks={totalWeeks}
        />
      </div>
    </main>
  )
}

