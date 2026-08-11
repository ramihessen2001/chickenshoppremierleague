import type { Metadata } from "next";
import { Inter, Rajdhani } from "next/font/google";
import "./globals.css";
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { AdminProvider } from '@/lib/adminContext'
import { AdminBanner } from './components/AdminBanner'

// Font configurations for league theme
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: 'swap',
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "YM JAX Soccer League - Winter 2025",
  description: "View schedules, rosters, statistics, and game results for the 2025 YM JAX Soccer Winter League",
  keywords: "YM Soccer, JAX Soccer, Youth Soccer, Winter League, Jacksonville Soccer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${rajdhani.variable} antialiased min-h-screen flex flex-col`}
        style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
      >
        <AdminProvider>
          <AdminBanner />
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </AdminProvider>
      </body>
    </html>
  );
}
