/**
 * Team type definitions for YM Soccer League
 * Represents a soccer team in the league with roster and metadata
 */

import { Player } from './player'

export interface Team {
  id: string                    // Unique identifier (e.g., "eagles")
  name: string                  // Display name (e.g., "Eagles")
  logoUrl: string               // Path to logo image
  roster: Player[]              // Array of players on team
  primaryColor?: string         // Optional: Team primary color for UI accents
  createdAt: string             // ISO 8601 timestamp
  updatedAt: string             // ISO 8601 timestamp
}

export type TeamId = 'eagles' | 'panthers' | 'lions' | 'dolphins' | 'knights' | 'warriors'

