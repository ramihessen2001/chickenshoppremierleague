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

export const fieldClass =
  'w-full rounded-md border border-hairline-strong bg-surface px-3 py-2 text-[14px] text-ink transition-colors placeholder:text-ink-tertiary focus:border-ink focus:outline-none disabled:opacity-60'

export const labelClass = 'block text-[13px] font-medium text-ink mb-1.5'

export const buttonPrimary =
  'rounded-pill bg-surface-inverse px-4 py-2 text-[13px] font-medium text-ink-inverse transition-opacity hover:opacity-85 disabled:opacity-50'

export const buttonSecondary =
  'rounded-pill border border-hairline-strong px-4 py-2 text-[13px] font-medium text-ink transition-colors hover:bg-surface-hover disabled:opacity-50'

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
