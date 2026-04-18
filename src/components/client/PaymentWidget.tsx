'use client'

import { useEffect, useRef, useState } from 'react'
import { loadTossPayments, TossPaymentsWidgets } from '@tosspayments/tosspayments-sdk'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

interface PaymentWidgetProps {
  clientKey: string
  customerKey: string
  orderId: string
  orderName: string
  amount: number
  customerName: string
  customerEmail: string
  memberId: number
  memberFeeId?: number
  donationId?: number
  successUrl: string
  failUrl: string
}

export default function PaymentWidget({
  clientKey,
  customerKey,
  orderId,
  orderName,
  amount,
  customerName,
  customerEmail,
  memberId,
  memberFeeId,
  donationId,
  successUrl,
  failUrl,
}: PaymentWidgetProps) {
  const [widgets, setWidgets] = useState<TossPaymentsWidgets | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const paymentMethodsRef = useRef<HTMLDivElement>(null)
  const agreementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function initWidget() {
      try {
        const tossPayments = await loadTossPayments(clientKey)
        const paymentWidgets = tossPayments.widgets({
          customerKey,
        })

        setWidgets(paymentWidgets)
      } catch (err) {
        console.error('토스페이먼츠 위젯 초기화 오류:', err)
        setError('결제 위젯을 불러오는데 실패했습니다.')
      }
    }

    initWidget()
  }, [clientKey, customerKey])

  useEffect(() => {
    async function renderWidget() {
      if (!widgets || !paymentMethodsRef.current || !agreementRef.current) return

      try {
        // 결제 금액 설정
        await widgets.setAmount({
          currency: 'KRW',
          value: amount,
        })

        // 결제 수단 위젯 렌더링
        await widgets.renderPaymentMethods({
          selector: '#payment-methods',
          variantKey: 'DEFAULT',
        })

        // 약관 동의 위젯 렌더링
        await widgets.renderAgreement({
          selector: '#agreement',
          variantKey: 'AGREEMENT',
        })

        setIsLoading(false)
      } catch (err) {
        console.error('결제 위젯 렌더링 오류:', err)
        setError('결제 위젯을 표시하는데 실패했습니다.')
        setIsLoading(false)
      }
    }

    renderWidget()
  }, [widgets, amount])

  const handlePayment = async () => {
    if (!widgets) return

    setIsProcessing(true)
    setError(null)

    try {
      // 추가 파라미터를 successUrl에 포함
      const params = new URLSearchParams({
        memberId: memberId.toString(),
        ...(memberFeeId && { memberFeeId: memberFeeId.toString() }),
        ...(donationId && { donationId: donationId.toString() }),
      })

      await widgets.requestPayment({
        orderId,
        orderName,
        customerName,
        customerEmail,
        successUrl: `${successUrl}?${params.toString()}`,
        failUrl,
      })
    } catch (err) {
      console.error('결제 요청 오류:', err)
      setError('결제 요청에 실패했습니다.')
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
        <CardTitle className="text-lg">결제 정보</CardTitle>
        <div className="text-sm text-muted-foreground">
          <p>{orderName}</p>
          <p className="text-lg font-bold text-primary mt-1">{amount.toLocaleString()}원</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* 결제 수단 선택 */}
        <div id="payment-methods" ref={paymentMethodsRef} className={isLoading ? 'hidden' : ''} />

        {/* 약관 동의 */}
        <div id="agreement" ref={agreementRef} className={isLoading ? 'hidden' : ''} />

        {/* 결제 버튼 */}
        {!isLoading && (
          <Button onClick={handlePayment} disabled={isProcessing} className="w-full" size="lg">
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                결제 처리 중...
              </>
            ) : (
              `${amount.toLocaleString()}원 결제하기`
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
