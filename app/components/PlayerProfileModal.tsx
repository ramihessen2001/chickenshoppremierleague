/**
 * One player, opened from their name on a roster.
 *
 * The identity block is always there -- name, number, position, age, club.
 * Everything below it is the season, which does not exist yet in September, so
 * the card is written to be worth opening with nothing played and to fill in
 * on its own once results are entered. No empty stat grid of zeroes before a
 * ball is kicked: that reads as a bad season rather than no season.
 */

'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Player, displayJersey } from '@/types/player'
import { Team } from '@/types/team'
import { Modal } from './Modal'
import { PlayerHeadshot } from './PlayerHeadshot'
import { getPlayerProfile, PlayerProfile, PlayerAppearance } from '@/lib/supabaseData'
import { positionHeading, positionGroup } from '@/lib/positions'

interface PlayerProfileModalProps {
  player: Player | null
  team: Team | null
  isOpen: boolean
  onClose: () => void
}

/** "Goalkeepers" is the roster heading; one player is a Goalkeeper. */
function positionLabel(position?: string | null): string {
  if (position?.trim()) return position.trim()
  // No position recorded. Say what the roster says rather than inventing one.
  return positionHeading(positionGroup(position))
}

/** 2025-11-08 -> "Sat 8 Nov". Parsed as local, not UTC, or it slips a day. */
function shortDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number)
  if (!year || !month || !day) return iso
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

/** W, D or L from the player's side. Null while the result is unentered. */
function outcome(game: PlayerAppearance): 'W' | 'D' | 'L' | null {
  if (game.teamScore === null || game.opponentScore === null) return null
  if (game.teamScore > game.opponentScore) return 'W'
  if (game.teamScore < game.opponentScore) return 'L'
  return 'D'
}

export function PlayerProfileModal({
  player,
  team,
  isOpen,
  onClose,
}: PlayerProfileModalProps) {
  /*
   * The season is stored with the player it belongs to, and read back only
   * when the two still agree. Clearing it on the way in would mean a setState
   * in the effect body, and would briefly render the previous player's season
   * under this player's name if the fetch resolved late.
   */
  const [loaded, setLoaded] = useState<{
    playerId: string
    profile: PlayerProfile
  } | null>(null)

  useEffect(() => {
    if (!isOpen || !player) return

    let cancelled = false
    const playerId = player.id
    getPlayerProfile(playerId).then((result) => {
      if (!cancelled) setLoaded({ playerId, profile: result })
    })

    return () => {
      cancelled = true
    }
  }, [isOpen, player])

  if (!player) return null

  const profile = loaded?.playerId === player.id ? loaded.profile : null
  const isLoading = profile === null
  const totals = profile?.totals
  const appearances = profile?.appearances ?? []
  const hasPlayed = appearances.length > 0

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={player.name} hideTitle size="md">
      <div className="flex items-start gap-5">
        <PlayerHeadshot name={player.name} headshotUrl={player.headshotUrl} size={96} />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="tabular font-util text-[13px] text-ink-tertiary">
              {displayJersey(player.jerseyNumber)}
            </span>
            {player.isCaptain && (
              <span className="bg-ink px-1.5 py-px font-util text-[10px] font-bold uppercase tracking-[0.1em] text-ink-inverse">
                Captain
              </span>
            )}
            {!player.isActive && (
              <span className="font-util text-[10px] uppercase tracking-[0.1em] text-ink-tertiary">
                Inactive
              </span>
            )}
          </div>

          {/* A player is a thing, not a section, so it stays upright. */}
          <h2 className="mt-1 font-display text-[26px] font-bold uppercase not-italic leading-[1.05] tracking-[0.01em] text-ink">
            {player.name}
          </h2>

          <dl className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-1.5">
            <Fact label="Position" value={positionLabel(player.position)} />
            {player.age != null && <Fact label="Age" value={String(player.age)} />}
            {team && (
              <div>
                <dt className="font-util text-[10px] uppercase tracking-[0.1em] text-ink-tertiary">
                  Club
                </dt>
                <dd className="mt-0.5 flex items-center gap-1.5">
                  {team.logoUrl && (
                    <Image
                      src={team.logoUrl}
                      alt=""
                      width={16}
                      height={16}
                      className="h-4 w-4 object-contain"
                    />
                  )}
                  <span className="font-display text-[14px] font-bold uppercase tracking-[0.01em] text-ink">
                    {team.name}
                  </span>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <div className="mt-7 border-t border-hairline pt-6">
        {isLoading ? (
          <p className="loading">Loading season</p>
        ) : !hasPlayed ? (
          <p className="text-[14px] leading-relaxed text-ink-secondary">
            No games played yet. Goals, assists and appearances show here once
            the season starts and results are entered.
          </p>
        ) : (
          <>
            <h3 className="eyebrow">Season</h3>
            <dl className="mt-4 grid grid-cols-3 gap-x-4 gap-y-5 sm:grid-cols-6">
              <Stat label="Games" value={totals!.gamesPlayed} />
              <Stat label="Goals" value={totals!.goals} />
              <Stat label="Assists" value={totals!.assists} />
              {/* Saves only for the people who make them. On an outfield
                  player a hard zero looks like a failure rather than a role. */}
              {(totals!.saves > 0 || positionGroup(player.position) === 'Goalkeeper') && (
                <Stat label="Saves" value={totals!.saves} />
              )}
              {totals!.playerOfGame > 0 && (
                <Stat label="Player of game" value={totals!.playerOfGame} />
              )}
              {(totals!.yellowCards > 0 || totals!.redCards > 0 || totals!.blueCards > 0) && (
                <Stat
                  label="Cards"
                  value={totals!.yellowCards + totals!.redCards + totals!.blueCards}
                />
              )}
            </dl>

            <h3 className="eyebrow mt-8">Appearances</h3>
            <ul className="mt-3 border-t border-hairline">
              {appearances.map((game) => (
                <li key={game.gameId}>
                  <AppearanceRow game={game} />
                </li>
              ))}
            </ul>
            <p className="mt-3 font-util text-[10.5px] uppercase leading-relaxed tracking-[0.06em] text-ink-tertiary">
              An appearance is a game with a recorded stat or award.
            </p>
          </>
        )}
      </div>
    </Modal>
  )
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-util text-[10px] uppercase tracking-[0.1em] text-ink-tertiary">
        {label}
      </dt>
      <dd className="mt-0.5 font-display text-[14px] font-bold uppercase tracking-[0.01em] text-ink">
        {value}
      </dd>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dd className="tabular font-display text-[28px] font-bold leading-none text-ink">
        {value}
      </dd>
      <dt className="mt-1.5 font-util text-[10px] uppercase leading-tight tracking-[0.1em] text-ink-tertiary">
        {label}
      </dt>
    </div>
  )
}

function AppearanceRow({ game }: { game: PlayerAppearance }) {
  const result = outcome(game)
  // Goals and assists are what a reader looks for; the rest are noted only
  // when they happened, so a quiet game stays a quiet row.
  const contributions = [
    game.goals > 0 && `${game.goals} G`,
    game.assists > 0 && `${game.assists} A`,
    game.saves > 0 && `${game.saves} SV`,
    game.yellowCards > 0 && `${game.yellowCards} YC`,
    game.redCards > 0 && `${game.redCards} RC`,
    game.blueCards > 0 && `${game.blueCards} BC`,
  ].filter(Boolean) as string[]

  return (
    <div className="flex items-center gap-3 border-b border-hairline py-2.5">
      <span className="tabular w-[68px] shrink-0 font-util text-[11px] text-ink-tertiary">
        {shortDate(game.date)}
      </span>

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <span className="font-util text-[10px] uppercase tracking-[0.1em] text-ink-tertiary">
          {game.wasHome ? 'v' : '@'}
        </span>
        {game.opponentLogoUrl && (
          <Image
            src={game.opponentLogoUrl}
            alt=""
            width={16}
            height={16}
            className="h-4 w-4 shrink-0 object-contain"
          />
        )}
        {game.opponentSlug ? (
          <Link
            href={`/teams/${game.opponentSlug}`}
            className="truncate font-display text-[13px] font-bold uppercase tracking-[0.01em] text-ink hover:text-court"
          >
            {game.opponentName}
          </Link>
        ) : (
          <span className="truncate font-display text-[13px] font-bold uppercase tracking-[0.01em] text-ink">
            {game.opponentName}
          </span>
        )}
        {game.isPlayerOfGame && (
          <span
            className="shrink-0 bg-ink px-1.5 py-px font-util text-[9px] font-bold uppercase tracking-[0.1em] text-ink-inverse"
            title="Player of the game"
          >
            POTG
          </span>
        )}
      </div>

      {contributions.length > 0 && (
        <span className="tabular shrink-0 font-util text-[11px] text-ink-secondary">
          {contributions.join(' · ')}
        </span>
      )}

      <span className="tabular w-[62px] shrink-0 text-right font-util text-[11px] text-ink-secondary">
        {game.teamScore === null || game.opponentScore === null ? (
          <span className="text-ink-tertiary">—</span>
        ) : (
          <>
            {result && (
              <span
                className={
                  result === 'W'
                    ? 'text-ink'
                    : result === 'L'
                      ? 'text-ink-tertiary'
                      : 'text-ink-secondary'
                }
              >
                {result}{' '}
              </span>
            )}
            {game.teamScore}&ndash;{game.opponentScore}
          </>
        )}
      </span>
    </div>
  )
}
