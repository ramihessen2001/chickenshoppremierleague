/**
 * Site footer: copyright and the admin login entry point.
 */

'use client'

import { useState } from 'react'
import { AdminButton } from './AdminButton'
import { PasswordModal } from './PasswordModal'
import { useAdmin } from '@/lib/adminContext'
import { LEAGUE } from '@/config/league'

export function Footer() {
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const { login } = useAdmin()

  return (
    <>
      <footer className="w-full py-8 px-4 sm:px-6 mt-12">
        <div className="max-w-7xl mx-auto">
          <div className="h-px bg-gradient-to-r from-transparent via-[#B8860B] to-transparent mb-6" />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-700">
            <p>
              &copy; {new Date().getFullYear()} {LEAGUE.name}. All rights reserved.
            </p>

            <AdminButton onClick={() => setIsPasswordModalOpen(true)} />
          </div>
        </div>
      </footer>

      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        onSubmit={login}
      />
    </>
  )
}
