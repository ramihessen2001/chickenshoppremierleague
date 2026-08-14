import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { AdminProvider } from '@/lib/adminContext'
import { TeamsProvider } from '@/lib/teamsContext'
import { AdminBanner } from './components/AdminBanner'
import { LEAGUE } from '@/config/league'

/**
 * One typeface, used at every size.
 *
 * The old build paired Inter with Rajdhani -- a condensed geometric face that
 * reads as sports-broadcast graphics, not as the restrained look we want.
 * Inter is the closest widely available stand-in for SF Pro, and its variable
 * axes cover everything from captions to the hero.
 */
const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

/**
 * Absolute URLs for the share card. Without this Next cannot turn
 * `opengraph-image` into the absolute URL that chat apps require, and previews
 * silently fall back to a bare link.
 */
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: LEAGUE.name,
    template: `%s | ${LEAGUE.shortName}`,
  },
  description: LEAGUE.description,
  keywords: LEAGUE.keywords,
  openGraph: {
    type: 'website',
    siteName: LEAGUE.name,
    title: LEAGUE.name,
    description: LEAGUE.description,
    url: siteUrl,
  },
  twitter: {
    card: 'summary_large_image',
    title: LEAGUE.name,
    description: LEAGUE.description,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased min-h-screen flex flex-col`}>
        <AdminProvider>
          <TeamsProvider>
            <AdminBanner />
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </TeamsProvider>
        </AdminProvider>
      </body>
    </html>
  )
}
