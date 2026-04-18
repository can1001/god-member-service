'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import {
  generateOrderId,
  cancelPayment as tossCancelPayment,
  executeBillingPayment,
  TossPaymentsError,
} from '@/lib/tosspayments'
import { decrypt } from '@/lib/crypto'
import { PaymentStatus } from '@prisma/client'

// ─────────────────────────────────────────────────────────────
// 결제 주문 생성
// ─────────────────────────────────────────────────────────────

export interface CreatePaymentOrderData {
  memberId: number
  memberFeeId?: number
  donationId?: number
  amount: number
  orderName: string
}

export async function createPaymentOrder(data: CreatePaymentOrderData) {
  try {
    const orderId = generateOrderId('fee')

    // 회원 정보 조회
    const member = await prisma.member.findUnique({
      where: { id: data.memberId },
      select: { name: true, email: true },
    })

    if (!member) {
      return { success: false, error: '회원 정보를 찾을 수 없습니다.' }
    }

    return {
      success: true,
      data: {
        orderId,
        orderName: data.orderName,
        amount: data.amount,
        customerName: member.name,
        customerEmail: member.email,
        memberId: data.memberId,
        memberFeeId: data.memberFeeId,
        donationId: data.donationId,
      },
    }
  } catch (error) {
    console.error('결제 주문 생성 오류:', error)
    return { success: false, error: '결제 주문 생성에 실패했습니다.' }
  }
}

// ─────────────────────────────────────────────────────────────
// 결제 취소
// ─────────────────────────────────────────────────────────────

export async function cancelPayment(
  paymentId: number,
  cancelReason: string,
  cancelAmount?: number
) {
  try {
    // 결제 정보 조회
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { memberFee: true },
    })

    if (!payment) {
      return { success: false, error: '결제 정보를 찾을 수 없습니다.' }
    }

    if (payment.status !== PaymentStatus.APPROVED) {
      return { success: false, error: '취소할 수 없는 결제 상태입니다.' }
    }

    // 토스페이먼츠 취소 요청
    await tossCancelPayment(payment.paymentKey, {
      cancelReason,
      cancelAmount,
    })

    // DB 상태 업데이트
    await prisma.$transaction(async (tx) => {
      // Payment 상태 업데이트
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: cancelAmount ? PaymentStatus.REFUNDED : PaymentStatus.CANCELED,
        },
      })

      // 회비인 경우 MemberFee 상태 복원
      if (payment.memberFeeId) {
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

    revalidatePath('/fees')
    revalidatePath('/members')

    return { success: true }
  } catch (error) {
    console.error('결제 취소 오류:', error)

    if (error instanceof TossPaymentsError) {
      return { success: false, error: error.message }
    }

    return { success: false, error: '결제 취소에 실패했습니다.' }
  }
}

// ─────────────────────────────────────────────────────────────
// 결제 내역 조회
// ─────────────────────────────────────────────────────────────

export async function getPaymentHistory(memberId: number) {
  try {
    const payments = await prisma.payment.findMany({
      where: { memberId },
      include: {
        memberFee: {
          select: { year: true, month: true, feeType: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, data: payments }
  } catch (error) {
    console.error('결제 내역 조회 오류:', error)
    return { success: false, error: '결제 내역 조회에 실패했습니다.' }
  }
}

// ─────────────────────────────────────────────────────────────
// 빌링키 정기결제 실행 (스케줄러용)
// ─────────────────────────────────────────────────────────────

export async function executeBillingPayments(targetDate: Date = new Date()) {
  const results: Array<{
    memberId: number
    memberFeeId: number
    success: boolean
    error?: string
  }> = []

  try {
    // 오늘 결제 대상인 빌링키 회원 조회
    const billingMembers = await prisma.billingKey.findMany({
      where: { isActive: true },
      include: {
        member: {
          include: {
            fees: {
              where: {
                status: 'UNPAID',
                year: targetDate.getFullYear(),
                month: targetDate.getMonth() + 1,
              },
            },
          },
        },
      },
    })

    for (const billing of billingMembers) {
      const unpaidFees = billing.member.fees

      for (const fee of unpaidFees) {
        try {
          const orderId = generateOrderId('billing')
          const decryptedBillingKey = decrypt(billing.billingKey)

          // 빌링키로 결제 실행
          const paymentResult = await executeBillingPayment({
            billingKey: decryptedBillingKey,
            customerKey: billing.customerKey,
            amount: fee.amount,
            orderId,
            orderName: `${fee.year}년 ${fee.month}월 회비`,
            customerName: billing.member.name,
            customerEmail: billing.member.email,
          })

          // 성공 시 DB 업데이트
          await prisma.$transaction(async (tx) => {
            // BillingPayment 기록
            await tx.billingPayment.create({
              data: {
                billingKeyId: billing.id,
                paymentKey: paymentResult.paymentKey,
                orderId,
                amount: fee.amount,
                status: PaymentStatus.APPROVED,
                scheduledDate: targetDate,
                executedAt: new Date(),
                memberFeeId: fee.id,
              },
            })

            // Payment 기록
            await tx.payment.create({
              data: {
                paymentKey: paymentResult.paymentKey,
                orderId,
                memberId: billing.memberId,
                amount: fee.amount,
                method: 'BILLING',
                status: PaymentStatus.APPROVED,
                approvedAt: new Date(),
                memberFeeId: fee.id,
              },
            })

            // MemberFee 상태 업데이트
            await tx.memberFee.update({
              where: { id: fee.id },
              data: {
                status: 'PAID',
                paidDate: new Date(),
                paymentMethod: 'BILLING',
              },
            })
          })

          results.push({
            memberId: billing.memberId,
            memberFeeId: fee.id,
            success: true,
          })
        } catch (error) {
          console.error(`빌링 결제 실패 (회원 ${billing.memberId}):`, error)

          // 실패 기록
          await prisma.billingPayment.create({
            data: {
              billingKeyId: billing.id,
              paymentKey: '',
              orderId: generateOrderId('billing_fail'),
              amount: fee.amount,
              status: PaymentStatus.FAILED,
              scheduledDate: targetDate,
              executedAt: new Date(),
              failureReason: error instanceof Error ? error.message : '알 수 없는 오류',
              memberFeeId: fee.id,
            },
          })

          results.push({
            memberId: billing.memberId,
            memberFeeId: fee.id,
            success: false,
            error: error instanceof Error ? error.message : '결제 실패',
          })
        }
      }
    }

    return { success: true, data: results }
  } catch (error) {
    console.error('빌링 정기결제 실행 오류:', error)
    return { success: false, error: '정기결제 실행에 실패했습니다.' }
  }
}

// ─────────────────────────────────────────────────────────────
// 빌링키 해지
// ─────────────────────────────────────────────────────────────

export async function revokeBillingKey(memberId: number) {
  try {
    const billing = await prisma.billingKey.findUnique({
      where: { memberId },
    })

    if (!billing) {
      return { success: false, error: '빌링키 정보를 찾을 수 없습니다.' }
    }

    // 빌링키 비활성화
    await prisma.billingKey.update({
      where: { memberId },
      data: { isActive: false },
    })

    // 회원 결제 수단 변경
    await prisma.member.update({
      where: { id: memberId },
      data: { paymentMethod: 'DIRECT_TRANSFER' },
    })

    revalidatePath('/members')

    return { success: true }
  } catch (error) {
    console.error('빌링키 해지 오류:', error)
    return { success: false, error: '빌링키 해지에 실패했습니다.' }
  }
}
