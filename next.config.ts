import type { NextConfig } from 'next'

/**
 * Allow next/image to optimise files served from our own Supabase Storage
 * bucket (standings screenshots, and anything else uploaded through the site).
 *
 * The hostname is derived from NEXT_PUBLIC_SUPABASE_URL rather than written out
 * here. It used to be hardcoded, and still pointed at a previous project's
 * hostname long after the database had been replaced -- which silently blocked
 * every uploaded image.
 */
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined

const nextConfig: NextConfig = {
  turbopack: {},

  images: {
    remotePatterns: supabaseHostname
      ? [
          {
            protocol: 'https',
            hostname: supabaseHostname,
            pathname: '/storage/v1/object/public/**',
          },
        ]
      : [],
  },
}

export default nextConfig
