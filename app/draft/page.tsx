/**
 * The live draft board. Public to watch, admin to pick.
 */

import type { Metadata } from 'next'
import { DraftBoard } from '@/app/components/DraftBoard'

export const metadata: Metadata = {
  title: 'Draft',
  description: 'The live draft board: picks as they happen.',
}

export default function DraftPage() {
  return <DraftBoard />
}
