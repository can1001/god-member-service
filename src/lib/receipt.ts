import { prisma } from '@/lib/prisma'

/**
 * 후원금 영수증 번호 자동 채번
 * 형식: DON-YYYYMM-XXXX (예: DON-202503-0001)
 * 월별 시퀀스: 해당 월의 마지막 번호 +1
 */
export async function generateReceiptNumber(): Promise<string> {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const prefix = `DON-${year}${month}-`

  try {
    // 해당 월의 가장 최근 영수증 번호 조회
    const lastDonation = await prisma.donation.findFirst({
      where: {
        receiptNo: {
          startsWith: prefix,
        },
      },
      orderBy: {
        receiptNo: 'desc',
      },
      select: {
        receiptNo: true,
      },
    })

    let nextSequence = 1

    if (lastDonation) {
      // 마지막 번호에서 시퀀스 추출 (DON-202503-0001 → 0001)
      const lastSequence = lastDonation.receiptNo.split('-')[2]
      if (lastSequence) {
        nextSequence = parseInt(lastSequence) + 1
      }
    }

    // 4자리 패딩으로 시퀀스 생성
    const sequenceStr = String(nextSequence).padStart(4, '0')
    return `${prefix}${sequenceStr}`
  } catch (error) {
    console.error('Error generating receipt number:', error)
    // 오류 시 현재 타임스탬프 기반으로 폴백 생성
    const timestamp = now.getTime().toString().slice(-4)
    return `${prefix}${timestamp}`
  }
}
