/**
 * League standings.
 *
 * Standings are an image the admin uploads rather than a computed table. The
 * upload goes through /api/admin/standings so the storage bucket can stay
 * read-only to the public.
 */

'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { Upload } from 'lucide-react'
import { getLeagueConfig, uploadStandingsImage } from '@/lib/supabaseData'
import { useAdmin } from '@/lib/adminContext'
import { PageHeader } from './PageHeader'

export function StandingsPageClient() {
  const { isAdmin } = useAdmin()
  const fileInput = useRef<HTMLInputElement>(null)
  const [standingsImageUrl, setStandingsImageUrl] = useState<string | null>(null)
  const [season, setSeason] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getLeagueConfig()
      .then((config) => {
        setStandingsImageUrl(config?.standings_image_url ?? null)
        setSeason(config?.season ?? null)
      })
      .catch(() => setStandingsImageUrl(null))
      .finally(() => setIsLoading(false))
  }, [])

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target
    const file = input.files?.[0]
    if (!file) return

    setError(null)

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file')
      input.value = ''
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be 5MB or smaller')
      input.value = ''
      return
    }

    setIsUploading(true)
    try {
      setStandingsImageUrl(await uploadStandingsImage(file))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Upload failed')
    } finally {
      setIsUploading(false)
      input.value = ''
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-[15px] text-ink-tertiary">Loading…</p>
      </div>
    )
  }

  return (
    <>
      <PageHeader
        eyebrow={season ?? undefined}
        title="Standings"
        actions={
          isAdmin ? (
            <>
              <input
                ref={fileInput}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileUpload}
                className="sr-only"
              />
              <button
                onClick={() => fileInput.current?.click()}
                disabled={isUploading}
                className="inline-flex items-center gap-1.5 rounded-pill bg-surface-inverse px-4 py-2 text-[13px] font-medium text-ink-inverse transition-opacity hover:opacity-85 disabled:opacity-50"
              >
                <Upload size={15} />
                {isUploading
                  ? 'Uploading…'
                  : standingsImageUrl
                    ? 'Replace image'
                    : 'Upload image'}
              </button>
            </>
          ) : undefined
        }
      />

      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        {error && (
          <p
            className="mb-6 rounded-lg border border-hairline bg-negative-wash px-4 py-3 text-[14px] text-negative"
            role="alert"
          >
            {error}
          </p>
        )}

        {standingsImageUrl ? (
          <div className="overflow-hidden rounded-lg border border-hairline">
            <Image
              src={standingsImageUrl}
              alt="League standings table"
              width={1600}
              height={1000}
              className="h-auto w-full"
              priority
            />
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-hairline-strong px-6 py-20 text-center">
            <p className="text-[17px] font-medium text-ink">No standings yet</p>
            <p className="mx-auto mt-2 max-w-sm text-[15px] text-ink-secondary">
              {isAdmin
                ? 'Upload the current table using the button above.'
                : 'The table will appear here once the season is underway.'}
            </p>
          </div>
        )}
      </div>
    </>
  )
}
