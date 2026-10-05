/**
 * The media team's content desk. Not linked from the site's navigation and
 * behind its own login (MEDIA_PASSWORD), separate from the admin password.
 */

import type { Metadata } from 'next'
import { ContentDesk } from '@/app/components/ContentDesk'

export const metadata: Metadata = {
  title: 'Content desk',
  robots: { index: false, follow: false },
}

export default function DeskPage() {
  return <ContentDesk />
}
