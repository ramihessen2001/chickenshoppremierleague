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
  playInMatchups,
  quarterfinalMatchups,
  semifinalMatchup,
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

/** Works out what the next generator action is, or null once the bracket is complete. */
function nextStage(seeds: BracketTeam[], playoffGames: Game[]): Stage | null {
  const byId = new Map(seeds.map((s) => [s.id, s]))
  const byRound = (round: string) => playoffGames.filter((g) => g.playoffRound === round)

  const playIn = byRound('play-in')
  if (playIn.length === 0) {
    const pairs = playInMatchups(seeds)
    return {
      round: 'play-in',
      label: 'Play-in',
      ready: { description: '5th and 8th, 6th and 7th.', pairs },
    }
  }
  const playInWinners = playIn.map((g) => winnerOf(g, byId))
  if (playInWinners.includes(null)) {
    return { round: 'play-in', label: 'Play-in', ready: null }
  }

  const quarterfinals = byRound('quarterfinal')
  if (quarterfinals.length === 0) {
    const pairs = quarterfinalMatchups(seeds, playInWinners as Pairing)
    return {
      round: 'quarterfinal',
      label: 'Quarterfinals',
      ready: {
        description: '1st and 2nd draw the play-in winners; 3rd plays 4th.',
        pairs,
      },
    }
  }
  const qfWinners = quarterfinals.map((g) => winnerOf(g, byId))
  if (qfWinners.includes(null)) {
    return { round: 'quarterfinal', label: 'Quarterfinals', ready: null }
  }

  const semifinal = byRound('semifinal')
  if (semifinal.length === 0) {
    const { game, bye } = semifinalMatchup(qfWinners as BracketTeam[])
    return {
      round: 'semifinal',
      label: 'Semifinal',
      ready: {
        description: `${bye.name} has the bye straight to the final.`,
        pairs: [game],
      },
    }
  }
  const semifinalWinner = winnerOf(semifinal[0], byId)
  if (!semifinalWinner) {
    return { round: 'semifinal', label: 'Semifinal', ready: null }
  }

  const final = byRound('final')
  if (final.length === 0) {
    const semifinalists = new Set([semifinal[0].homeTeamUUID, semifinal[0].awayTeamUUID])
    const byeTeam = (qfWinners as BracketTeam[]).find((w) => !semifinalists.has(w.id))
    if (!byeTeam) return null // Shouldn't happen -- the bracket already has a bye recorded above.
    return {
      round: 'final',
      label: 'Final',
      ready: { description: '', pairs: [[byeTeam, semifinalWinner]] },
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
