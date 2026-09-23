/**
 * Date and time formatting helpers.
 */

/**
 * Calculates current week number based on system date and league start date
 * Week 1 starts on startDate, each week is 7 days
 * 
 * @param startDate - League start date (ISO 8601 format: YYYY-MM-DD)
 * @param totalWeeks - Total weeks in season
 * @returns Current week number (1 to totalWeeks)
 * 
 * Example: If startDate is 2025-01-08 and today is 2025-01-22,
 * that's 14 days = 2 weeks elapsed, so return 3 (week 3)
 */
export function calculateCurrentWeek(startDate: string, totalWeeks: number): number {
  const now = new Date()
  const start = new Date(startDate)
  
  // Calculate days since season start
  const daysSinceStart = Math.floor(
    (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  )
  
  // Calculate weeks (add 1 because week 1 starts on day 0)
  const weeksSinceStart = Math.floor(daysSinceStart / 7) + 1
  
  // Clamp between 1 and totalWeeks
  return Math.min(Math.max(weeksSinceStart, 1), totalWeeks)
}

/**
 * Formats a date string for display
 * 
 * @param dateString - ISO 8601 date string (YYYY-MM-DD)
 * @returns Formatted date (e.g., "Jan 22, 2025")
 */
export function formatDate(dateString: string): string {
  // Parse the date components to avoid timezone issues
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day) // month is 0-indexed
  
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

/**
 * Formats a time string for display
 * Handles both 12-hour and 24-hour formats
 *
 * @param timeString - Time string (e.g., "6:00 PM", "18:00", or a label like "Maghrib")
 * @returns Formatted time in 12-hour format, or the original string if it isn't a clock time
 */
export function formatTime(timeString: string): string {
  // If already in 12-hour format with AM/PM, return as-is
  if (timeString.includes('AM') || timeString.includes('PM')) {
    return timeString
  }

  // Not a 24-hour clock time (e.g. a prayer-time label like "Isha'a") -- leave it alone.
  if (!/^\d{1,2}:\d{2}$/.test(timeString.trim())) {
    return timeString
  }

  // Convert 24-hour to 12-hour
  const [hours, minutes] = timeString.split(':').map(Number)
  const period = hours >= 12 ? 'PM' : 'AM'
  const displayHours = hours % 12 || 12

  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`
}

/**
 * Chronological order for the prayer-time slot labels used as `game.time`.
 * Maghrib and Assr are both "first slot of the day" -- they never occur on
 * the same date, so sharing a rank is fine -- and Isha'a is always later.
 */
const TIME_LABEL_ORDER: Record<string, number> = {
  Maghrib: 0,
  Assr: 0,
  "Isha'a": 1,
}

/** Same-day sort comparator for `game.time`. Falls back to string order for
 *  anything that isn't one of the known slot labels (e.g. legacy "6:00 PM"). */
export function compareGameTimes(a: string, b: string): number {
  const rankA = TIME_LABEL_ORDER[a]
  const rankB = TIME_LABEL_ORDER[b]
  if (rankA !== undefined && rankB !== undefined) return rankA - rankB
  return a.localeCompare(b)
}

