/**
 * Last season, read-only.
 */

import type { Metadata } from 'next'
import { ArchivePageClient } from '@/app/components/ArchivePageClient'

export const metadata: Metadata = {
  title: 'Archive',
  description: "Last season's final standings, results and stat leaders.",
}

export default function ArchivePage() {
  return <ArchivePageClient />
}
