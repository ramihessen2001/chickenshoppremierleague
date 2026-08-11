/**
 * Opens the admin login dialog. Deliberately understated -- it is for one
 * person, not a call to action.
 */

'use client'

interface AdminButtonProps {
  onClick: () => void
}

export function AdminButton({ onClick }: AdminButtonProps) {
  return (
    <button
      onClick={onClick}
      className="self-start text-[13px] text-ink-tertiary transition-colors hover:text-ink"
    >
      Admin
    </button>
  )
}
