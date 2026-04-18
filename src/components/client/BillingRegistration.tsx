'use client'

import { useEffect, useState, useRef } from 'react'
import { loadTossPayments } from '@tosspayments/tosspayments-sdk'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, CreditCard } from 'lucide-react'

interface BillingRegistrationProps {
  clientKey: string
  customerKey: string
  memberId: number
  memberName: string
  successUrl: string
  failUrl: string
}

export default function BillingRegistration({
  clientKey,
  customerKey,
  memberId,
  memberName,
  successUrl,
  failUrl,
}: BillingRegistrationProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const widgetRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const billingWidgetRef = useRef<any>(null)

  useEffect(() => {
    async function initBillingWidget() {
      try {
        const tossPayments = await loadTossPayments(clientKey)
        const billingWidget = tossPayments.widgets({
          customerKey,
        })

        billingWidgetRef.current = billingWidget

        // 카드 등록 위젯 렌더링
        await billingWidget.setAmount({
          currency: 'KRW',
          value: 0, // 빌링키 발급은 0원
        })

        await billingWidget.renderPaymentMethods({
          selector: '#billing-widget',
          variantKey: 'BILLING', // 빌링키 발급용 variant
        })

        setIsLoading(false)
      } catch (err) {
        console.error('빌링 위젯 초기화 오류:', err)
        setError('카드 등록 위젯을 불러오는데 실패했습니다.')
        setIsLoading(false)
      }
    }

    initBillingWidget()
  }, [clientKey, customerKey])

  const handleRegister = async () => {
    if (!billingWidgetRef.current) return

    setIsProcessing(true)
    setError(null)

    try {
      const params = new URLSearchParams({
        memberId: memberId.toString(),
        customerKey,
      })

      await billingWidgetRef.current.requestBillingAuth({
        customerName: memberName,
        successUrl: `${successUrl}?${params.toString()}`,
        failUrl,
      })
    } catch (err) {
      console.error('빌링키 등록 요청 오류:', err)
      setError('카드 등록 요청에 실패했습니다.')
      setIsProcessing(false)
    }
  }

  if (error) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p>{error}</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              다시 시도
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          카드 등록 (정기결제)
        </CardTitle>
        <p className="text-sm text-muted-foreground">등록된 카드로 매월 회비가 자동 결제됩니다.</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* 빌링 위젯 */}
        <div id="billing-widget" ref={widgetRef} className={isLoading ? 'hidden' : ''} />

        {/* 등록 버튼 */}
        {!isLoading && (
          <Button onClick={handleRegister} disabled={isProcessing} className="w-full" size="lg">
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                카드 등록 중...
              </>
            ) : (
              '카드 등록하기'
            )}
          </Button>
        )}

        <p className="text-xs text-muted-foreground text-center">
          카드 정보는 토스페이먼츠에서 안전하게 관리됩니다.
        </p>
      </CardContent>
    </Card>
  )
}
