/**
 * Admin control for which week the homepage features, plus the switch that
 * hands the homepage over to the playoff bracket.
 */

'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar, Trophy } from 'lucide-react'
import { updateLeagueConfig, notifyDataUpdated } from '@/lib/supabaseData'

interface CurrentWeekControlProps {
  currentWeek: number
  totalWeeks: number
  playoffsStarted: boolean
  onWeekChange: (newWeek: number) => void
  /** Called after a change that the parent should re-read config for. */
  onConfigChange?: () => void
}

export function CurrentWeekControl({
  currentWeek,
  totalWeeks,
  playoffsStarted,
  onWeekChange,
  onConfigChange,
}: CurrentWeekControlProps) {
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const changeWeek = async (newWeek: number) => {
    if (newWeek < 1 || newWeek > totalWeeks || newWeek === currentWeek) return

    setIsUpdating(true)
    setError(null)
    try {
      await updateLeagueConfig({ currentWeek: newWeek })
      onWeekChange(newWeek)
      notifyDataUpdated()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to update week')
    } finally {
      setIsUpdating(false)
    }
  }

  const togglePlayoffs = async () => {
    setIsUpdating(true)
    setError(null)
    try {
      await updateLeagueConfig({ playoffsStarted: !playoffsStarted })
      onConfigChange?.()
      notifyDataUpdated()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to update playoffs')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="bg-[#D47F7D]/10 border-2 border-[#D47F7D] rounded-lg p-4 mb-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="text-[#523232]" size={20} />
          <span className="text-black font-semibold">Admin: current week</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => changeWeek(currentWeek - 1)}
            disabled={currentWeek <= 1 || isUpdating}
            className="p-2 rounded bg-[#D47F7D] text-black hover:bg-[#c66f6d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous week"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="min-w-[100px] text-center">
            <span className="text-black font-bold text-lg">Week {currentWeek}</span>
            <span className="text-gray-700 text-sm block">of {totalWeeks}</span>
          </div>

          <button
            onClick={() => changeWeek(currentWeek + 1)}
            disabled={currentWeek >= totalWeeks || isUpdating}
            className="p-2 rounded bg-[#D47F7D] text-black hover:bg-[#c66f6d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Next week"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[#D47F7D]/40 pt-4">
        <div className="flex items-center gap-2">
          <Trophy className="text-[#523232]" size={20} />
          <div>
            <p className="text-black font-semibold">Playoff mode</p>
            <p className="text-gray-700 text-sm">
              {playoffsStarted
                ? 'Homepage is showing the bracket and final.'
                : 'Homepage is showing the weekly fixtures.'}
            </p>
          </div>
        </div>

        <button
          onClick={togglePlayoffs}
          disabled={isUpdating}
          className="px-4 py-2 rounded bg-[#523232] text-white font-semibold hover:bg-[#6b4343] disabled:opacity-50 transition-colors"
        >
          {playoffsStarted ? 'Back to regular season' : 'Start playoffs'}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-700 font-medium" role="alert">
          {error}
        </p>
      )}
      {isUpdating && <p className="text-center text-sm text-gray-700">Updating...</p>}
    </div>
  )
}
