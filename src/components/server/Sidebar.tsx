'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="hidden lg:flex h-full w-64 flex-col bg-gray-900">
      {/* Logo */}
      <div className="flex h-16 items-center px-6">
        <h1 className="text-xl font-bold text-white">하나님나라연구소</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
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

      {/* Footer */}
      <div className="p-4">
        <div className="text-xs text-gray-400 text-center">회원·회비·후원금 통합 관리 시스템</div>
      </div>
    </div>
  )
}
