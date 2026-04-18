'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * 모의 휴대폰 본인인증 컴포넌트
 */
function MockPhoneAuthContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const requestId = searchParams.get('requestId')
  const initialPhone = searchParams.get('phone') || ''
  const returnUrl = searchParams.get('returnUrl') || '/join'
  const service = searchParams.get('service') || 'kginisys'

  // 폼 데이터
  const [formData, setFormData] = useState({
    name: '김철수',
    birthDate: '1990-01-15',
    gender: 'M',
    phone: initialPhone,
  })

  useEffect(() => {
    if (!requestId) {
      setError('잘못된 접근입니다.')
    }
  }, [requestId])

  const handleSubmit = async (success: boolean) => {
    if (!requestId) return

    setLoading(true)
    setError('')

    try {
      // 본인인증 결과를 콜백 API로 전송
      const response = await fetch('/api/auth/phone-verification/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          resultCode: success ? '0000' : '9999',
          resultMessage: success ? '본인인증 성공' : '본인인증 실패',
          name: success ? formData.name : undefined,
          phone: success ? formData.phone : undefined,
          birthDate: success ? formData.birthDate : undefined,
          gender: success ? formData.gender : undefined,
          ci: success ? `CI_${Math.random().toString(36).substr(2, 9)}` : undefined,
          di: success ? `DI_${Math.random().toString(36).substr(2, 9)}` : undefined,
        }),
      })

      const result = await response.json()

      if (result.success) {
        // 성공 시 원래 페이지로 돌아가기
        const params = new URLSearchParams({
          verified: 'true',
          requestId,
          ...(result.data.isExistingMember ? { existing: 'true' } : {}),
        })

        window.location.href = `${returnUrl}?${params.toString()}`
      } else {
        setError(result.error || '본인인증 처리 중 오류가 발생했습니다.')
      }
    } catch (error) {
      console.error('본인인증 처리 오류:', error)
      setError('본인인증 처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (error && !requestId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-500">{error}</p>
            <Button className="mt-4" onClick={() => router.back()}>
              돌아가기
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>휴대폰 본인인증</CardTitle>
          <CardDescription>
            {service === 'danal' ? '다날' : 'KG이니시스'} 본인인증 서비스 (모의)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <div className="text-sm text-red-500 bg-red-50 p-3 rounded">{error}</div>}

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">
              인증할 휴대폰 번호
            </Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="010-1234-5678"
              disabled={!!initialPhone}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">성명</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="실명을 입력하세요"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="birthDate">생년월일</Label>
            <Input
              id="birthDate"
              type="date"
              value={formData.birthDate}
              onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">성별</Label>
            <select
              id="gender"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
            >
              <option value="M">남성</option>
              <option value="F">여성</option>
            </select>
          </div>

          <div className="pt-4 space-y-2">
            <Button
              className="w-full"
              onClick={() => handleSubmit(true)}
              disabled={loading || !formData.name || !formData.phone}
            >
              {loading ? '처리 중...' : '본인인증 완료'}
            </Button>

            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleSubmit(false)}
              disabled={loading}
            >
              인증 실패 테스트
            </Button>

            <Button
              variant="ghost"
              className="w-full"
              onClick={() => router.back()}
              disabled={loading}
            >
              취소
            </Button>
          </div>

          <div className="text-xs text-gray-500 bg-yellow-50 p-3 rounded">
            <strong>테스트 페이지 안내:</strong>
            <br />
            실제 서비스에서는 KG이니시스 또는 다날의 본인인증 페이지로 이동합니다. 이 페이지는 MVP
            테스트를 위한 모의 구현입니다.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * 모의 휴대폰 본인인증 페이지
 *
 * 실제 환경에서는 KG이니시스/다날의 인증 페이지로 이동하지만,
 * MVP 테스트를 위한 모의 구현 페이지
 */
export default function MockPhoneAuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <p>로딩 중...</p>
            </CardContent>
          </Card>
        </div>
      }
    >
      <MockPhoneAuthContent />
    </Suspense>
  )
}
