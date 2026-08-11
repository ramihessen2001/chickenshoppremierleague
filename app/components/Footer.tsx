/**
 * Footer component for YM JAX Soccer League
 * Contains admin button, review button, and copyright information
 */

'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { AdminButton } from './AdminButton'
import { PasswordModal } from './PasswordModal'
import { ReviewModal } from './ReviewModal'
import { useAdmin } from '@/lib/adminContext'

export function Footer() {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  // const [isReviewModalOpen, setIsReviewModalOpen] = useState(false) // Hidden for now
  const { login } = useAdmin()
  
  const handlePasswordSubmit = (password: string): boolean => {
    return login(password)
  }
  
  return (
    <>
      <footer className="w-full py-8 px-4 sm:px-6 mt-12">
        <div className="max-w-7xl mx-auto">
          {/* Gold divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-[#B8860B] to-transparent mb-6" />
          
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
            <div>
              <p>&copy; 2025 YM JAX Soccer League. All rights reserved.</p>
            </div>
            
            {/* Admin button only */}
            <div className="flex items-center gap-3">
              {/* Review button hidden for now */}
              {/* <button
                onClick={() => setIsReviewModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#D47F7D] hover:bg-[#D47F7D]/90 rounded-lg font-semibold transition-colors text-black"
                aria-label="Review the league"
              >
                <Star size={16} />
                Review Us
              </button> */}
              <AdminButton onClick={() => setIsPasswordModalOpen(true)} />
            </div>
          </div>
        </div>
      </footer>
      
      {/* Password Modal */}
      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSuccess={handlePasswordSubmit}
      />
      
      {/* Review Modal - Hidden for now */}
      {/* <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
      /> */}
    </>
  )
}

