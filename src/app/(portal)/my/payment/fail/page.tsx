'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { XCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

function PaymentFailContent() {
  const searchParams = useSearchParams()
  const code = searchParams.get('code')
  const message = searchParams.get('message')

  const getErrorMessage = () => {
    if (message) return decodeURIComponent(message)

    switch (code) {
      case 'PAY_PROCESS_CANCELED':
        return '결제가 취소되었습니다.'
      case 'PAY_PROCESS_ABORTED':
        return '결제가 중단되었습니다.'
      case 'REJECT_CARD_COMPANY':
        return '카드사에서 결제를 거부했습니다.'
      default:
        return '결제 처리 중 오류가 발생했습니다.'
    }
  }

  return (
    <div className="container mx-auto py-16">
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <XCircle className="h-16 w-16 text-red-500" />
          </div>
          <CardTitle className="text-2xl text-red-600">결제 실패</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg text-center">
            <p className="text-muted-foreground">{getErrorMessage()}</p>
            {code && <p className="text-xs text-muted-foreground mt-2">오류 코드: {code}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Link href="/my/fees">
              <Button className="w-full">회비 관리로 돌아가기</Button>
            </Link>
            <Button variant="outline" onClick={() => window.history.back()}>
              다시 시도하기
            </Button>
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

export default function PaymentFailPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentFailContent />
    </Suspense>
  )
}
