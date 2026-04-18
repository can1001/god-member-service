'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, CreditCard, Loader2 } from 'lucide-react'
import Link from 'next/link'

function BillingSuccessContent() {
  const searchParams = useSearchParams()
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cardInfo, setCardInfo] = useState<{
    cardCompany: string
    cardNumber: string
    cardType: string
  } | null>(null)

  useEffect(() => {
    async function issueBillingKey() {
      const authKey = searchParams.get('authKey')
      const memberId = searchParams.get('memberId')
      const customerKey = searchParams.get('customerKey')

      if (!authKey || !memberId || !customerKey) {
        setError('빌링키 발급 정보가 올바르지 않습니다.')
        setIsProcessing(false)
        return
      }

      try {
        const response = await fetch('/api/payment/billing/issue', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            authKey,
            customerKey,
            memberId,
          }),
        })

        const result = await response.json()

        if (!result.success) {
          setError(result.error || '빌링키 발급에 실패했습니다.')
          setIsProcessing(false)
          return
        }

        setCardInfo(result.data)
        setIsProcessing(false)
      } catch (err) {
        console.error('빌링키 발급 오류:', err)
        setError('카드 등록 처리 중 오류가 발생했습니다.')
        setIsProcessing(false)
      }
    }

    issueBillingKey()
  }, [searchParams])

  if (isProcessing) {
    return (
      <div className="container mx-auto py-16">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center text-center">
              <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
              <p className="text-lg">카드를 등록하고 있습니다...</p>
              <p className="text-sm text-muted-foreground mt-2">잠시만 기다려주세요.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-16">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <span className="text-3xl">!</span>
              </div>
              <h2 className="text-xl font-bold text-red-600 mb-2">카드 등록 실패</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Link href="/my/profile">
                <Button>내 정보로 돌아가기</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-16">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-green-600">카드 등록 완료</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cardInfo && (
            <div className="bg-muted p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-3">
                <CreditCard className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">{cardInfo.cardCompany}</p>
                  <p className="text-sm text-muted-foreground">{cardInfo.cardNumber}</p>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {cardInfo.cardType === 'CREDIT' ? '신용카드' : '체크카드'}
              </div>
            </div>
          )}

          <div className="bg-blue-50 p-4 rounded-lg">
            <p className="text-sm text-blue-800">
              등록된 카드로 매월 회비가 자동 결제됩니다.
              <br />
              결제 예정일에 결제가 진행되며, 결제 결과는 이메일로 안내됩니다.
            </p>
          </div>

          <Link href="/members" className="w-full">
            <Button className="w-full">내 정보로 돌아가기</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

function LoadingFallback() {
  return (
    <div className="container mx-auto py-16">
      <Card className="max-w-md mx-auto">
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col items-center text-center">
            <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
            <p className="text-lg">로딩 중...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <BillingSuccessContent />
    </Suspense>
  )
}
