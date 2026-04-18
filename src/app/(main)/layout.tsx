'use client'

import { useState } from 'react'
import Sidebar from '@/components/server/Sidebar'
import { MobileSidebar, MobileMenuButton } from '@/components/client/MobileSidebar'
import DeviceSecurityAlert from '@/components/client/DeviceSecurityAlert'
import { Bell, User } from 'lucide-react'
import { Toaster } from '@/components/ui/sonner'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Mobile Sidebar */}
      <MobileSidebar isOpen={mobileMenuOpen} setIsOpen={setMobileMenuOpen} />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6">
            {/* Mobile menu button + Page Title */}
            <div className="flex items-center space-x-4">
              <MobileMenuButton onClick={() => setMobileMenuOpen(true)} />
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">하나님나라연구소</h2>
            </div>

            {/* Header Actions */}
            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Notifications */}
              <button className="rounded-full p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100">
                <Bell className="h-5 w-5" />
              </button>

              {/* User Profile */}
              <div className="flex items-center space-x-3">
                <div className="text-sm hidden sm:block">
                  <div className="font-medium text-gray-900">관리자</div>
                  <div className="text-gray-500">admin@sbu.or.kr</div>
                </div>
                <button className="rounded-full p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100">
                  <User className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6">{children}</main>
      </div>
      <DeviceSecurityAlert />
      <Toaster />
    </div>
  )
}
