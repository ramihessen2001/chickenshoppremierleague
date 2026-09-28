/**
 * Rules: the code of conduct and match rules every player agrees to by playing.
 */

import type { Metadata } from 'next'
import { PageHeader } from '@/app/components/PageHeader'
import { RulesList } from '@/app/components/RulesList'
import { LEAGUE } from '@/config/league'

export const metadata: Metadata = {
  title: 'Rules',
  description: `Match format and code of conduct for the ${LEAGUE.name}.`,
}

export default function RulesPage() {
  return (
    <>
      <PageHeader
        title="Rules"
        description="Every player is expected to know these before stepping on the field."
      />

      <div className="mx-auto max-w-2xl px-5 py-12 sm:px-8">
        <RulesList />
      </div>
    </>
  )
}
