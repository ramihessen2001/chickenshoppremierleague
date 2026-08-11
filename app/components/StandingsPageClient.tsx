/**
 * StandingsPageClient - Client component for viewing league standings
 * Displays admin-uploaded standings image
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Upload, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import { useAdmin } from '@/lib/adminContext'

export function StandingsPageClient() {
  const router = useRouter()
  const { isAdmin } = useAdmin()
  const [standingsImageUrl, setStandingsImageUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)

  // Fetch current standings image URL
  const fetchStandingsImage = async () => {
    try {
      console.log('Fetching standings image...')
      const { data, error } = await supabase
        .from('league_config')
        .select('standings_image_url')
        .limit(1)
        .single()

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }
      
      console.log('Fetched data:', data)
      const imageUrl = data?.standings_image_url || null
      console.log('Image URL:', imageUrl)
      setStandingsImageUrl(imageUrl)
    } catch (error) {
      console.error('Error fetching standings image:', error)
      setStandingsImageUrl(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStandingsImage()
  }, [])

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    try {
      setIsUploading(true)

      // Generate unique filename
      const timestamp = Date.now()
      const fileExt = file.name.split('.').pop()
      const fileName = `standings_${timestamp}.${fileExt}`

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('league-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Storage upload error:', uploadError)
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('league-images')
        .getPublicUrl(fileName)

      console.log('Generated public URL:', publicUrl)

      // Update league config with new image URL (get first record since there's only one)
      const { data: configData, error: selectError } = await supabase
        .from('league_config')
        .select('id')
        .limit(1)
        .single()

      if (selectError) {
        console.error('Error fetching league config:', selectError)
        throw new Error(`Failed to fetch league config: ${selectError.message}`)
      }

      if (!configData) {
        throw new Error('League config not found')
      }

      console.log('Updating league config with ID:', configData.id)
      console.log('Setting standings_image_url to:', publicUrl)

      const { data: updateData, error: updateError } = await supabase
        .from('league_config')
        .update({ standings_image_url: publicUrl })
        .eq('id', configData.id)
        .select()

      if (updateError) {
        console.error('Database update error:', updateError)
        throw new Error(`Database update failed: ${updateError.message}`)
      }

      console.log('Update successful, result:', updateData)

      // Update local state
      setStandingsImageUrl(publicUrl)
      alert('Standings image uploaded successfully!')
    } catch (error: any) {
      console.error('Error uploading standings image:', error)
      alert(`Failed to upload standings image: ${error.message || 'Please try again.'}`)
    } finally {
      setIsUploading(false)
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
              Upload an image of the current league standings (max 5MB, PNG/JPG/JPEG)
            </p>
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

