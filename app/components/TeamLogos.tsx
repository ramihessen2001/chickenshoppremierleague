/**
 * Team index: crest and name, linking to each team's page.
 *
 * The section always renders, so `#teams` is a reliable anchor and so the
 * pre-draft state says something useful rather than being absent.
 *
 * This used to take a `showingLastSeason` flag, because the league only
 * replaced its teams at the draft and registration therefore ran against the
 * previous season's line-up. Teams are now swapped in before registration
 * opens, so whatever is in the table is the current season's and the caveat
 * the flag printed would be untrue.
 */

'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTeams } from '@/lib/teamsContext'

export function TeamLogos() {
  const { teams, isLoading } = useTeams()

  return (
    <section
      id="teams"
      className="mx-auto max-w-6xl scroll-mt-20 px-5 py-16 sm:px-8"
      aria-labelledby="teams-heading"
    >
      <h2
        id="teams-heading"
        className="text-[28px] font-semibold text-ink sm:text-[32px]"
      >
        Teams
      </h2>

      {isLoading ? (
        <p className="mt-8 text-[15px] text-ink-tertiary">Loading…</p>
      ) : teams.length === 0 ? (
        <div className="mt-8 border border-hairline px-6 py-10 text-left">
          <p className="text-[17px] font-medium text-ink">Coming soon</p>
          <p className="mx-auto mt-2 max-w-sm text-[15px] leading-relaxed text-ink-secondary">
            Teams are announced after the draft.
          </p>
        </div>
      ) : (
        <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {teams.map((team) => (
            <li key={team.slug}>
              <Link
                href={`/teams/${team.slug}`}
                className="flex items-center gap-3.5 border border-hairline p-3 transition-colors hover:bg-ink/[0.04]"
              >
                <Image
                  src={team.logoUrl}
                  alt=""
                  width={36}
                  height={36}
                  className="h-9 w-9 shrink-0 object-contain"
                />
                {/* title carries the full name, since the short one is what a
                    tile has room for. */}
                <span
                  className="truncate font-display text-[17px] font-bold uppercase leading-tight tracking-[0.01em] text-ink"
                  title={team.name}
                >
                  {team.shortName}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
