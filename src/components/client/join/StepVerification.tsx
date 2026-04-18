'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Smartphone, CreditCard, MessageSquare, Shield, Check } from 'lucide-react'
import { toast } from 'sonner'
import { VerificationMethod } from '@prisma/client'

export interface VerificationData {
  method?: VerificationMethod
  isVerified: boolean
  verifiedInfo?: {
    name: string
    birthDate: string
    gender: string
    phone: string
    ci?: string
    di?: string
  }
}

interface StepVerificationProps {
  verificationData: VerificationData
  updateVerificationData: (data: Partial<VerificationData>) => void
}

export function StepVerification({
  verificationData,
  updateVerificationData,
}: StepVerificationProps) {
  const [isLoading, setIsLoading] = useState(false)

  const verificationMethods = [
    {
      id: 'PHONE' as VerificationMethod,
      provider: 'kginisys' as const,
      title: 'KG이니시스 본인인증',
      subtitle: '휴대전화 본인인증',
      icon: Smartphone,
      description: '휴대전화 번호로 본인인증을 진행합니다.',
      recommended: true,
    },
    {
      id: 'PHONE' as VerificationMethod,
      provider: 'danal' as const,
      title: '다날 본인인증',
      subtitle: '휴대전화 본인인증',
      icon: Smartphone,
      description: '다날 서비스를 통한 본인인증을 진행합니다.',
    },
    {
      id: 'KAKAO' as VerificationMethod,
      title: '카카오 간편인증',
      subtitle: '카카오톡 인증',
      icon: MessageSquare,
      description: '카카오톡을 통한 간편인증을 진행합니다.',
    },
    {
      id: 'NAVER' as VerificationMethod,
      title: '네이버 간편인증',
      subtitle: '네이버 아이디 인증',
      icon: Shield,
      description: '네이버 아이디를 통한 간편인증을 진행합니다.',
    },
    {
      id: 'PASS' as VerificationMethod,
      title: 'PASS 간편인증',
      subtitle: 'PASS 앱 인증',
      icon: CreditCard,
      description: 'PASS 앱을 통한 간편인증을 진행합니다.',
    },
  ]

  const handleVerification = async (method: VerificationMethod, provider?: string) => {
    setIsLoading(true)

    try {
      let authUrl: string

      // 휴대폰 본인인증
      if (method === 'PHONE') {
        const requestId = Date.now().toString()

        const response = await fetch('/api/auth/phone-verification/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: provider || 'kginisys',
            requestId,
            returnUrl: '/join?step=verification',
          }),
        })

        const result = await response.json()
        if (!result.success || !result.authUrl) {
          throw new Error(result.error || '본인인증 요청에 실패했습니다.')
        }

        authUrl = result.authUrl
      }
      // 간편인증
      else {
        const response = await fetch(`/api/auth/${method.toLowerCase()}/start`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            returnUrl: '/join?step=verification',
          }),
        })

        const result = await response.json()
        if (!result.success || !result.authUrl) {
          throw new Error(result.error || '간편인증 요청에 실패했습니다.')
        }

        authUrl = result.authUrl
      }

      // 새 창에서 인증 진행
      const popup = window.open(
        authUrl,
        'verification',
        'width=500,height=700,scrollbars=yes,resizable=yes'
      )

      if (!popup) {
        throw new Error('팝업 창이 차단되었습니다. 팝업 차단을 해제해주세요.')
      }

      // 팝업에서 인증 완료 메시지 대기
      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return

        if (event.data.type === 'VERIFICATION_SUCCESS') {
          const { name, birthDate, gender, phone, ci, di } = event.data.data

          updateVerificationData({
            method,
            isVerified: true,
            verifiedInfo: {
              name,
              birthDate,
              gender: gender === 'M' ? 'MALE' : gender === 'F' ? 'FEMALE' : gender,
              phone,
              ci,
              di,
            },
          })

          toast.success('본인인증이 완료되었습니다.')
          popup.close()
          window.removeEventListener('message', messageHandler)
        } else if (event.data.type === 'VERIFICATION_ERROR') {
          toast.error(event.data.message || '본인인증에 실패했습니다.')
          popup.close()
          window.removeEventListener('message', messageHandler)
        }
      }

      window.addEventListener('message', messageHandler)

      // 팝업 닫힘 감지
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed)
          window.removeEventListener('message', messageHandler)
        }
      }, 1000)

      updateVerificationData({ method })
    } catch (error) {
      console.error('인증 오류:', error)
      toast.error(error instanceof Error ? error.message : '인증에 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  if (verificationData.isVerified) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">본인인증 완료</h2>
            <p className="text-sm text-gray-600 mt-2">
              {verificationData.verifiedInfo?.name}님의 본인인증이 완료되었습니다.
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="font-medium">이름</span>
                <span>{verificationData.verifiedInfo?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">생년월일</span>
                <span>{verificationData.verifiedInfo?.birthDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">성별</span>
                <span>
                  {verificationData.verifiedInfo?.gender === 'MALE'
                    ? '남성'
                    : verificationData.verifiedInfo?.gender === 'FEMALE'
                      ? '여성'
                      : verificationData.verifiedInfo?.gender}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">휴대전화</span>
                <span>{verificationData.verifiedInfo?.phone}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">본인인증</h2>
        <p className="text-sm text-gray-600">
          회원가입을 위해 본인인증을 진행해주세요.
          <br />
          인증된 정보는 회원가입 시 자동으로 입력됩니다.
        </p>
      </div>

      <div className="grid gap-3">
        {verificationMethods.map((method, index) => {
          const Icon = method.icon
          const isSelected = verificationData.method === method.id
          const methodKey = `${method.id}-${method.provider || index}`

          return (
            <Card
              key={methodKey}
              className={`cursor-pointer transition-all hover:shadow-md ${
                isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''
              } ${method.recommended ? 'border-blue-200' : ''}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm font-medium">{method.title}</CardTitle>
                      {method.recommended && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                          추천
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{method.subtitle}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 mb-3">{method.description}</p>
                <Button
                  onClick={() => handleVerification(method.id, method.provider)}
                  disabled={isLoading}
                  className="w-full"
                  variant={isSelected ? 'default' : 'outline'}
                >
                  {isLoading && verificationData.method === method.id
                    ? '인증 진행 중...'
                    : '인증하기'}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
