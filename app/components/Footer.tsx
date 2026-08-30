/**
 * Site footer: a quiet band with the copyright and the admin entry point.
 */

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AdminButton } from './AdminButton'
import { PasswordModal } from './PasswordModal'
import { useAdmin } from '@/lib/adminContext'
import { usePhase } from '@/lib/usePhase'
import { LEAGUE } from '@/config/league'

export function Footer() {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const { login } = useAdmin()
  const phase = usePhase()

  // Mirrors the header: the archive link only appears once this season is
  // under way, matching what the standings and stats pages show.
  const showsArchive = phase === 'season' || phase === 'playoffs'
  const links = [
    ['/', 'Home'],
    ['/schedule', 'Schedule'],
    ['/standings', 'Standings'],
    ['/stats', 'Stats'],
    ...(showsArchive ? [['/archive', 'Archive']] : []),
    ['/contact', 'Questions'],
  ]

  return (
    <>
      <footer className="mt-24 border-t-[2.5px] border-hairline-strong bg-surface">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer">
              {links.map(([href, label]) => (
                <Link
                  key={href}
                  href={href}
                  className="font-util text-[12px] text-ink-secondary transition-colors hover:text-court"
                >
                  {label}
                </Link>
              ))}
            </nav>

            <AdminButton onClick={() => setIsPasswordModalOpen(true)} />
          </div>

          <p className="mt-8 font-util text-[11px] text-ink-tertiary">
            &copy; {new Date().getFullYear()} {LEAGUE.name}
          </p>
        </div>
      </footer>

      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSubmit={login}
      />
    </>
  )
}
