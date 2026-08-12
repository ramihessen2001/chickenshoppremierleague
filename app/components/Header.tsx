/**
 * Site header: a slim sticky bar with the crest, wordmark and navigation.
 *
 * The previous header was a full-width block with the same logo mirrored on
 * both sides and the league name set huge in uppercase, which pushed the actual
 * content below the fold. Navigation lived as three large buttons dumped on the
 * homepage, so it existed on exactly one page. It belongs here.
 */

'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LEAGUE } from '@/config/league'
import { useAdmin } from '@/lib/adminContext'

const NAV = [
  { href: '/schedule', label: 'Schedule' },
  { href: '/standings', label: 'Standings' },
  { href: '/stats', label: 'Stats' },
]

export function Header() {
  const pathname = usePathname()
  const { isAdmin } = useAdmin()

  // Signups hold contact details, so the link only appears once signed in.
  const nav = isAdmin ? [...NAV, { href: '/signups', label: 'Signups' }] : NAV

  return (
    <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-5 sm:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5"
          aria-label={`${LEAGUE.name} home`}
        >
          {/* The wordmark is ~3.2:1, so it gets a wide slot with an explicit
              height. A square box would shrink it to a sliver. */}
          <Image
            src={LEAGUE.wordmarkUrl}
            alt="Puro"
            width={640}
            height={197}
            className="h-[22px] w-auto object-contain"
            priority
          />
          <span className="text-[15px] font-semibold tracking-[-0.01em] text-ink">
            <span className="hidden sm:inline">{LEAGUE.name}</span>
            <span className="sm:hidden">{LEAGUE.shortName}</span>
          </span>
        </Link>

        <nav className="ml-auto flex items-center gap-1" aria-label="Main">
          {nav.map(({ href, label }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`)
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={`rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  isActive
                    ? 'text-ink'
                    : 'text-ink-secondary hover:text-ink'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
