import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { ServiceWorkerProvider } from '@/components/client/ServiceWorkerProvider'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#1f2937',
}

export const metadata: Metadata = {
  title: '하나님나라연구소 - 회원관리시스템',
  description: '하나님나라연구소 회원·회비·후원금 통합 관리 시스템',
  keywords: ['하나님나라연구소', '회원관리', '회비관리', '후원금관리'],
  authors: [{ name: '하나님나라연구소' }],
  creator: '하나님나라연구소',
  publisher: '하나님나라연구소',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: '하나님나라연구소',
  },
  applicationName: '하나님나라연구소',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/next.svg',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ServiceWorkerProvider />
        {children}
      </body>
    </html>
  )
}
