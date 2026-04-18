'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

interface SocialAuthButtonsProps {
  returnUrl?: string
  className?: string
}

/**
 * 간편인증 버튼들 (카카오/네이버/PASS)
 */
export default function SocialAuthButtons({
  returnUrl = '/my',
  className,
}: SocialAuthButtonsProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const handleSocialAuth = async (provider: 'kakao' | 'naver' | 'pass') => {
    try {
      setIsLoading(provider)

      // 인증 시작 API 호출
      const response = await fetch(
        `/api/auth/${provider}/start?returnUrl=${encodeURIComponent(returnUrl)}`
      )
      const data = await response.json()

      if (!data.success) {
        toast.error(data.error || `${getProviderName(provider)} 인증을 시작할 수 없습니다.`)
        return
      }

      // 인증 페이지로 이동
      window.location.href = data.authUrl
    } catch (error) {
      console.error(`${provider} auth error:`, error)
      toast.error(`${getProviderName(provider)} 인증 중 오류가 발생했습니다.`)
    } finally {
      setIsLoading(null)
    }
  }

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'kakao':
        return '카카오'
      case 'naver':
        return '네이버'
      case 'pass':
        return 'PASS'
      default:
        return provider
    }
  }

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'kakao':
        return 'bg-[#FEE500] hover:bg-[#FEE500]/90 text-black'
      case 'naver':
        return 'bg-[#03C75A] hover:bg-[#03C75A]/90 text-white'
      case 'pass':
        return 'bg-[#FF6B6B] hover:bg-[#FF6B6B]/90 text-white'
      default:
        return 'bg-gray-600 hover:bg-gray-700 text-white'
    }
  }

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">간편인증</span>
        </div>
      </div>

      {/* 카카오 간편인증 */}
      <Button
        onClick={() => handleSocialAuth('kakao')}
        disabled={isLoading !== null}
        className={getProviderColor('kakao')}
        variant="outline"
      >
        {isLoading === 'kakao' ? (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l1.47-3.814c-2.725-1.39-4.363-3.472-4.363-5.73C1.5 6.665 6.201 3 12 3z" />
          </svg>
        )}
        카카오로 인증하기
      </Button>

      {/* 네이버 간편인증 */}
      <Button
        onClick={() => handleSocialAuth('naver')}
        disabled={isLoading !== null}
        className={getProviderColor('naver')}
        variant="outline"
      >
        {isLoading === 'naver' ? (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16.273 12.845 7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727v12.845z" />
          </svg>
        )}
        네이버로 인증하기
      </Button>

      {/* PASS 간편인증 */}
      <Button
        onClick={() => handleSocialAuth('pass')}
        disabled={isLoading !== null}
        className={getProviderColor('pass')}
        variant="outline"
      >
        {isLoading === 'pass' ? (
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : (
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8zm0-12c-2.206 0-4 1.794-4 4s1.794 4 4 4 4-1.794 4-4-1.794-4-4-4z" />
          </svg>
        )}
        PASS로 인증하기
      </Button>
    </div>
  )
}
