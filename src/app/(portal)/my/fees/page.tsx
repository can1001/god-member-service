import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { formatAmount, formatDate } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditCard, ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '회비 내역 - 하나님나라연구소',
  description: '회원 회비 납부 내역',
}

async function getMemberFees(memberId: number) {
  const fees = await prisma.memberFee.findMany({
    where: { memberId },
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  })

  // 연도별 그룹화
  const feesByYear = fees.reduce(
    (acc, fee) => {
      const year = fee.year
      if (!acc[year]) {
        acc[year] = []
      }
      acc[year].push(fee)
      return acc
    },
    {} as Record<number, typeof fees>
  )

  // 통계
  const unpaidCount = fees.filter((f) => f.status === 'UNPAID').length
  const paidCount = fees.filter((f) => f.status === 'PAID').length
  const totalUnpaidAmount = fees
    .filter((f) => f.status === 'UNPAID')
    .reduce((sum, f) => sum + f.amount, 0)

  return {
    feesByYear,
    stats: { unpaidCount, paidCount, totalUnpaidAmount },
    memberId,
  }
}

export default async function MyFeesPage() {
  const session = await getSession()

  if (!session || session.role !== 'MEMBER') {
    redirect('/login')
  }

  const { feesByYear, stats, memberId } = await getMemberFees(session.memberId)
  const years = Object.keys(feesByYear)
    .map(Number)
    .sort((a, b) => b - a)

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Link href="/my">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            돌아가기
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">회비 내역</h1>
          <p className="text-gray-500">전체 회비 납부 현황을 확인하세요</p>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-gray-500">납부완료</p>
            <p className="text-2xl font-bold text-green-600">{stats.paidCount}건</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-gray-500">미납</p>
            <p className="text-2xl font-bold text-red-600">{stats.unpaidCount}건</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-gray-500">미납금액</p>
            <p className="text-xl font-bold text-red-600">
              {formatAmount(stats.totalUnpaidAmount)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 연도별 회비 목록 */}
      {years.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            회비 내역이 없습니다.
          </CardContent>
        </Card>
      ) : (
        years.map((year) => (
          <Card key={year}>
            <CardHeader>
              <CardTitle>{year}년</CardTitle>
              <CardDescription>
                {feesByYear[year].length}건 ·{' '}
                {formatAmount(feesByYear[year].reduce((sum, f) => sum + f.amount, 0))}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {feesByYear[year].map((fee) => (
                  <div
                    key={fee.id}
                    className="flex items-center justify-between py-3 border-b last:border-0"
                  >
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">{fee.month ? `${fee.month}월` : '연납'}</p>
                        <p className="text-sm text-gray-500">{getFeeTypeLabel(fee.feeType)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-semibold">{formatAmount(fee.amount)}</p>
                        {fee.paidDate && (
                          <p className="text-xs text-gray-500">{formatDate(fee.paidDate)}</p>
                        )}
                      </div>
                      <Badge variant="outline" className={getStatusBadgeClass(fee.status)}>
                        {getStatusLabel(fee.status)}
                      </Badge>
                      {fee.status === 'UNPAID' && (
                        <Link href={`/my/payment?memberId=${memberId}&feeId=${fee.id}`}>
                          <Button size="sm">
                            <CreditCard className="h-3 w-3 mr-1" />
                            납부
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

function getFeeTypeLabel(type: string) {
  switch (type) {
    case 'MONTHLY':
      return '월납'
    case 'ANNUAL':
      return '연납'
    case 'LIFETIME':
      return '평생'
    default:
      return type
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'PAID':
      return '납부완료'
    case 'UNPAID':
      return '미납'
    case 'EXEMPT':
      return '면제'
    default:
      return status
  }
}

function getStatusBadgeClass(status: string) {
  switch (status) {
    case 'PAID':
      return 'border-green-200 text-green-800 bg-green-50'
    case 'UNPAID':
      return 'border-red-200 text-red-800 bg-red-50'
    case 'EXEMPT':
      return 'border-gray-200 text-gray-800 bg-gray-50'
    default:
      return 'border-gray-200 text-gray-800 bg-gray-50'
  }
}
