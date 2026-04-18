'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Toaster } from 'sonner'
import { Button } from '@/components/ui/button'
import { logout } from '@/app/actions/auth'
import { Home, CreditCard, Heart, User, LogOut, Menu, X } from 'lucide-react'

const navigation = [
  { name: '홈', href: '/my', icon: Home },
  { name: '회비 내역', href: '/my/fees', icon: CreditCard },
  { name: '후원 내역', href: '/my/donations', icon: Heart },
  { name: '내 정보', href: '/my/profile', icon: User },
]

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center justify-between h-14">
            {/* 로고 */}
            <Link href="/my" className="flex items-center gap-2">
              <span className="font-bold text-gray-900">하나님나라연구소</span>
              <span className="text-xs text-gray-500 hidden sm:inline">회원 포털</span>
            </Link>

            {/* 데스크톱 네비게이션 */}
            <nav className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {item.name}
                  </Link>
                )
              })}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="ml-2 text-gray-500"
              >
                <LogOut className="h-4 w-4 mr-1" />
                로그아웃
              </Button>
            </nav>

            {/* 모바일 메뉴 버튼 */}
            <button
              className="md:hidden p-2 -mr-2 text-gray-600"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* 모바일 네비게이션 */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t">
            <nav className="px-4 py-2 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 w-full"
              >
                <LogOut className="h-5 w-5" />
                로그아웃
              </button>
            </nav>
          </div>
        )}
      </header>

      {/* 메인 컨텐츠 */}
      <main className="max-w-4xl mx-auto px-4 py-6">{children}</main>

      <Toaster position="top-center" richColors />
    </div>
  )
}
