import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { formatAmount, formatDate } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, FileText } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '후원 내역 - 하나님나라연구소',
  description: '회원 후원 내역',
}

async function getMemberDonations(memberId: number) {
  const donations = await prisma.donation.findMany({
    where: { memberId },
    orderBy: { date: 'desc' },
  })

  // 연도별 그룹화
  const donationsByYear = donations.reduce(
    (acc, donation) => {
      const year = new Date(donation.date).getFullYear()
      if (!acc[year]) {
        acc[year] = []
      }
      acc[year].push(donation)
      return acc
    },
    {} as Record<number, typeof donations>
  )

  // 통계
  const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0)
  const thisYear = new Date().getFullYear()
  const thisYearAmount = donations
    .filter((d) => new Date(d.date).getFullYear() === thisYear)
    .reduce((sum, d) => sum + d.amount, 0)

  return {
    donationsByYear,
    stats: { totalAmount, thisYearAmount, totalCount: donations.length },
  }
}

export default async function MyDonationsPage() {
  const session = await getSession()

  if (!session || session.role !== 'MEMBER') {
    redirect('/login')
  }

  const { donationsByYear, stats } = await getMemberDonations(session.memberId)
  const years = Object.keys(donationsByYear)
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
          <h1 className="text-2xl font-bold text-gray-900">후원 내역</h1>
          <p className="text-gray-500">전체 후원 현황을 확인하세요</p>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-gray-500">총 후원</p>
            <p className="text-2xl font-bold text-green-600">{stats.totalCount}건</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-gray-500">총 후원금</p>
            <p className="text-xl font-bold text-green-600">{formatAmount(stats.totalAmount)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-gray-500">올해 후원</p>
            <p className="text-xl font-bold text-blue-600">{formatAmount(stats.thisYearAmount)}</p>
          </CardContent>
        </Card>
      </div>

      {/* 연도별 후원 목록 */}
      {years.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            후원 내역이 없습니다.
          </CardContent>
        </Card>
      ) : (
        years.map((year) => (
          <Card key={year}>
            <CardHeader>
              <CardTitle>{year}년</CardTitle>
              <CardDescription>
                {donationsByYear[year].length}건 ·{' '}
                {formatAmount(donationsByYear[year].reduce((sum, d) => sum + d.amount, 0))}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {donationsByYear[year].map((donation) => (
                  <div
                    key={donation.id}
                    className="flex items-center justify-between py-3 border-b last:border-0"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{getPurposeLabel(donation.purpose)}</p>
                        <Badge variant="outline" className={getPurposeBadgeClass(donation.purpose)}>
                          {getPurposeLabel(donation.purpose)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">{formatDate(donation.date)}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-green-600">
                        {formatAmount(donation.amount)}
                      </p>
                      {donation.receiptNo && (
                        <Link
                          href={`/api/certificates/donation-receipt/${donation.id}`}
                          target="_blank"
                        >
                          <Button size="sm" variant="outline">
                            <FileText className="h-3 w-3 mr-1" />
                            영수증
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

function getPurposeLabel(purpose: string) {
  switch (purpose) {
    case 'GENERAL':
      return '일반기금'
    case 'SCHOLARSHIP':
      return '장학금'
    case 'OPERATION':
      return '운영비'
    case 'WELFARE':
      return '복지사업'
    case 'PROGRAM':
      return '프로그램'
    default:
      return purpose
  }
}

function getPurposeBadgeClass(purpose: string) {
  switch (purpose) {
    case 'GENERAL':
      return 'border-blue-200 text-blue-800 bg-blue-50'
    case 'SCHOLARSHIP':
      return 'border-purple-200 text-purple-800 bg-purple-50'
    case 'OPERATION':
      return 'border-green-200 text-green-800 bg-green-50'
    case 'WELFARE':
      return 'border-orange-200 text-orange-800 bg-orange-50'
    case 'PROGRAM':
      return 'border-pink-200 text-pink-800 bg-pink-50'
    default:
      return 'border-gray-200 text-gray-800 bg-gray-50'
  }
}
