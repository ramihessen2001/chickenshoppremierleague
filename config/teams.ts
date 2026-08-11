/**
 * Team Configuration for YM JAX Soccer League
 * Defines all 6 teams in the league with metadata
 */

import { TeamId } from '@/types/team'

export interface TeamConfig {
  id: TeamId
  name: string
  logoUrl: string
  primaryColor: string
}

export const TEAMS: TeamConfig[] = [
  {
    id: 'eagles',
    name: 'Eagles',
    logoUrl: '/images/eagles_logo.png',
    primaryColor: '#D47F7D'
  },
  {
    id: 'panthers',
    name: 'Panthers',
    logoUrl: '/images/panthers_logo.png',
    primaryColor: '#000000'
  },
  {
    id: 'lions',
    name: 'Lions',
    logoUrl: '/images/lions_logo.png',
    primaryColor: '#B8860B'
  },
  {
    id: 'dolphins',
    name: 'Dolphins',
    logoUrl: '/images/dolphins_logo.png',
    primaryColor: '#D47F7D'
  },
  {
    id: 'knights',
    name: 'Knights',
    logoUrl: '/images/knights_logo.png',
    primaryColor: '#523232'
  },
  {
    id: 'warriors',
    name: 'Warriors',
    logoUrl: '/images/warriors_logo.png',
    primaryColor: '#8B0000'
  }
]

export const getTeamById = (id: string): TeamConfig | undefined => {
  return TEAMS.find(team => team.id === id)
}

