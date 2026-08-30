/**
 * The shell every dialog on the site sits in.
 *
 * Shared so behaviour is consistent: escape closes, the backdrop closes, body
 * scroll locks while open, and the panel is labelled for screen readers. Each
 * modal used to reimplement all of that, with small differences in each.
 */

'use client'

import { ReactNode, useEffect, useId } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  /** Hide the title visually but keep it for screen readers. */
  hideTitle?: boolean
  /** Tailwind max-width class for the panel. */
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
  /** Pinned to the bottom of the panel, outside the scrolling area. */
  footer?: ReactNode
}

const SIZES = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
}

export function Modal({
  isOpen,
  onClose,
  title,
  hideTitle,
  size = 'md',
  children,
  footer,
}: ModalProps) {
  const titleId = useId()

  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleEscape)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/25 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        className={`flex max-h-[92vh] w-full ${SIZES[size]} flex-col overflow-hidden rounded-t-lg bg-surface shadow-modal sm:rounded-lg`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between gap-4 border-b border-hairline px-6 py-4">
          <h2
            id={titleId}
            className={
              hideTitle ? 'sr-only' : 'text-[17px] font-semibold text-ink'
            }
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="-mr-1.5 ml-auto rounded-md p-1.5 text-ink-tertiary transition-colors hover:bg-surface-sunken hover:text-ink"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">{children}</div>

        {footer && (
          <footer className="flex shrink-0 items-center justify-end gap-2.5 border-t border-hairline bg-surface-sunken px-6 py-4">
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Shared form controls, so every dialog looks like the same product           */
/* -------------------------------------------------------------------------- */

/*
 * Fields are transparent, so the page's bone shows through and the rule around
 * them is what says "type here". The token file reserves --white as a plane
 * for tables and inputs, but a white box on bone reads as a separate sheet
 * laid over the page, and the site is meant to be one surface.
 *
 * min-h-11 is 44px: the touch target the guide asks for, and taller than the
 * old px-3 py-2 produced.
 */
export const fieldClass =
  'w-full min-h-11 border border-hairline bg-transparent px-[11px] py-[10px] text-[15px] text-ink transition-colors focus:border-[1.5px] focus:border-court focus:outline-none disabled:text-ink-tertiary'

/* Labels are utility type: Courier, small, wide-tracked, upper. They name a
   field rather than saying anything, which is the role that face carries
   everywhere else on the site. */
export const labelClass =
  'block mb-1 font-util text-[10.5px] uppercase tracking-[0.1em] text-ink'

/* Buttons are names of things, so they are upright condensed rather than the
   oblique used for sections. Width is left to the call site: these sit inline
   in dialog footers as often as they run full-bleed under a form. */
export const buttonPrimary =
  'inline-flex items-center justify-center gap-1.5 min-h-11 border-0 bg-black px-4 py-3 font-display text-[13px] font-bold uppercase tracking-[0.06em] text-ink-inverse transition-colors hover:bg-red disabled:bg-surface disabled:text-ink-tertiary disabled:border disabled:border-hairline'

export const buttonSecondary =
  'inline-flex items-center justify-center gap-1.5 min-h-11 border border-hairline-strong bg-transparent px-4 py-3 font-display text-[13px] font-bold uppercase tracking-[0.06em] text-ink transition-colors hover:bg-black hover:text-ink-inverse disabled:bg-surface disabled:text-ink-tertiary'

/** Inline error message shown inside a dialog. */
export function FormError({ children }: { children: ReactNode }) {
  if (!children) return null
  return (
    <p
      className="mb-5 rounded-md border border-hairline bg-negative-wash px-3.5 py-2.5 text-[13px] text-negative"
      role="alert"
    >
      {children}
    </p>
  )
}
