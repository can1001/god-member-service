'use server'

import { prisma } from '@/lib/prisma'
import { generateReceiptNumber } from '@/lib/receipt'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// 후원금 생성 스키마
const createDonationSchema = z.object({
  donorName: z.string().min(1, '후원자명은 필수입니다'),
  donorType: z.enum(['MEMBER', 'INDIVIDUAL', 'CORPORATE']),
  amount: z.number().int().min(1, '금액은 1원 이상이어야 합니다'),
  date: z.date(),
  purpose: z.enum(['GENERAL', 'SCHOLARSHIP', 'OPERATION', 'WELFARE', 'PROGRAM']),
  note: z.string().nullable().optional(),
  memberId: z.number().int().positive().nullable().optional(),
})

// 후원금 수정 스키마
const updateDonationSchema = createDonationSchema.partial().extend({
  id: z.number().int().positive(),
})

type CreateDonationData = z.infer<typeof createDonationSchema>
type UpdateDonationData = Omit<z.infer<typeof updateDonationSchema>, 'id'>

// 후원금 생성
export async function createDonation(data: CreateDonationData) {
  try {
    const result = createDonationSchema.safeParse(data)
    if (!result.success) {
      return { success: false, error: '입력 데이터가 올바르지 않습니다.' }
    }

    // 회원 ID가 제공된 경우 유효성 검증
    if (data.memberId) {
      const member = await prisma.member.findUnique({
        where: { id: data.memberId },
        select: { id: true },
      })
      if (!member) {
        return { success: false, error: '존재하지 않는 회원 ID입니다.' }
      }
    }

    // 영수증 번호 생성
    const receiptNo = await generateReceiptNumber()

    const donation = await prisma.donation.create({
      data: {
        receiptNo,
        donorName: data.donorName,
        donorType: data.donorType,
        amount: data.amount,
        date: data.date,
        purpose: data.purpose,
        note: data.note,
        memberId: data.memberId,
      },
    })

    revalidatePath('/donations')
    return { success: true, data: donation }
  } catch (error) {
    console.error('Error creating donation:', error)
    return { success: false, error: '후원금 등록 중 오류가 발생했습니다.' }
  }
}

// 후원금 수정
export async function updateDonation(donationId: number, data: UpdateDonationData) {
  try {
    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
      select: { id: true },
    })

    if (!donation) {
      return { success: false, error: '후원금 정보를 찾을 수 없습니다.' }
    }

    const result = updateDonationSchema.safeParse({ ...data, id: donationId })
    if (!result.success) {
      return { success: false, error: '입력 데이터가 올바르지 않습니다.' }
    }

    // 회원 ID가 제공된 경우 유효성 검증
    if (data.memberId) {
      const member = await prisma.member.findUnique({
        where: { id: data.memberId },
        select: { id: true },
      })
      if (!member) {
        return { success: false, error: '존재하지 않는 회원 ID입니다.' }
      }
    }

    const updatedDonation = await prisma.donation.update({
      where: { id: donationId },
      data: {
        donorName: data.donorName,
        donorType: data.donorType,
        amount: data.amount,
        date: data.date,
        purpose: data.purpose,
        note: data.note,
        memberId: data.memberId,
      },
    })

    revalidatePath('/donations')
    return { success: true, data: updatedDonation }
  } catch (error) {
    console.error('Error updating donation:', error)
    return { success: false, error: '후원금 수정 중 오류가 발생했습니다.' }
  }
}

// 후원금 삭제
export async function deleteDonation(donationId: number) {
  try {
    const donation = await prisma.donation.findUnique({
      where: { id: donationId },
    })

    if (!donation) {
      return { success: false, error: '후원금 정보를 찾을 수 없습니다.' }
    }

    await prisma.donation.delete({
      where: { id: donationId },
    })

    revalidatePath('/donations')
    return { success: true }
  } catch (error) {
    console.error('Error deleting donation:', error)
    return { success: false, error: '후원금 삭제 중 오류가 발생했습니다.' }
  }
}
