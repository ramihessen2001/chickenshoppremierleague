/**
 * The heading block every inner page opens with.
 *
 * Shared so the pages actually match. Previously each page hand-rolled its own
 * title, which is how the schedule ended up rendering two different headings
 * stacked on top of each other.
 */

import { ReactNode } from 'react'

interface PageHeaderProps {
  /** Small label above the title, e.g. "Fall 2026" or "Week 4 of 10". */
  eyebrow?: string
  title: string
  /** One line of supporting copy. */
  description?: string
  /** Actions aligned to the right on wide screens. */
  actions?: ReactNode
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <header className="border-b border-hairline">
      <div className="mx-auto max-w-6xl px-5 pb-10 sm:px-8 sm:pb-12">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="min-w-0">
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <h1 className="mt-3 text-[2.25rem] font-semibold text-ink sm:text-[3rem]">
              {title}
            </h1>
            {description && (
              <p className="mt-4 max-w-xl text-[16px] leading-relaxed text-ink-secondary">
                {description}
              </p>
            )}
          </div>

          {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
        </div>
      </div>
    </header>
  )
}
