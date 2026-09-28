/**
 * Opens the statkeeper login dialog. Mirrors AdminButton -- understated, not a
 * call to action, since it's for whoever is tracking the current game.
 */

'use client'

interface StatkeeperButtonProps {
  onClick: () => void
}

export function StatkeeperButton({ onClick }: StatkeeperButtonProps) {
  return (
    <button
      onClick={onClick}
      className="self-start text-[13px] text-ink-tertiary transition-colors hover:text-ink"
    >
      Statkeeper
    </button>
  )
}
