import type { Metadata } from 'next'
import { Inter, Rajdhani } from 'next/font/google'
import './globals.css'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { AdminProvider } from '@/lib/adminContext'
import { TeamsProvider } from '@/lib/teamsContext'
import { AdminBanner } from './components/AdminBanner'
import { LEAGUE } from '@/config/league'

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
})

const rajdhani = Rajdhani({
  variable: '--font-rajdhani',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: LEAGUE.name,
    template: `%s | ${LEAGUE.shortName}`,
  },
  description: LEAGUE.description,
  keywords: LEAGUE.keywords,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${rajdhani.variable} antialiased min-h-screen flex flex-col`}
        style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
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
