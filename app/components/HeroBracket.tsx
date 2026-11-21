/**
 * The playoff bracket shown at the top of the homepage during the playoffs,
 * in place of the headline and commissioner's board.
 *
 * Seeds come from the standings (top 8). Each half (1v8 and 4v5 on the left,
 * 2v7 and 3v6 on the right) feeds its own semifinal and the two meet in the
 * final. Scores fill in from the playoff games as they are played, and winners
 * advance on their own.
 *
 * No dates or kick-off times: those live on the schedule page only, so a
 * rescheduled game is never shown wrong here.
 */

'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { getStandings, getPlayoffGames } from '@/lib/supabaseData'
import { useTeams } from '@/lib/teamsContext'
import { Standing } from '@/types/standing'
import { Game } from '@/types/game'

/** Bracket geometry: every card is vertically centred at a % of the height. */
const HEIGHT = 360
const CARD_H = 84
const QF_TOP = 25
const QF_BOTTOM = 75
const MID = 50

type Round = 'quarterfinal' | 'semifinal' | 'final'

interface Slot {
  seed: number | null
  slug: string | null
}

const TBD: Slot = { seed: null, slug: null }

/** A thin line in the connector columns; stretches with the bracket's height. */
const LINE = {
  stroke: 'var(--rule-heavy)',
  strokeWidth: 1.5,
  vectorEffect: 'non-scaling-stroke',
} as const

/** Joins two cards on one side to the card they feed, `flip` mirroring it. */
function Join({ flip = false }: { flip?: boolean }) {
  const x = (n: number) => (flip ? 100 - n : n)
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        d={`M${x(0)},${QF_TOP} H${x(50)} V${QF_BOTTOM} H${x(0)} M${x(50)},${MID} H${x(100)}`}
        fill="none"
        {...LINE}
      />
    </svg>
  )
}

/** The straight run from a semifinal to the final. */
function Run() {
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path d={`M0,${MID} H100`} fill="none" {...LINE} />
    </svg>
  )
}

export function HeroBracket({ showTitle = true }: { showTitle?: boolean }) {
  const { teamLogo } = useTeams()
  const [seeds, setSeeds] = useState<Standing[]>([])
  const [games, setGames] = useState<Game[]>([])

  useEffect(() => {
    let live = true
    const load = () =>
      Promise.all([getStandings(), getPlayoffGames()]).then(([standings, playoff]) => {
        if (!live) return
        setSeeds(standings.slice(0, 8))
        setGames(playoff)
      })
    load()
    window.addEventListener('dataUpdated', load)
    return () => {
      live = false
      window.removeEventListener('dataUpdated', load)
    }
  }, [])

  const slotFor = (seed: number): Slot => {
    const team = seeds[seed - 1]
    return team ? { seed, slug: team.teamSlug } : { seed, slug: null }
  }

  const seedOf = (slug: string): number | null => {
    const i = seeds.findIndex((s) => s.teamSlug === slug)
    return i === -1 ? null : i + 1
  }

  /** The game of `round` between two clubs, in either home/away order. */
  const gameBetween = (round: Round, a: Slot, b: Slot): Game | null => {
    if (!a.slug || !b.slug) return null
    return (
      games.find(
        (g) =>
          g.playoffRound === round &&
          ((g.homeTeamId === a.slug && g.awayTeamId === b.slug) ||
            (g.homeTeamId === b.slug && g.awayTeamId === a.slug)),
      ) ?? null
    )
  }

  const scoreIn = (game: Game | null, slot: Slot): number | null => {
    if (!game || !slot.slug || game.homeScore === null || game.awayScore === null) return null
    return game.homeTeamId === slot.slug ? game.homeScore : game.awayScore
  }

  /** Whoever won the game between `a` and `b`, or TBD while it is unplayed. */
  const winnerOf = (round: Round, a: Slot, b: Slot): Slot => {
    const game = gameBetween(round, a, b)
    const sa = scoreIn(game, a)
    const sb = scoreIn(game, b)
    if (sa === null || sb === null || sa === sb) return TBD
    const slug = sa > sb ? a.slug : b.slug
    return { seed: slug ? seedOf(slug) : null, slug }
  }

  const teamRow = (slot: Slot, game: Game | null, won: boolean | null, key: string) => {
    const team = slot.slug ? seeds.find((s) => s.teamSlug === slot.slug) : undefined
    const score = scoreIn(game, slot)
    return (
      <div
        key={key}
        className={`flex h-1/2 items-center gap-2 px-2.5 ${
          won === false ? 'text-ink-tertiary' : 'text-ink'
        }`}
      >
        <span className="tabular w-4 shrink-0 text-[12px] text-ink-tertiary">
          {slot.seed ?? ''}
        </span>
        {team ? (
          <Image
            src={teamLogo(team.teamSlug)}
            alt=""
            width={24}
            height={24}
            className="h-6 w-6 shrink-0 object-contain"
          />
        ) : (
          <div className="h-6 w-6 shrink-0 border border-hairline" />
        )}
        <span
          className={`flex-1 text-[13px] leading-tight ${won ? 'font-semibold' : 'font-medium'}`}
        >
          {team?.teamName ?? 'TBD'}
        </span>
        {score !== null && (
          <span className={`tabular text-[15px] ${won ? 'font-semibold' : ''}`}>{score}</span>
        )}
      </div>
    )
  }

  /** One matchup, centred at `top`% of the column. */
  const card = (top: number, round: Round, a: Slot, b: Slot) => {
    const game = gameBetween(round, a, b)
    const sa = scoreIn(game, a)
    const sb = scoreIn(game, b)
    const decided = sa !== null && sb !== null && sa !== sb
    return (
      <div
        key={`${round}-${top}`}
        className="absolute inset-x-0 border border-hairline-strong bg-surface"
        style={{
          top: `${top}%`,
          height: CARD_H,
          transform: 'translateY(-50%)',
        }}
        aria-label={`${round}: ${a.slug ?? 'TBD'} versus ${b.slug ?? 'TBD'}`}
      >
        <div className="flex h-full flex-col divide-y divide-hairline">
          {teamRow(a, game, decided ? sa > sb : null, 'a')}
          {teamRow(b, game, decided ? sb > sa : null, 'b')}
        </div>
      </div>
    )
  }

  const heading = (children: React.ReactNode) => (
    <p className="tabular mb-4 text-center text-[12px] font-medium uppercase tracking-wide text-ink-secondary">
      {children}
    </p>
  )

  // Quarterfinals, by seed.
  const q18 = [slotFor(1), slotFor(8)]
  const q45 = [slotFor(4), slotFor(5)]
  const q27 = [slotFor(2), slotFor(7)]
  const q36 = [slotFor(3), slotFor(6)]

  const sfLeft = [
    winnerOf('quarterfinal', q18[0], q18[1]),
    winnerOf('quarterfinal', q45[0], q45[1]),
  ]
  const sfRight = [
    winnerOf('quarterfinal', q27[0], q27[1]),
    winnerOf('quarterfinal', q36[0], q36[1]),
  ]
  const finalists = [
    winnerOf('semifinal', sfLeft[0], sfLeft[1]),
    winnerOf('semifinal', sfRight[0], sfRight[1]),
  ]

  const col = (children: React.ReactNode) => (
    <div className="relative" style={{ height: HEIGHT }}>
      {children}
    </div>
  )
  const conn = (children: React.ReactNode) => <div style={{ height: HEIGHT }}>{children}</div>

  return (
    <div>
      {showTitle && (
        <div className="mb-10 text-center">
          <h1 className="text-[2.5rem] font-semibold text-ink sm:text-[3.25rem]">CSPL Playoffs</h1>
        </div>
      )}
      <div className="overflow-x-auto pb-2">
        <div
          className="mx-auto grid min-w-[980px] items-start"
          style={{
            gridTemplateColumns:
              'minmax(0,1fr) 36px minmax(0,1fr) 36px minmax(0,1fr) 36px minmax(0,1fr) 36px minmax(0,1fr)',
          }}
        >
          <div>
            {heading('Quarterfinal')}
            {col(
              <>
                {card(QF_TOP, 'quarterfinal', q18[0], q18[1])}
                {card(QF_BOTTOM, 'quarterfinal', q45[0], q45[1])}
              </>,
            )}
          </div>
          <div>
            {heading(' ')}
            {conn(<Join />)}
          </div>
          <div>
            {heading('Semifinal')}
            {col(<>{card(MID, 'semifinal', sfLeft[0], sfLeft[1])}</>)}
          </div>
          <div>
            {heading(' ')}
            {conn(<Run />)}
          </div>
          <div>
            {heading('Final')}
            {col(<>{card(MID, 'final', finalists[0], finalists[1])}</>)}
          </div>
          <div>
            {heading(' ')}
            {conn(<Run />)}
          </div>
          <div>
            {heading('Semifinal')}
            {col(<>{card(MID, 'semifinal', sfRight[0], sfRight[1])}</>)}
          </div>
          <div>
            {heading(' ')}
            {conn(<Join flip />)}
          </div>
          <div>
            {heading('Quarterfinal')}
            {col(
              <>
                {card(QF_TOP, 'quarterfinal', q27[0], q27[1])}
                {card(QF_BOTTOM, 'quarterfinal', q36[0], q36[1])}
              </>,
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
