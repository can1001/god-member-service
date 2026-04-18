import { prisma } from '@/lib/prisma'

/**
 * AI 어시스턴트를 위한 실시간 DB 집계 데이터 생성
 * 시스템 프롬프트에 주입할 한국어 컨텍스트 생성
 */
export async function generateAiContext(): Promise<string> {
  try {
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    // 1. 회원수/구분별 현황
    const memberStats = await prisma.member.groupBy({
      by: ['memberType', 'isActive'],
      _count: true,
      where: {
        isActive: true,
      },
    })

    const totalMembers = memberStats.reduce((sum, stat) => sum + stat._count, 0)
    const membersByType = {
      REGULAR: memberStats.find((s) => s.memberType === 'REGULAR')?._count || 0,
      ASSOCIATE: memberStats.find((s) => s.memberType === 'ASSOCIATE')?._count || 0,
      YOUTH: memberStats.find((s) => s.memberType === 'YOUTH')?._count || 0,
      DONOR: memberStats.find((s) => s.memberType === 'DONOR')?._count || 0,
    }

    // 2. 회비 징수율 (당해 연도)
    const feeStats = await prisma.memberFee.aggregate({
      where: {
        year: currentYear,
      },
      _sum: {
        amount: true,
      },
      _count: true,
    })

    const paidFees = await prisma.memberFee.aggregate({
      where: {
        year: currentYear,
        status: 'PAID',
      },
      _sum: {
        amount: true,
      },
      _count: true,
    })

    const totalFeeAmount = feeStats._sum.amount || 0
    const paidFeeAmount = paidFees._sum.amount || 0
    const feeCollectionRate =
      totalFeeAmount > 0 ? Math.round((paidFeeAmount / totalFeeAmount) * 100) : 0

    // 3. 이번달 후원금
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1)
    const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999)

    const thisMonthDonations = await prisma.donation.aggregate({
      where: {
        date: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      _sum: {
        amount: true,
      },
      _count: true,
    })

    // 4. 미납 현황
    const unpaidFees = await prisma.memberFee.findMany({
      where: {
        status: 'UNPAID',
        year: currentYear,
      },
      include: {
        member: {
          select: {
            name: true,
            memberType: true,
            email: true,
          },
        },
      },
      take: 10, // 상위 10명만
    })

    const totalUnpaidAmount = await prisma.memberFee.aggregate({
      where: {
        status: 'UNPAID',
        year: currentYear,
      },
      _sum: {
        amount: true,
      },
    })

    // 5. 후원금 목적별 분석 (올해)
    const donationsByPurpose = await prisma.donation.groupBy({
      by: ['purpose'],
      _sum: {
        amount: true,
      },
      _count: true,
      where: {
        date: {
          gte: new Date(currentYear, 0, 1),
          lte: new Date(currentYear, 11, 31, 23, 59, 59, 999),
        },
      },
    })

    // 6. 최근 가입 회원 (최근 30일)
    const recentMembers = await prisma.member.count({
      where: {
        joinDate: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
        isActive: true,
      },
    })

    // 컨텍스트 텍스트 생성
    const context = `
## 하나님나라연구소 현황 (${currentYear}년 ${currentMonth}월 기준)

### 회원 현황
- 총 활성 회원수: ${totalMembers}명
  - 정회원: ${membersByType.REGULAR}명
  - 준회원: ${membersByType.ASSOCIATE}명
  - 청소년회원: ${membersByType.YOUTH}명
  - 후원회원: ${membersByType.DONOR}명
- 최근 30일 신규 가입: ${recentMembers}명

### 회비 현황 (${currentYear}년)
- 회비 징수율: ${feeCollectionRate}%
- 총 회비 청구 금액: ${totalFeeAmount.toLocaleString()}원
- 납부 완료 금액: ${paidFeeAmount.toLocaleString()}원
- 미납 건수: ${unpaidFees.length}건
- 미납 총액: ${(totalUnpaidAmount._sum.amount || 0).toLocaleString()}원

### 미납 회원 목록 (상위 10명) - 개인정보 익명화
${unpaidFees
  .map(
    (fee, index) =>
      `- 회원${String.fromCharCode(65 + index)} (${fee.member.memberType}): ${fee.amount.toLocaleString()}원`
  )
  .join('\n')}

### 후원금 현황
- 이번 달 후원금: ${(thisMonthDonations._sum.amount || 0).toLocaleString()}원 (${thisMonthDonations._count}건)

### ${currentYear}년 후원금 목적별 분석
${donationsByPurpose
  .map((d) => {
    const purposeLabel =
      {
        GENERAL: '일반기금',
        SCHOLARSHIP: '장학금',
        OPERATION: '운영비',
        WELFARE: '복지사업',
        PROGRAM: '프로그램',
      }[d.purpose] || d.purpose

    return `- ${purposeLabel}: ${(d._sum.amount || 0).toLocaleString()}원 (${d._count}건)`
  })
  .join('\n')}

위 데이터를 참고하여 회원·회비·후원금 관리에 대한 질문에 정확하고 유용한 답변을 제공해주세요.
`

    return context.trim()
  } catch (error) {
    console.error('Error generating AI context:', error)
    return '현재 데이터베이스 집계 중 오류가 발생했습니다. 기본적인 질문에 대해서만 답변드릴 수 있습니다.'
  }
}
