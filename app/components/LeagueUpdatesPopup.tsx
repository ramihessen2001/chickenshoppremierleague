/**
 * The league updates sign-up, shown once to a visitor who has not answered it.
 *
 * Built here rather than in Klaviyo's form editor because a form rendered by
 * them arrives with its own fonts, rounded corners and drop shadow -- all three
 * of which this system deliberately does not have. It posts to Klaviyo through
 * /api/subscribe, so the list still lives there; only the pixels are ours.
 *
 * Not a modal. It does not cover the page, trap focus or dim anything behind
 * it, so it is a labelled region rather than a dialog: someone who ignores it
 * loses nothing. Depth comes from a heavy rule, since the system has no
 * shadows to lift it off the page with.
 */

'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { LEAGUE } from '@/config/league'
import { usePhase } from '@/lib/usePhase'
import { fieldClass, buttonPrimary } from './Modal'

/** Remembers that this visitor has answered, so it is asked once. */
const SEEN_KEY = 'cspl_updates_prompt'

/** Long enough to read the page first. A prompt on arrival is just a toll. */
const DELAY_MS = 9000

type State = 'idle' | 'sending' | 'done' | 'error'

/**
 * localStorage is unavailable in some private-browsing modes and throws rather
 * than returning null, which would take the whole page down from a popup.
 */
function hasAnswered(): boolean {
  try {
    return window.localStorage.getItem(SEEN_KEY) !== null
  } catch {
    return false
  }
}

function remember(): void {
  try {
    window.localStorage.setItem(SEEN_KEY, new Date().toISOString())
  } catch {
    /* Nothing to do -- they will simply be asked again next visit. */
  }
}

export function LeagueUpdatesPopup() {
  const pathname = usePathname()
  const phase = usePhase()
  const [isOpen, setIsOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [state, setState] = useState<State>('idle')

  /*
   * Never while the registration form is on screen. During signups that form
   * is the thing that matters, it already carries its own opt-in, and a card
   * sliding over it would be competing with the one action the page exists
   * for.
   */
  const wouldCompete = phase === 'signups' && pathname === '/'
  const isAdminArea = pathname.startsWith('/draft') || pathname.startsWith('/signups')

  useEffect(() => {
    if (wouldCompete || isAdminArea || hasAnswered()) return
    const timer = setTimeout(() => setIsOpen(true), DELAY_MS)
    return () => clearTimeout(timer)
  }, [wouldCompete, isAdminArea])

  const dismiss = useCallback(() => {
    setIsOpen(false)
    remember()
  }, [])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, dismiss])

  if (!isOpen) return null

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setState('sending')
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!response.ok) throw new Error('rejected')
      setState('done')
      remember()
      // Left up long enough to be read, then it gets out of the way.
      setTimeout(() => setIsOpen(false), 4000)
    } catch {
      setState('error')
    }
  }

  return (
    <section
      aria-label="League updates"
      className="fixed inset-x-0 bottom-0 z-40 border-t-[2.5px] border-hairline-strong bg-surface p-5 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[22rem] sm:border-[2.5px] sm:p-6"
    >
      <button
        onClick={dismiss}
        aria-label="Close"
        className="absolute right-3 top-3 p-1.5 text-ink-tertiary transition-colors hover:bg-ink/[0.06] hover:text-ink"
      >
        <X size={15} />
      </button>

      {state === 'done' ? (
        <div className="pr-6">
          <p className="eyebrow">You&rsquo;re on the list</p>
          <p className="mt-3 font-display text-[22px] font-bold uppercase not-italic leading-tight tracking-[0.01em] text-ink">
            See you at the pitch
          </p>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-secondary">
            The next one lands the morning after matchday.
          </p>
        </div>
      ) : (
        <form onSubmit={submit}>
          <div className="flex items-center gap-2.5 pr-6">
            <Image
              src={LEAGUE.crestUrl}
              alt=""
              width={64}
              height={85}
              className="h-7 w-auto shrink-0 object-contain"
            />
            <p className="eyebrow">League updates</p>
          </div>

          {/* A section name, so it takes the oblique. */}
          <h2 className="mt-3 font-display text-[26px] font-bold uppercase italic leading-[0.95] tracking-[0.01em] text-ink">
            Never miss a matchday
          </h2>

          <p className="mt-2.5 text-[14px] leading-relaxed text-ink-secondary">
            Fixtures, results and team news, the morning after every matchday.
            Nothing else.
          </p>

          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-label="Email address"
            className={`${fieldClass} mt-4`}
          />

          {/* Not shown to people, so anything in it came from a bot. */}
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
            className="hidden"
          />

          {state === 'error' && (
            <p className="mt-2 font-util text-[11px] text-negative">
              That didn&rsquo;t go through. Try again in a moment.
            </p>
          )}

          <button
            type="submit"
            disabled={state === 'sending'}
            className={`${buttonPrimary} mt-3 w-full`}
          >
            {state === 'sending' ? 'Joining…' : 'Join the list'}
          </button>

          <p className="mt-3 font-util text-[10.5px] uppercase leading-relaxed tracking-[0.06em] text-ink-tertiary">
            Unsubscribe from any email. We never pass your address on.
          </p>
        </form>
      )}
    </section>
  )
}
