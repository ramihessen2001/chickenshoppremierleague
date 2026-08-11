/**
 * Player statistics and award voting.
 */

import type { Metadata } from 'next'
import { PlayerStatsClient } from '../components/PlayerStatsClient'

export const metadata: Metadata = {
  title: 'Player Stats',
  description: 'Player statistics and end-of-season award voting.',
}

export default function StatsPage() {
  return <PlayerStatsClient />
}


