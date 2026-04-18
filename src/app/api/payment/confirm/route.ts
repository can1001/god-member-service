import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  confirmPayment,
  toPaymentMethod,
  getCardCompanyName,
  TossPaymentsError,
} from '@/lib/tosspayments'
import { PaymentMethod, PaymentStatus } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { paymentKey, orderId, amount, memberId, memberFeeId, donationId } = body

    // 필수 파라미터 검증
    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        { success: false, error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 토스페이먼츠 결제 승인 요청
    const paymentResult = await confirmPayment({
      paymentKey,
      orderId,
      amount,
    })

    // 결제 수단 변환
    const method = toPaymentMethod(
      paymentResult.method,
      paymentResult.easyPay?.provider
    ) as PaymentMethod

    // 카드 정보 추출
    const cardInfo = paymentResult.card
      ? {
          cardCompany: getCardCompanyName(paymentResult.card.issuerCode),
          cardNumber: paymentResult.card.number,
          cardType: paymentResult.card.cardType,
          installmentPlan: paymentResult.card.installmentPlanMonths,
        }
      : {}

    // DB에 결제 정보 저장 및 연관 데이터 업데이트
    const payment = await prisma.$transaction(async (tx) => {
      // Payment 레코드 생성
      const newPayment = await tx.payment.create({
        data: {
          paymentKey,
          orderId,
          memberId: memberId ? parseInt(memberId) : 0,
          amount: paymentResult.totalAmount,
          method,
          status: PaymentStatus.APPROVED,
          approvedAt: paymentResult.approvedAt ? new Date(paymentResult.approvedAt) : new Date(),
          receiptUrl: paymentResult.receipt?.url,
          memberFeeId: memberFeeId ? parseInt(memberFeeId) : null,
          donationId: donationId ? parseInt(donationId) : null,
          ...cardInfo,
        },
      })

      // 회비 납부인 경우 MemberFee 상태 업데이트
      if (memberFeeId) {
        await tx.memberFee.update({
          where: { id: parseInt(memberFeeId) },
          data: {
            status: 'PAID',
            paidDate: new Date(),
            paymentMethod: method,
          },
        })
      }

      return newPayment
    })

    return NextResponse.json({
      success: true,
      data: {
        paymentKey: payment.paymentKey,
        orderId: payment.orderId,
        amount: payment.amount,
        method: payment.method,
        approvedAt: payment.approvedAt,
        receiptUrl: payment.receiptUrl,
      },
    })
  } catch (error) {
    console.error('결제 승인 오류:', error)

    if (error instanceof TossPaymentsError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: '결제 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
