/**
 * Awards, nominees and voting.
 *
 * Reads use the anon Supabase client. Every write goes through a server route
 * -- admin actions through /api/admin/*, public votes through /api/votes --
 * because the browser has no key that can write.
 */

import { supabase, Award, AwardNominee, Player } from './supabase'

/** Calls a route and returns the parsed body, throwing the server's message. */
async function apiRequest<T>(
  path: string,
  method: string,
  body?: unknown
): Promise<T> {
  const response = await fetch(path, {
    method,
    ...(body === undefined
      ? {}
      : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(
      response.status === 401
        ? 'Your admin session has expired. Please log in again.'
        : payload.error || `Request failed (${response.status})`
    )
  }
  return payload as T
}

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
 * Create an award. Season defaults to the league's current season server-side.
 */
export async function createAward(award: {
  name: string
  description?: string
  season?: string
  is_active?: boolean
  voting_start_date?: string | null
  voting_end_date?: string | null
}): Promise<Award> {
  const { award: created } = await apiRequest<{ award: Award }>(
    '/api/admin/awards',
    'POST',
    {
      name: award.name,
      description: award.description,
      season: award.season,
      isActive: award.is_active,
      votingStartDate: award.voting_start_date,
      votingEndDate: award.voting_end_date,
    }
  )
  return created
}

/**
 * Update an award.
 */
export async function updateAward(
  id: string,
  updates: Partial<Award>
): Promise<Award> {
  const { award } = await apiRequest<{ award: Award }>(
    `/api/admin/awards/${id}`,
    'PATCH',
    {
      name: updates.name,
      description: updates.description,
      season: updates.season,
      isActive: updates.is_active,
      votingStartDate: updates.voting_start_date,
      votingEndDate: updates.voting_end_date,
    }
  )
  return award
}

/**
 * Delete an award along with its nominees and votes.
 */
export async function deleteAward(id: string): Promise<void> {
  await apiRequest(`/api/admin/awards/${id}`, 'DELETE')
}

/**
 * Nominate a player for an award.
 */
export async function addNominee(
  awardId: string,
  playerId: string
): Promise<AwardNominee> {
  const { nominee } = await apiRequest<{ nominee: AwardNominee }>(
    `/api/admin/awards/${awardId}/nominees`,
    'POST',
    { playerId }
  )
  return nominee
}

/**
 * Remove a nominee and any votes cast for them.
 */
export async function removeNominee(nomineeId: string): Promise<void> {
  await apiRequest(`/api/admin/nominees/${nomineeId}`, 'DELETE')
}

/**
 * Cast a vote.
 *
 * Returns null on success, or a message to show the voter. Duplicate votes are
 * rejected by a database constraint, so the "you already voted" case comes back
 * as a real error rather than a silent no-op.
 */
export async function submitVote(
  awardId: string,
  nomineeId: string,
  voterIdentifier: string,
  voterName?: string
): Promise<string | null> {
  try {
    await apiRequest('/api/votes', 'POST', {
      awardId,
      nomineeId,
      voterIdentifier,
      voterName,
    })
    return null
  } catch (error) {
    return error instanceof Error ? error.message : 'Failed to submit vote'
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



/**
 * The nominees for one award, with player names, for the admin panel.
 */
export async function getAwardNominees(awardId: string): Promise<
  Array<{ id: string; player_id: string; playerName: string }>
> {
  const { data, error } = await supabase
    .from('award_nominees')
    .select('id, player_id, players(name)')
    .eq('award_id', awardId)

  if (error) {
    console.error('Error fetching nominees:', error)
    return []
  }

  return (data ?? []).map((nominee: any) => {
    const player = Array.isArray(nominee.players) ? nominee.players[0] : nominee.players
    return {
      id: nominee.id,
      player_id: nominee.player_id,
      playerName: player?.name ?? '',
    }
  })
}

/**
 * Whether any award is currently accepting votes -- active, and inside its
 * voting window if one was set.
 *
 * Deliberately light: the homepage only needs a yes/no to decide whether to
 * offer a "Vote for awards" button, not the awards themselves.
 */
export async function hasOpenAwards(): Promise<boolean> {
  const { data, error } = await supabase
    .from('awards')
    .select('voting_start_date, voting_end_date')
    .eq('is_active', true)

  if (error) {
    console.error('Error checking open awards:', error)
    return false
  }

  const now = Date.now()

  return (data ?? []).some((award) => {
    if (award.voting_start_date && now < Date.parse(award.voting_start_date)) {
      return false
    }
    if (award.voting_end_date && now > Date.parse(award.voting_end_date)) {
      return false
    }
    return true
  })
}
