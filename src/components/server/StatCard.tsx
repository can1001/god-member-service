import { ReactNode } from 'react'
import { prisma } from '@/lib/prisma'

interface StatCardProps {
  title: string
  icon: ReactNode
  iconBgColor: string
  type: 'members' | 'fee-rate' | 'donations' | 'unpaid'
}

export async function StatCard({ title, icon, iconBgColor, type }: StatCardProps) {
  const data = await getStatData(type)

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-gray-500">{title}</div>
        <div className={`w-8 h-8 ${iconBgColor} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <div className="mt-3">{data}</div>
    </div>
  )
}

async function getStatData(type: 'members' | 'fee-rate' | 'donations' | 'unpaid') {
  try {
    switch (type) {
      case 'members':
        const memberCounts = await prisma.member.groupBy({
          by: ['memberType'],
          where: { isActive: true },
          _count: { id: true },
        })

        const totalMembers = memberCounts.reduce((sum, group) => sum + group._count.id, 0)
        const regularCount = memberCounts.find((g) => g.memberType === 'REGULAR')?._count.id || 0
        const associateCount =
          memberCounts.find((g) => g.memberType === 'ASSOCIATE')?._count.id || 0
        const youthCount = memberCounts.find((g) => g.memberType === 'YOUTH')?._count.id || 0
        const donorCount = memberCounts.find((g) => g.memberType === 'DONOR')?._count.id || 0

        return (
          <>
            <div className="text-3xl font-bold text-gray-900">{totalMembers.toLocaleString()}</div>
            <div className="text-sm text-gray-600">
              정회원 {regularCount}, 준회원 {associateCount}, 청소년 {youthCount}, 후원 {donorCount}
            </div>
          </>
        )

      case 'fee-rate':
        const currentYear = new Date().getFullYear()

        // 올해 전체 청구 금액 (YOUTH, DONOR 제외)
        const totalBilled = await prisma.memberFee.aggregate({
          where: {
            year: currentYear,
            member: {
              isActive: true,
              memberType: { notIn: ['YOUTH', 'DONOR'] },
            },
          },
          _sum: { amount: true },
        })

        // 올해 납부 완료 금액
        const totalPaid = await prisma.memberFee.aggregate({
          where: {
            year: currentYear,
            status: 'PAID',
            member: {
              isActive: true,
              memberType: { notIn: ['YOUTH', 'DONOR'] },
            },
          },
          _sum: { amount: true },
        })

        const billedAmount = totalBilled._sum.amount || 0
        const paidAmount = totalPaid._sum.amount || 0
        const rate = billedAmount > 0 ? Math.round((paidAmount / billedAmount) * 100) : 0

        return (
          <>
            <div className="text-3xl font-bold text-gray-900">{rate}%</div>
            <div className="text-sm text-gray-600">이번 연도 기준</div>
          </>
        )

      case 'donations':
        const currentMonth = new Date().getMonth() + 1
        const currentYear2 = new Date().getFullYear()

        const monthlyDonations = await prisma.donation.aggregate({
          where: {
            date: {
              gte: new Date(currentYear2, currentMonth - 1, 1),
              lt: new Date(currentYear2, currentMonth, 1),
            },
          },
          _sum: { amount: true },
        })

        const donationAmount = monthlyDonations._sum.amount || 0

        // 전월 후원금 계산 (전월 대비 표시용)
        const prevMonthStart =
          currentMonth === 1
            ? new Date(currentYear2 - 1, 11, 1)
            : new Date(currentYear2, currentMonth - 2, 1)
        const prevMonthEnd =
          currentMonth === 1
            ? new Date(currentYear2, 0, 1)
            : new Date(currentYear2, currentMonth - 1, 1)

        const prevMonthDonations = await prisma.donation.aggregate({
          where: {
            date: {
              gte: prevMonthStart,
              lt: prevMonthEnd,
            },
          },
          _sum: { amount: true },
        })

        const prevAmount = prevMonthDonations._sum.amount || 0
        const change =
          prevAmount > 0 ? Math.round(((donationAmount - prevAmount) / prevAmount) * 100) : 0
        const changeText = change > 0 ? `+${change}%` : change < 0 ? `${change}%` : '0%'

        return (
          <>
            <div className="text-3xl font-bold text-gray-900">
              {donationAmount.toLocaleString()} 원
            </div>
            <div className="text-sm text-gray-600">전월 대비 {changeText}</div>
          </>
        )

      case 'unpaid':
        const unpaidFees = await prisma.memberFee.findMany({
          where: {
            status: 'UNPAID',
            member: { isActive: true },
          },
          select: { amount: true },
        })

        const unpaidCount = unpaidFees.length
        const unpaidAmount = unpaidFees.reduce((sum, fee) => sum + fee.amount, 0)

        return (
          <>
            <div className="text-3xl font-bold text-gray-900">{unpaidCount} 건</div>
            <div className="text-sm text-gray-600">
              미납 금액 {unpaidAmount.toLocaleString()} 원
            </div>
          </>
        )

      default:
        return (
          <>
            <div className="text-3xl font-bold text-gray-900">--</div>
            <div className="text-sm text-gray-600">데이터 없음</div>
          </>
        )
    }
  } catch (error) {
    console.error(`StatCard error (${type}):`, error)
    return (
      <>
        <div className="text-3xl font-bold text-gray-900">--</div>
        <div className="text-sm text-gray-600">오류 발생</div>
      </>
    )
  }
}
