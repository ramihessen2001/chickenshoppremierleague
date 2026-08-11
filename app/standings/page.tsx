/**
 * League standings.
 */

import type { Metadata } from 'next'
import { StandingsPageClient } from '@/app/components/StandingsPageClient'

export const metadata: Metadata = {
  title: 'Standings',
  description: 'The current league table.',
}

export default function StandingsPage() {
  return <StandingsPageClient />
}


