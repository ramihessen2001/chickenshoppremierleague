/**
 * Data loading functions for YM JAX Soccer League
 * Server-side data fetching for teams and rosters
 */

import { promises as fs } from 'fs'
import path from 'path'
import { Team } from '@/types/team'
import { Player } from '@/types/player'
import { TEAMS } from '@/config/teams'
import { parseRosterCSV } from './dataParser'

/**
 * Loads and parses roster data from CSV file
 * @returns Array of all players across all teams
 */
export async function loadRosterData(): Promise<Player[]> {
  try {
    const filePath = path.join(process.cwd(), 'league_data', 'rosters.csv')
    const csvContent = await fs.readFile(filePath, 'utf-8')
    return parseRosterCSV(csvContent)
  } catch (error) {
    console.error('Error loading roster data:', error)
    return []
  }
}

/**
 * Gets all teams with their rosters
 * @returns Array of Team objects with complete roster data
 */
export async function getTeamsWithRosters(): Promise<Team[]> {
  const players = await loadRosterData()
  
  return TEAMS.map(teamConfig => {
    const roster = players.filter(p => p.teamId === teamConfig.id)
    
    return {
      id: teamConfig.id,
      name: teamConfig.name,
      logoUrl: teamConfig.logoUrl,
      roster,
      primaryColor: teamConfig.primaryColor,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  })
}

/**
 * Gets a single team by ID with roster
 * @param teamId - Team identifier
 * @returns Team object with roster, or null if not found
 */
export async function getTeamById(teamId: string): Promise<Team | null> {
  const teams = await getTeamsWithRosters()
  return teams.find(t => t.id === teamId) || null
}




