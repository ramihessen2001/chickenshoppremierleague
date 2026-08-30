/**
 * The kit and the sponsor, shown inline on a team page's title line.
 *
 * Both are optional and independent: kit artwork usually lands before the
 * season starts, while sponsorships are sold through it, so a team can have
 * either, both or neither. Each renders only when its own artwork is present,
 * and the component disappears entirely when neither is -- which is why the
 * caller does not need to guard it.
 *
 * Deliberately unboxed: these sit beside the crest and the team name as part
 * of the same masthead, so a card around them would read as a separate panel
 * that happened to be on the same row.
 */

'use client'

import Image from 'next/image'
import { Team } from '@/types/team'

interface TeamIdentityProps {
  team: Team
}

export function TeamIdentity({ team }: TeamIdentityProps) {
  const hasKit = Boolean(team.kitImageUrl)
  const hasSponsor = Boolean(team.sponsorName)

  if (!hasKit && !hasSponsor) return null

  return (
    <div className="flex items-center gap-6 sm:gap-8">
      {hasKit && (
        <Image
          src={team.kitImageUrl!}
          alt={`${team.name} home and away kit`}
          width={640}
          height={392}
          className="h-14 w-auto object-contain sm:h-[72px]"
        />
      )}

      {hasSponsor && (
        <div className="flex min-w-0 items-center gap-3">
          {team.sponsorLogoUrl && (
            /*
              Sponsor marks are wordmarks as often as they are badges, so their
              aspect ratios run from square to roughly 4:1. Constraining the
              height and letting width follow keeps a row of them optically
              even, which fixing the width would not.
            */
            <Image
              src={team.sponsorLogoUrl}
              alt=""
              width={160}
              height={64}
              className="h-9 w-auto max-w-[7.5rem] shrink-0 object-contain sm:h-10"
            />
          )}
          {/*
            The name is the only thing that says this is a sponsor rather than
            more club artwork, so it stays in the accessibility tree at every
            width and merely stops taking horizontal space on small screens.
          */}
          <p className="sr-only text-[11px] font-medium uppercase leading-tight tracking-[0.06em] text-ink-secondary sm:not-sr-only sm:max-w-[9rem]">
            {team.sponsorName}
          </p>
        </div>
      )}
    </div>
  )
}
