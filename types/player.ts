/**
 * Player type definitions for YM Soccer League
 * Represents an individual player on a team
 */

export interface Player {
  id: string                    // Unique identifier
  name: string                  // Full name (e.g., "Omar Helmy")
  jerseyNumber: number | 'TBD'  // Jersey number (0-999) or 'TBD' if not assigned
  teamId: string                // Foreign key to Team.id
  isActive: boolean             // Active roster vs inactive
  position?: string             // Optional: 'Forward', 'Midfielder', 'Defender', 'Goalkeeper'
  createdAt: string             // ISO 8601 timestamp
  updatedAt: string             // ISO 8601 timestamp
}

