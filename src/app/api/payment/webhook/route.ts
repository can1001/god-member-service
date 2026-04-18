import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { PaymentStatus } from '@prisma/client'

// 토스페이먼츠 웹훅 이벤트 타입
type WebhookEventType =
  | 'PAYMENT_STATUS_CHANGED'
  | 'DEPOSIT_CALLBACK'
  | 'PAYOUT_STATUS_CHANGED'
  | 'CARD_APPROVED'

interface WebhookPayload {
  eventType: WebhookEventType
  createdAt: string
  data: {
    paymentKey?: string
    orderId?: string
    transactionKey?: string
    status?: string
    approvedAt?: string
    cancelledAt?: string
    cancels?: Array<{
      cancelReason: string
      canceledAt: string
      cancelAmount: number
    }>
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload: WebhookPayload = await request.json()

    // 웹훅 로그 저장
    await prisma.paymentWebhookLog.create({
      data: {
        eventType: payload.eventType,
        paymentKey: payload.data.paymentKey,
        orderId: payload.data.orderId,
        payload: payload as object,
      },
    })

    // 이벤트 타입별 처리
    switch (payload.eventType) {
      case 'PAYMENT_STATUS_CHANGED':
        await handlePaymentStatusChanged(payload.data)
        break

      case 'CARD_APPROVED':
        // 카드 승인 완료 - 필요시 추가 처리
        break

      default:
        // eslint-disable-next-line no-console
        console.log(`처리되지 않은 웹훅 이벤트: ${payload.eventType}`)
    }

    // 웹훅 처리 완료 표시
    await prisma.paymentWebhookLog.updateMany({
      where: { paymentKey: payload.data.paymentKey },
      data: { isProcessed: true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('웹훅 처리 오류:', error)

    // 오류 로그 저장
    try {
      const rawBody = await request.text()
      await prisma.paymentWebhookLog.create({
        data: {
          eventType: 'ERROR',
          payload: { error: String(error), rawBody },
          errorMessage: error instanceof Error ? error.message : '알 수 없는 오류',
        },
      })
    } catch {
      // 로그 저장 실패는 무시
    }

    return NextResponse.json({ success: false, error: '웹훅 처리 실패' }, { status: 500 })
  }
}

async function handlePaymentStatusChanged(data: WebhookPayload['data']) {
  const { paymentKey, status } = data

  if (!paymentKey) return

  // DB에서 해당 결제 조회
  const payment = await prisma.payment.findUnique({
    where: { paymentKey },
  })

  if (!payment) {
    // eslint-disable-next-line no-console
    console.log(`결제 정보를 찾을 수 없음: ${paymentKey}`)
    return
  }

  // 상태 매핑
  let newStatus: PaymentStatus
  switch (status) {
    case 'DONE':
      newStatus = PaymentStatus.APPROVED
      break
    case 'CANCELED':
      newStatus = PaymentStatus.CANCELED
      break
    case 'PARTIAL_CANCELED':
      newStatus = PaymentStatus.REFUNDED
      break
    case 'ABORTED':
    case 'EXPIRED':
      newStatus = PaymentStatus.FAILED
      break
    default:
      return // 처리하지 않는 상태
  }

  // 상태 업데이트
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { paymentKey },
      data: { status: newStatus },
    })

    // 취소/환불된 경우 회비 상태도 업데이트
    if (
      (newStatus === PaymentStatus.CANCELED || newStatus === PaymentStatus.REFUNDED) &&
      payment.memberFeeId
    ) {
      await tx.memberFee.update({
        where: { id: payment.memberFeeId },
        data: {
          status: 'UNPAID',
          paidDate: null,
          paymentMethod: null,
        },
      })
    }
  })
}
