/**
 * League Standings Page
 * Displays the current league standings image uploaded by admin
 */

import { StandingsPageClient } from '@/app/components/StandingsPageClient'

export const metadata = {
  title: 'League Standings - YM JAX Soccer League',
  description: 'View the current standings for the 2025 YM JAX Soccer Winter League season.'
}

export default function StandingsPage() {
  return <StandingsPageClient />
}


