import type { Metadata } from 'next'
import { IBM_Plex_Sans, IBM_Plex_Sans_Condensed, Courier_Prime } from 'next/font/google'
import './globals.css'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { AdminProvider } from '@/lib/adminContext'
import { TeamsProvider } from '@/lib/teamsContext'
import { AdminBanner } from './components/AdminBanner'
import { LEAGUE } from '@/config/league'

/**
 * Three faces, one job each.
 *
 * Condensed bold for section names, set italic -- the oblique rule is the
 * signature of the PURO system. Plex Sans for reading copy. Courier Prime for
 * every figure and label, which is what makes a results table read as printed
 * matter rather than as a web app.
 *
 * The italic is loaded as a real cut rather than left to the browser to slant
 * synthetically: a faux-oblique condensed face is exactly the tell this
 * system is trying to avoid.
 *
 * `next/font/google` downloads these at build time and serves them from our
 * own origin, so there is no request to Google at runtime and no flash of
 * unstyled text on route change.
 */
const plexCondensed = IBM_Plex_Sans_Condensed({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['600', '700'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const plexSans = IBM_Plex_Sans({
  variable: '--font-text',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
})

const courierPrime = Courier_Prime({
  variable: '--font-util',
  subsets: ['latin'],
  weight: ['400', '700'],
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
      <body
        className={`${plexCondensed.variable} ${plexSans.variable} ${courierPrime.variable} antialiased min-h-screen flex flex-col`}
      >
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
