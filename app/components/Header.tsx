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

const BASE_NAV = [
  { href: '/schedule', label: 'Schedule' },
  { href: '/standings', label: 'Standings' },
  { href: '/stats', label: 'Stats' },
]

export function Header() {
  const pathname = usePathname()
  const { isAdmin } = useAdmin()

  // Archive is always linked. It used to be hidden during signups and draft,
  // on the grounds that the standings page was showing last season's table
  // anyway -- but standings now shows this season's teams in every phase, so
  // hiding the link would leave no route to the past season at all.
  const NAV = [...BASE_NAV, { href: '/archive', label: 'Archive' }]

  // Signups and questions both hold contact details, so those links only
  // appear once signed in.
  const nav = isAdmin
    ? [
        ...NAV,
        { href: '/signups', label: 'Signups' },
        // "Inbox", not "Questions": the footer already links the public
        // contact form under that name.
        { href: '/questions', label: 'Inbox' },
      ]
    : NAV

  return (
    <header className="sticky top-0 z-40 bg-surface/80 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-5 sm:px-8">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5"
          aria-label={`${LEAGUE.name} home`}
        >
          {/* The crest is portrait (3:4), so the height is set and the width
              follows. The league name sits beside it, which is why the image
              itself is decorative -- the link is labelled above. */}
          <Image
            src={LEAGUE.crestUrl}
            alt=""
            width={1536}
            height={2048}
            className="h-[30px] w-auto object-contain"
            priority
          />
          <span className="font-display text-[16px] font-bold uppercase tracking-[0.01em] text-ink">
            <span className="hidden sm:inline">{LEAGUE.name}</span>
            <span className="sm:hidden">{LEAGUE.shortName}</span>
          </span>
        </Link>

        {/* min-w-0 lets this shrink inside the flex row instead of pushing
            the row wider than the screen -- the admin-only links (Signups,
            Inbox) are what make this overflow on a phone. Scrollbar hidden
            since a swipe is how this gets scrolled on the touch devices
            narrow enough to need it. */}
        <nav
          className="ml-auto flex min-w-0 items-center gap-1 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Main"
        >
          {nav.map(({ href, label }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`)
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={`shrink-0 whitespace-nowrap px-3 py-1.5 font-display text-[14px] font-bold uppercase tracking-[0.01em] transition-colors ${
                  isActive ? 'text-court' : 'text-ink hover:text-court'
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
