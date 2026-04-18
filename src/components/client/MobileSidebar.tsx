'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X, Menu } from 'lucide-react'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Heart,
  MessageCircle,
  FileText,
  FileCheck,
} from 'lucide-react'

const navigation = [
  {
    name: '대시보드',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: '회원 관리',
    href: '/members',
    icon: Users,
  },
  {
    name: '회비 관리',
    href: '/fees',
    icon: CreditCard,
  },
  {
    name: '후원금 관리',
    href: '/donations',
    icon: Heart,
  },
  {
    name: 'AI 어시스턴트',
    href: '/ai',
    icon: MessageCircle,
  },
  {
    name: '문서 보관',
    href: '/documents',
    icon: FileText,
  },
  {
    name: '증명서 발급',
    href: '/certificates',
    icon: FileCheck,
  },
]

interface MobileSidebarProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export function MobileSidebar({ isOpen, setIsOpen }: MobileSidebarProps) {
  const pathname = usePathname()

  // ESC키로 사이드바 닫기
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden' // 백그라운드 스크롤 방지
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, setIsOpen])

  return (
    <>
      {/* 오버레이 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 모바일 사이드바 */}
      <div
        className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out lg:hidden
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      >
        {/* 헤더 */}
        <div className="flex h-16 items-center justify-between px-6">
          <h1 className="text-xl font-bold text-white">하나님나라연구소</h1>
          <button
            onClick={() => setIsOpen(false)}
            className="rounded-md p-2 text-gray-300 hover:bg-gray-700 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* 네비게이션 */}
        <nav className="flex-1 px-4 py-4">
          <ul className="space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)} // 링크 클릭 시 사이드바 닫기
                    className={`
                      flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors
                      ${
                        isActive
                          ? 'bg-gray-700 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }
                    `}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* 푸터 */}
        <div className="p-4">
          <div className="text-xs text-gray-400 text-center">회원·회비·후원금 통합 관리 시스템</div>
        </div>
      </div>
    </>
  )
}

interface MobileMenuButtonProps {
  onClick: () => void
}

export function MobileMenuButton({ onClick }: MobileMenuButtonProps) {
  return (
    <button
      onClick={onClick}
      className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 lg:hidden"
    >
      <Menu className="h-6 w-6" />
    </button>
  )
}
