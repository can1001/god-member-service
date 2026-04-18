'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// 회비 납부 처리
export async function markFeePaid(feeId: number) {
  try {
    const fee = await prisma.memberFee.findUnique({
      where: { id: feeId },
      select: { status: true },
    })

    if (!fee) {
      return { success: false, error: '회비 정보를 찾을 수 없습니다.' }
    }

    if (fee.status !== 'UNPAID') {
      return { success: false, error: '미납 상태가 아닙니다.' }
    }

    await prisma.memberFee.update({
      where: { id: feeId },
      data: {
        status: 'PAID',
        paidDate: new Date(),
        paymentMethod: 'DIRECT_TRANSFER', // 기본값으로 직접입금 설정
      },
    })

    revalidatePath('/fees')
    return { success: true }
  } catch (error) {
    console.error('Error marking fee as paid:', error)
    return { success: false, error: '납부 처리 중 오류가 발생했습니다.' }
  }
}

// 회비 납부 취소
export async function markFeeUnpaid(feeId: number) {
  try {
    const fee = await prisma.memberFee.findUnique({
      where: { id: feeId },
      select: { status: true },
    })

    if (!fee) {
      return { success: false, error: '회비 정보를 찾을 수 없습니다.' }
    }

    if (fee.status !== 'PAID') {
      return { success: false, error: '납부완료 상태가 아닙니다.' }
    }

    await prisma.memberFee.update({
      where: { id: feeId },
      data: {
        status: 'UNPAID',
        paidDate: null,
        paymentMethod: null,
      },
    })

    revalidatePath('/fees')
    return { success: true }
  } catch (error) {
    console.error('Error marking fee as unpaid:', error)
    return { success: false, error: '납부 취소 중 오류가 발생했습니다.' }
  }
}

// 회비 일괄 납부 처리
const bulkPaySchema = z.object({
  feeIds: z.array(z.number()),
  paymentMethod: z.enum(['CMS', 'DIRECT_TRANSFER']).optional().default('DIRECT_TRANSFER'),
})

export async function bulkMarkFeesPaid(formData: FormData) {
  try {
    const feeIds = formData.getAll('feeIds').map((id) => parseInt(id as string))
    const paymentMethod = (formData.get('paymentMethod') as string) || 'DIRECT_TRANSFER'

    const result = bulkPaySchema.safeParse({ feeIds, paymentMethod })
    if (!result.success) {
      return { success: false, error: '입력 데이터가 올바르지 않습니다.' }
    }

    if (feeIds.length === 0) {
      return { success: false, error: '선택된 항목이 없습니다.' }
    }

    // 선택된 회비들이 모두 UNPAID 상태인지 확인
    const fees = await prisma.memberFee.findMany({
      where: {
        id: { in: feeIds },
        status: 'UNPAID',
      },
    })

    if (fees.length !== feeIds.length) {
      return { success: false, error: '일부 항목이 이미 납부되었거나 찾을 수 없습니다.' }
    }

    // 일괄 납부 처리
    await prisma.memberFee.updateMany({
      where: {
        id: { in: feeIds },
      },
      data: {
        status: 'PAID',
        paidDate: new Date(),
        paymentMethod: paymentMethod as 'CMS' | 'DIRECT_TRANSFER',
      },
    })

    revalidatePath('/fees')
    return {
      success: true,
      data: { processedCount: feeIds.length },
    }
  } catch (error) {
    console.error('Error bulk marking fees as paid:', error)
    return { success: false, error: '일괄 납부 처리 중 오류가 발생했습니다.' }
  }
}

// 회비 일괄 취소 처리
export async function bulkMarkFeesUnpaid(formData: FormData) {
  try {
    const feeIds = formData.getAll('feeIds').map((id) => parseInt(id as string))

    if (feeIds.length === 0) {
      return { success: false, error: '선택된 항목이 없습니다.' }
    }

    // 선택된 회비들이 모두 PAID 상태인지 확인
    const fees = await prisma.memberFee.findMany({
      where: {
        id: { in: feeIds },
        status: 'PAID',
      },
    })

    if (fees.length !== feeIds.length) {
      return { success: false, error: '일부 항목이 이미 미납이거나 찾을 수 없습니다.' }
    }

    // 일괄 취소 처리
    await prisma.memberFee.updateMany({
      where: {
        id: { in: feeIds },
      },
      data: {
        status: 'UNPAID',
        paidDate: null,
        paymentMethod: null,
      },
    })

    revalidatePath('/fees')
    return {
      success: true,
      data: { processedCount: feeIds.length },
    }
  } catch (error) {
    console.error('Error bulk marking fees as unpaid:', error)
    return { success: false, error: '일괄 취소 처리 중 오류가 발생했습니다.' }
  }
}
