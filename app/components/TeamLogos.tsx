/**
 * Team index: crest and name, linking to each team's page.
 *
 * The section always renders, so `#teams` is a reliable anchor and so the
 * pre-draft state says something useful rather than being absent.
 */

'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useTeams } from '@/lib/teamsContext'

interface TeamLogosProps {
  /**
   * Before this season's draft, the teams in the database are still last
   * season's. The section says so rather than presenting them as the current
   * line-up, so nobody registers expecting to join one of them.
   */
  showingLastSeason?: boolean
}

export function TeamLogos({ showingLastSeason = false }: TeamLogosProps) {
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
        {showingLastSeason ? "Last season's teams" : 'Teams'}
      </h2>

      {showingLastSeason && teams.length > 0 && (
        <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-ink-secondary">
          These are last season&rsquo;s teams and results, shown so you can see
          how the league runs. This season&rsquo;s teams are drafted once
          registration closes.
        </p>
      )}

      {isLoading ? (
        <p className="mt-8 text-[15px] text-ink-tertiary">Loading…</p>
      ) : teams.length === 0 ? (
        <div className="mt-8 rounded-lg border border-dashed border-hairline-strong px-6 py-16 text-center">
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
                className="flex items-center gap-3.5 rounded-lg border border-hairline bg-surface p-4 transition-colors hover:bg-surface-hover"
              >
                <Image
                  src={team.logoUrl}
                  alt=""
                  width={36}
                  height={36}
                  className="h-9 w-9 shrink-0 object-contain"
                />
                <span className="truncate text-[15px] font-medium text-ink">
                  {team.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
