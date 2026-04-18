import { prisma } from '@/lib/prisma'
import { MonthlyTrendChart } from '@/components/client/Charts'

interface MonthlyData {
  month: string
  fees: number
  donations: number
}

async function getMonthlyTrend(): Promise<MonthlyData[]> {
  const currentYear = new Date().getFullYear()

  // 월별 회비 데이터 (PAID 상태만) - raw query 사용
  const monthlyFees = await prisma.$queryRaw<
    Array<{
      month: number
      total: bigint
    }>
  >`
    SELECT
      month,
      SUM(amount) as total
    FROM "MemberFee"
    WHERE year = ${currentYear}
      AND status = 'PAID'
      AND month IS NOT NULL
    GROUP BY month
    ORDER BY month
  `

  // 월별 후원금 집계
  const monthlyDonations = await prisma.$queryRaw<
    Array<{
      month: number
      total: bigint
    }>
  >`
    SELECT
      EXTRACT(MONTH FROM date) as month,
      SUM(amount) as total
    FROM "Donation"
    WHERE EXTRACT(YEAR FROM date) = ${currentYear}
    GROUP BY EXTRACT(MONTH FROM date)
    ORDER BY month
  `

  // 1월부터 12월까지 데이터 생성
  const months = [
    '1월',
    '2월',
    '3월',
    '4월',
    '5월',
    '6월',
    '7월',
    '8월',
    '9월',
    '10월',
    '11월',
    '12월',
  ]

  const chartData: MonthlyData[] = months.map((monthName, index) => {
    const monthNum = index + 1

    // 해당 월의 회비 합계
    const monthlyFeeSum = monthlyFees.find((item) => item.month === monthNum)?.total || BigInt(0)

    // 해당 월의 후원금 합계
    const monthlyDonationSum =
      monthlyDonations.find((item) => item.month === monthNum)?.total || BigInt(0)

    return {
      month: monthName,
      fees: Number(monthlyFeeSum),
      donations: Number(monthlyDonationSum),
    }
  })

  return chartData
}

export async function MonthlyTrend() {
  const data = await getMonthlyTrend()
  const currentYear = new Date().getFullYear()

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">
        월별 회비/후원금 추이 ({currentYear}년)
      </h2>
      <div className="relative">
        <MonthlyTrendChart data={data} />
      </div>
      {/* 범례 */}
      <div className="flex justify-center space-x-6 mt-4">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded"></div>
          <span className="ml-2 text-sm text-gray-600">회비</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-orange-500 rounded"></div>
          <span className="ml-2 text-sm text-gray-600">후원금</span>
        </div>
      </div>
    </div>
  )
}
