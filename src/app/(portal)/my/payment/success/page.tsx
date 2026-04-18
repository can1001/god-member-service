'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

function PaymentSuccessContent() {
  const searchParams = useSearchParams()
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentInfo, setPaymentInfo] = useState<{
    orderId: string
    amount: number
    receiptUrl?: string
  } | null>(null)

  useEffect(() => {
    async function confirmPayment() {
      const paymentKey = searchParams.get('paymentKey')
      const orderId = searchParams.get('orderId')
      const amount = searchParams.get('amount')
      const memberId = searchParams.get('memberId')
      const memberFeeId = searchParams.get('memberFeeId')
      const donationId = searchParams.get('donationId')

      if (!paymentKey || !orderId || !amount) {
        setError('결제 정보가 올바르지 않습니다.')
        setIsProcessing(false)
        return
      }

      try {
        const response = await fetch('/api/payment/confirm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentKey,
            orderId,
            amount: parseInt(amount),
            memberId,
            memberFeeId,
            donationId,
          }),
        })

        const result = await response.json()

        if (!result.success) {
          setError(result.error || '결제 승인에 실패했습니다.')
          setIsProcessing(false)
          return
        }

        setPaymentInfo({
          orderId: result.data.orderId,
          amount: result.data.amount,
          receiptUrl: result.data.receiptUrl,
        })
        setIsProcessing(false)
      } catch (err) {
        console.error('결제 승인 오류:', err)
        setError('결제 처리 중 오류가 발생했습니다.')
        setIsProcessing(false)
      }
    }

    confirmPayment()
  }, [searchParams])

  if (isProcessing) {
    return (
      <div className="container mx-auto py-16">
        <Card className="max-w-md mx-auto">
          <CardContent className="pt-8 pb-8">
            <div className="flex flex-col items-center text-center">
              <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
              <p className="text-lg">결제를 처리하고 있습니다...</p>
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
              <h2 className="text-xl font-bold text-red-600 mb-2">결제 처리 실패</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Link href="/my/fees">
                <Button>회비 관리로 돌아가기</Button>
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
          <CardTitle className="text-2xl text-green-600">결제가 완료되었습니다</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentInfo && (
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">주문번호</span>
                <span className="font-medium">{paymentInfo.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">결제금액</span>
                <span className="font-bold text-lg">{paymentInfo.amount.toLocaleString()}원</span>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {paymentInfo?.receiptUrl && (
              <a href={paymentInfo.receiptUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full">
                  영수증 확인
                </Button>
              </a>
            )}
            <Link href="/my/fees">
              <Button className="w-full">회비 관리로 돌아가기</Button>
            </Link>
          </div>
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

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentSuccessContent />
    </Suspense>
  )
}
