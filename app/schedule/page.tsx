/**
 * Full Season Schedule Page
 * Displays all games for the entire season organized by week
 */

import { SchedulePageClient } from '@/app/components/SchedulePageClient'

export const metadata = {
  title: 'Full Season Schedule - YM JAX Soccer League',
  description: 'View the complete schedule for the 2025 YM JAX Soccer Winter League season.'
}

export default function SchedulePage() {
  return <SchedulePageClient />
}

