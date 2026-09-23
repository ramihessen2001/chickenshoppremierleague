/**
 * Generates the playoff bracket one round at a time, from the standings.
 *
 * Each round is only ever created once every game in the round before it has
 * a final score -- there is no auto-advance, so a season that ends in a tie
 * or an unusual result still needs someone to look at it, and the admin can
 * always fix a generated matchup with the regular edit-game tools before or
 * after it's created. See lib/bracket.ts for the seeding rules themselves.
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import { useAdmin } from '@/lib/adminContext'
import { getPlayoffGames, getStandings, createGame, notifyDataUpdated } from '@/lib/supabaseData'
import { Game } from '@/types/game'
import {
  BracketTeam,
  quarterfinalMatchups,
  semifinalMatchups,
  finalMatchup,
} from '@/lib/bracket'

/** Every game this generator creates happens at the league's one venue. */
const DEFAULT_LOCATION = 'Islamic Center of Northeast Florida (ICNEF)'

type Pairing = [BracketTeam, BracketTeam]

interface Stage {
  round: string
  label: string
  /** Shown once the matchups are known; null while still waiting on results. */
  ready: { description: string; pairs: Pairing[] } | null
}

/** Null if the game has no winner yet (unplayed, or an unlikely knockout draw). */
function winnerOf(game: Game, byId: Map<string, BracketTeam>): BracketTeam | null {
  if (game.homeScore === null || game.awayScore === null) return null
  if (game.homeScore === game.awayScore) return null
  const winningUuid = game.homeScore > game.awayScore ? game.homeTeamUUID : game.awayTeamUUID
  return winningUuid ? (byId.get(winningUuid) ?? null) : null
}

/**
 * Finds the game in `games` that was created for `pair` and returns its
 * winner, matched by the two team UUIDs rather than array position -- the
 * database doesn't promise to return a round's games in the order they
 * were created in, and getting 1v8's winner paired against 4v5's (not
 * whichever game happens to sort first) is the whole point of the bracket.
 */
function winnerOfPair(games: Game[], pair: Pairing, byId: Map<string, BracketTeam>): BracketTeam | null {
  const ids = new Set(pair.map((t) => t.id))
  const game = games.find((g) => ids.has(g.homeTeamUUID ?? '') && ids.has(g.awayTeamUUID ?? ''))
  return game ? winnerOf(game, byId) : null
}

/** Works out what the next generator action is, or null once the bracket is complete. */
function nextStage(seeds: BracketTeam[], playoffGames: Game[]): Stage | null {
  const byId = new Map(seeds.map((s) => [s.id, s]))
  const byRound = (round: string) => playoffGames.filter((g) => g.playoffRound === round)

  const qfPairs = quarterfinalMatchups(seeds)
  const quarterfinals = byRound('quarterfinal')
  if (quarterfinals.length === 0) {
    return {
      round: 'quarterfinal',
      label: 'Quarterfinals',
      ready: { description: '1st v 8th, 2nd v 7th, 3rd v 6th, 4th v 5th.', pairs: qfPairs },
    }
  }
  const qfWinners = qfPairs.map((pair) => winnerOfPair(quarterfinals, pair, byId))
  if (qfWinners.includes(null)) {
    return { round: 'quarterfinal', label: 'Quarterfinals', ready: null }
  }

  const sfPairs = semifinalMatchups(qfWinners as [BracketTeam, BracketTeam, BracketTeam, BracketTeam])
  const semifinal = byRound('semifinal')
  if (semifinal.length === 0) {
    return {
      round: 'semifinal',
      label: 'Semifinal',
      ready: { description: '', pairs: sfPairs },
    }
  }
  const sfWinners = sfPairs.map((pair) => winnerOfPair(semifinal, pair, byId))
  if (sfWinners.includes(null)) {
    return { round: 'semifinal', label: 'Semifinal', ready: null }
  }

  const finalPair = finalMatchup(sfWinners as Pairing)
  const final = byRound('final')
  if (final.length === 0) {
    return {
      round: 'final',
      label: 'Final',
      ready: { description: '', pairs: [finalPair] },
    }
  }

  return null // Final exists -- nothing left to generate.
}

export function PlayoffBracketGenerator() {
  const { isAdmin } = useAdmin()
  const [seeds, setSeeds] = useState<BracketTeam[] | null>(null)
  const [playoffGames, setPlayoffGames] = useState<Game[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isWorking, setIsWorking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [standings, games] = await Promise.all([getStandings(), getPlayoffGames()])
    setSeeds(
      standings.length === 8
        ? standings.map((s, i) => ({ id: s.teamId, slug: s.teamSlug, name: s.teamName, rank: i + 1 }))
        : null
    )
    setPlayoffGames(games)
    setIsLoading(false)
  }, [])

  useEffect(() => {
    load()
    window.addEventListener('dataUpdated', load)
    return () => window.removeEventListener('dataUpdated', load)
  }, [load])

  if (!isAdmin || isLoading) return null

  if (!seeds) {
    return (
      <div className="mx-auto max-w-6xl px-5 pt-10 sm:px-8">
        <p className="border border-hairline px-5 py-4 text-[13px] text-ink-tertiary">
          The bracket generator needs exactly 8 teams in the standings — it has{' '}
          {playoffGames.length > 0 ? 'a different number' : 'fewer than that'} right now.
        </p>
      </div>
    )
  }

  const stage = nextStage(seeds, playoffGames)
  if (!stage) return null

  const handleGenerate = async (pairs: Pairing[], round: string) => {
    setError(null)
    setIsWorking(true)
    try {
      const today = new Date().toISOString().slice(0, 10)
      for (const [home, away] of pairs) {
        await createGame({
          date: today,
          time: '6:00 PM',
          location: DEFAULT_LOCATION,
          homeTeamId: home.id,
          awayTeamId: away.id,
          isPlayoff: true,
          playoffRound: round,
        })
      }
      notifyDataUpdated()
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to create the games')
    } finally {
      setIsWorking(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pt-10 sm:px-8">
      <div className="rounded-lg border border-hairline-strong bg-surface-sunken px-5 py-4">
        {stage.ready ? (
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[13px] font-semibold text-ink">
                Ready to generate: {stage.label}
              </p>
              <p className="mt-1 text-[13px] text-ink-secondary">
                {stage.ready.pairs.map(([h, a]) => `${h.name} v ${a.name}`).join(' · ')}
                {stage.ready.description && ` — ${stage.ready.description}`}
              </p>
            </div>
            <button
              onClick={() => handleGenerate(stage.ready!.pairs, stage.round)}
              disabled={isWorking}
              className="shrink-0 rounded-pill bg-surface-inverse px-4 py-2 text-[13px] font-medium text-ink-inverse transition-opacity hover:opacity-85 disabled:opacity-50"
            >
              {isWorking ? 'Creating…' : `Generate ${stage.label.toLowerCase()}`}
            </button>
          </div>
        ) : (
          <p className="text-[13px] text-ink-tertiary">
            Waiting on {stage.label.toLowerCase()} results before the next round can be generated.
          </p>
        )}
        {error && <p className="mt-3 text-[13px] text-negative">{error}</p>}
      </div>
    </div>
  )
}
