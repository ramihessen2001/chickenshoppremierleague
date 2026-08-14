/**
 * Contact: ask the organisers something.
 *
 * A server component around a client form, so the page itself stays static and
 * the metadata below is picked up at build time.
 */

import type { Metadata } from 'next'
import { PageHeader } from '@/app/components/PageHeader'
import { QuestionForm } from '@/app/components/QuestionForm'
import { LEAGUE } from '@/config/league'

export const metadata: Metadata = {
  title: 'Contact',
  description: `Ask the ${LEAGUE.name} organisers about registration, matchdays or anything else.`,
}

export default function ContactPage() {
  return (
    <>
      <PageHeader
        title="Questions"
        description="Ask about registration, matchdays, the fee, or anything else. An organiser will reply by email."
      />

      <div className="mx-auto max-w-2xl px-5 py-12 sm:px-8">
        <QuestionForm />
      </div>
    </>
  )
}
