/**
 * Supabase Awards Data Functions
 * Functions for managing awards, nominees, and votes
 */

import { supabase, supabaseAdmin, Award, AwardNominee, AwardVote, Player } from './supabase'

/**
 * Extended interfaces for awards with related data
 */
export interface AwardWithNominees extends Award {
  nominees: Array<{
    id: string
    player: Player & { team: { name: string; slug: string; logoUrl: string } }
    voteCount: number
  }>
  totalVotes: number
  userHasVoted: boolean
}

/**
 * Get all awards with their nominees and vote counts
 */
export async function getAwardsWithNominees(voterIdentifier?: string): Promise<AwardWithNominees[]> {
  try {
    // Fetch all active awards
    const { data: awards, error: awardsError } = await supabase
      .from('awards')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (awardsError) throw awardsError
    if (!awards) return []

    // Fetch nominees for all awards
    const { data: nominees, error: nomineesError } = await supabase
      .from('award_nominees')
      .select(`
        id,
        award_id,
        player_id,
        players (
          id,
          name,
          jersey_number,
          position,
          team_id,
          teams (
            id,
            name,
            slug,
            logo_url
          )
        )
      `)

    if (nomineesError) throw nomineesError

    // Fetch all votes
    const { data: votes, error: votesError } = await supabase
      .from('award_votes')
      .select('award_id, nominee_id, voter_identifier')

    if (votesError) throw votesError

    // Check if user has voted for each award
    const userVotes = voterIdentifier
      ? votes?.filter(v => v.voter_identifier === voterIdentifier) || []
      : []

    // Combine data
    const awardsWithNominees: AwardWithNominees[] = awards.map(award => {
      const awardNominees = nominees?.filter(n => n.award_id === award.id) || []
      const awardVotes = votes?.filter(v => v.award_id === award.id) || []
      const userHasVoted = userVotes.some(v => v.award_id === award.id)

      const nomineesWithVotes = awardNominees.map(nominee => {
        const voteCount = awardVotes.filter(v => v.nominee_id === nominee.id).length
        const player = nominee.players as any
        const team = player?.teams as any

        return {
          id: nominee.id,
          player: {
            id: player?.id || '',
            name: player?.name || '',
            jersey_number: player?.jersey_number || 0,
            position: player?.position || null,
            team_id: player?.team_id || '',
            is_active: true,
            created_at: '',
            updated_at: '',
            team: {
              name: team?.name || '',
              slug: team?.slug || '',
              logoUrl: team?.logo_url || ''
            }
          },
          voteCount
        }
      })

      return {
        ...award,
        nominees: nomineesWithVotes,
        totalVotes: awardVotes.length,
        userHasVoted
      }
    })

    return awardsWithNominees
  } catch (error) {
    console.error('Error fetching awards with nominees:', error)
    return []
  }
}

/**
 * Create a new award (Admin only)
 */
export async function createAward(award: Omit<Award, 'id' | 'created_at' | 'updated_at'>): Promise<Award | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('awards')
      .insert(award)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating award:', error)
    return null
  }
}

/**
 * Update an award (Admin only)
 */
export async function updateAward(id: string, updates: Partial<Award>): Promise<Award | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('awards')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating award:', error)
    return null
  }
}

/**
 * Delete an award (Admin only)
 */
export async function deleteAward(id: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('awards')
      .delete()
      .eq('id', id)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting award:', error)
    return false
  }
}

/**
 * Add a nominee to an award (Admin only)
 */
export async function addNominee(awardId: string, playerId: string): Promise<AwardNominee | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('award_nominees')
      .insert({ award_id: awardId, player_id: playerId })
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error adding nominee:', error)
    return null
  }
}

/**
 * Remove a nominee from an award (Admin only)
 */
export async function removeNominee(nomineeId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('award_nominees')
      .delete()
      .eq('id', nomineeId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error removing nominee:', error)
    return false
  }
}

/**
 * Submit a vote for a nominee
 */
export async function submitVote(
  awardId: string,
  nomineeId: string,
  voterIdentifier: string,
  voterName?: string
): Promise<boolean> {
  try {
    // Check if user has already voted for this award
    const { data: existingVote } = await supabase
      .from('award_votes')
      .select('id')
      .eq('award_id', awardId)
      .eq('voter_identifier', voterIdentifier)
      .single()

    if (existingVote) {
      console.error('User has already voted for this award')
      return false
    }

    // Submit the vote
    const { error } = await supabase
      .from('award_votes')
      .insert({
        award_id: awardId,
        nominee_id: nomineeId,
        voter_identifier: voterIdentifier,
        voter_name: voterName
      })

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error submitting vote:', error)
    return false
  }
}

/**
 * Get vote counts for an award (Admin only - shows detailed results)
 */
export async function getAwardVoteResults(awardId: string): Promise<Array<{
  nomineeId: string
  playerName: string
  voteCount: number
  voterNames: string[]
}>> {
  try {
    const { data: nominees, error: nomineesError } = await supabase
      .from('award_nominees')
      .select(`
        id,
        players (
          name
        )
      `)
      .eq('award_id', awardId)

    if (nomineesError) throw nomineesError

    const { data: votes, error: votesError } = await supabase
      .from('award_votes')
      .select('nominee_id, voter_name')
      .eq('award_id', awardId)

    if (votesError) throw votesError

    const results = nominees?.map(nominee => {
      const nomineeVotes = votes?.filter(v => v.nominee_id === nominee.id) || []
      const voteCount = nomineeVotes.length
      const voterNames = nomineeVotes
        .map(v => v.voter_name)
        .filter(name => name) as string[]
      const player = nominee.players as any

      return {
        nomineeId: nominee.id,
        playerName: player?.name || '',
        voteCount,
        voterNames
      }
    }) || []

    return results.sort((a, b) => b.voteCount - a.voteCount)
  } catch (error) {
    console.error('Error getting vote results:', error)
    return []
  }
}

/**
 * Get all awards (Admin only - for management)
 */
export async function getAllAwards(): Promise<Award[]> {
  try {
    const { data, error } = await supabase
      .from('awards')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching all awards:', error)
    return []
  }
}


