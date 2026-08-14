/**
 * Admin-only inbox for the contact form.
 */

'use client'

import Link from 'next/link'
import { useAdmin } from '@/lib/adminContext'
import { QuestionsAdmin } from '@/app/components/QuestionsAdmin'

export default function QuestionsPage() {
  const { isAdmin, isLoading } = useAdmin()

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-[15px] text-ink-tertiary">Loading…</p>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md items-center px-5">
        <div>
          <h1 className="text-[28px] font-semibold text-ink">Admins only</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-secondary">
            Questions include the email address of whoever asked, so this page
            needs an admin session. Sign in from the link at the bottom of any
            page.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-ink-secondary">
            Looking to ask something?{' '}
            <Link
              href="/contact"
              className="text-accent-ink underline underline-offset-2"
            >
              Use the contact form
            </Link>
            .
          </p>
          <Link
            href="/"
            className="mt-6 inline-block text-[14px] font-medium text-accent-ink transition-opacity hover:opacity-70"
          >
            Back to home
          </Link>
        </div>
      </div>
    )
  }

  return <QuestionsAdmin />
}
