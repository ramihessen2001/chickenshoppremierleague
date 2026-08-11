/**
 * CurrentWeekControl - Admin component to change which week is displayed as "Today's Games"
 */

'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'

interface CurrentWeekControlProps {
  currentWeek: number
  totalWeeks: number
  onWeekChange: (newWeek: number) => void
}

export function CurrentWeekControl({ currentWeek, totalWeeks, onWeekChange }: CurrentWeekControlProps) {
  const [isUpdating, setIsUpdating] = useState(false)

  const updateCurrentWeek = async (newWeek: number) => {
    if (newWeek < 1 || newWeek > totalWeeks || newWeek === currentWeek) return
    
    setIsUpdating(true)
    try {
      // Call API route to update league config
      const response = await fetch('/api/league-config', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ current_week: newWeek }),
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('Error updating current week:', error)
        alert('Failed to update current week. Please try again.')
        return
      }

      // Notify parent component and trigger data refresh
      onWeekChange(newWeek)
      
      // Dispatch event to refresh all components
      window.dispatchEvent(new Event('dataUpdated'))
    } catch (error) {
      console.error('Error updating current week:', error)
      alert('Failed to update current week. Please try again.')
    } finally {
      setIsUpdating(false)
    }
  }

  const handlePrevious = () => {
    if (currentWeek > 1) {
      updateCurrentWeek(currentWeek - 1)
    }
  }

  const handleNext = () => {
    if (currentWeek < totalWeeks) {
      updateCurrentWeek(currentWeek + 1)
    }
  }

  return (
    <div className="bg-[#D47F7D]/10 border-2 border-[#D47F7D] rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="text-[#D47F7D]" size={20} />
          <span className="text-black font-semibold">Admin: Set Current Day</span>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handlePrevious}
            disabled={currentWeek <= 1 || isUpdating}
            className="p-2 rounded bg-[#D47F7D] text-black hover:bg-[#c66f6d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Previous day"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="min-w-[100px] text-center">
            <span className="text-black font-bold text-lg">
              Day {currentWeek}
            </span>
            <span className="text-gray-400 text-sm block">
              of {totalWeeks}
            </span>
          </div>
          
          <button
            onClick={handleNext}
            disabled={currentWeek >= totalWeeks || isUpdating}
            className="p-2 rounded bg-[#D47F7D] text-black hover:bg-[#c66f6d] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Next day"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
      
      {isUpdating && (
        <div className="mt-2 text-center text-sm text-gray-400">
          Updating...
        </div>
      )}
    </div>
  )
}

