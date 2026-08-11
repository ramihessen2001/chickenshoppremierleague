/**
 * League standings page.
 *
 * Standings are an image the admin uploads rather than a computed table. The
 * upload now goes through /api/admin/standings so the storage bucket can stay
 * read-only to the public; it used to upload straight from the browser, which
 * required a bucket that accepted writes from anyone.
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getLeagueConfig, uploadStandingsImage } from '@/lib/supabaseData'
import { Upload, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import { useAdmin } from '@/lib/adminContext'

export function StandingsPageClient() {
  const router = useRouter()
  const { isAdmin } = useAdmin()
  const [standingsImageUrl, setStandingsImageUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getLeagueConfig()
      .then((config) => setStandingsImageUrl(config?.standings_image_url ?? null))
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
      <main className="min-h-screen bg-gradient-to-br from-[#A0CAC9] via-[#A0CAC9] to-[#FFE0AF] py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-black text-xl">Loading standings...</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#A0CAC9] via-[#A0CAC9] to-[#FFE0AF] py-12">
      <div className="max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push('/')}
            className="flex items-center gap-2 text-black hover:text-[#523232] transition-colors"
          >
            <ArrowLeft size={20} />
            <span>Back to Home</span>
          </button>
          
          <h1 className="text-4xl font-extrabold text-black uppercase text-center flex-1">
            League Standings
          </h1>
          
          <div className="w-[120px]"></div> {/* Spacer for centering */}
        </div>

        {/* Admin Upload Section */}
        {isAdmin && (
          <div className="bg-white/90 backdrop-blur-sm border-2 border-[#523232] rounded-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
              <Upload size={24} />
              Admin: Upload Standings Image
            </h2>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={isUploading}
                className="flex-1 text-black file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[#523232] file:text-white hover:file:bg-[#6b4343] file:cursor-pointer disabled:opacity-50"
              />
              {isUploading && (
                <div className="flex items-center gap-2 text-black">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-black"></div>
                  <span>Uploading...</span>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Upload an image of the current league standings (max 5MB, PNG/JPG/WebP)
            </p>
            {error && (
              <p className="mt-3 text-sm text-red-700 font-medium" role="alert">
                {error}
              </p>
            )}
          </div>
        )}

        {/* Standings Display */}
        {standingsImageUrl ? (
          <div className="bg-white/90 backdrop-blur-sm border-2 border-[#523232] rounded-lg p-6">
            <div className="relative w-full">
              <Image
                src={standingsImageUrl}
                alt="League Standings"
                width={1200}
                height={800}
                className="w-full h-auto rounded-lg shadow-lg"
                priority
              />
            </div>
          </div>
        ) : (
          <div className="bg-white/90 backdrop-blur-sm border-2 border-[#523232] rounded-lg p-12 text-center">
            <div className="max-w-md mx-auto">
              <Upload size={64} className="mx-auto mb-4 text-gray-400" />
              <h2 className="text-2xl font-bold text-black mb-2">
                No Standings Available
              </h2>
              <p className="text-gray-600 mb-4">
                The league standings have not been uploaded yet.
              </p>
              {isAdmin && (
                <p className="text-sm text-gray-500">
                  As an admin, you can upload the standings image using the form above.
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  )
}

