/**
 * Full season schedule, grouped by week.
 */

import type { Metadata } from 'next'
import { SchedulePageClient } from '@/app/components/SchedulePageClient'

export const metadata: Metadata = {
  title: 'Schedule',
  description: 'The complete fixture list for the season.',
}

export default function SchedulePage() {
  return <SchedulePageClient />
}

