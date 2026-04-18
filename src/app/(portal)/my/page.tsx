import { redirect } from 'next/navigation'
import Link from 'next/link'
import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/session'
import { formatAmount, formatDate } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CreditCard, Heart, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: '마이페이지 - 하나님나라연구소',
  description: '회원 마이페이지',
}

async function getMemberData(memberId: number) {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: {
      fees: {
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        take: 5,
      },
      donations: {
        orderBy: { date: 'desc' },
        take: 3,
      },
    },
  })

  if (!member) return null

  // 통계 계산
  const unpaidFees = member.fees.filter((f) => f.status === 'UNPAID')
  const unpaidAmount = unpaidFees.reduce((sum, f) => sum + f.amount, 0)
  const totalDonations = await prisma.donation.aggregate({
    where: { memberId },
    _sum: { amount: true },
  })

  return {
    member,
    stats: {
      unpaidCount: unpaidFees.length,
      unpaidAmount,
      totalDonations: totalDonations._sum.amount || 0,
    },
  }
}

export default async function MyPage() {
  const session = await getSession()

  if (!session || session.role !== 'MEMBER') {
    redirect('/login')
  }

  const data = await getMemberData(session.memberId)

  if (!data) {
    redirect('/login')
  }

  const { member, stats } = data

  return (
    <div className="space-y-6">
      {/* 환영 메시지 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">안녕하세요, {member.name}님!</h1>
        <p className="text-gray-500 mt-1">
          {getMemberTypeLabel(member.memberType)} · 가입일 {formatDate(member.joinDate)}
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-lg ${stats.unpaidCount > 0 ? 'bg-red-100' : 'bg-green-100'}`}
              >
                {stats.unpaidCount > 0 ? (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">미납 회비</p>
                <p
                  className={`text-lg font-bold ${stats.unpaidCount > 0 ? 'text-red-600' : 'text-green-600'}`}
                >
                  {stats.unpaidCount > 0 ? `${stats.unpaidCount}건` : '없음'}
                </p>
                {stats.unpaidAmount > 0 && (
                  <p className="text-xs text-gray-400">{formatAmount(stats.unpaidAmount)}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Heart className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">총 후원금</p>
                <p className="text-lg font-bold text-purple-600">
                  {formatAmount(stats.totalDonations)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 최근 회비 내역 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">최근 회비 내역</CardTitle>
            <CardDescription>최근 5건의 회비 현황</CardDescription>
          </div>
          <Link href="/my/fees">
            <Button variant="ghost" size="sm">
              전체보기 <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {member.fees.length === 0 ? (
            <p className="text-center text-gray-500 py-4">회비 내역이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {member.fees.map((fee) => (
                <div
                  key={fee.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium">
                      {fee.year}년 {fee.month ? `${fee.month}월` : '연납'}
                    </p>
                    <p className="text-sm text-gray-500">{formatAmount(fee.amount)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={getStatusBadgeClass(fee.status)}>
                      {getStatusLabel(fee.status)}
                    </Badge>
                    {fee.status === 'UNPAID' && (
                      <Link href={`/my/payment?memberId=${member.id}&feeId=${fee.id}`}>
                        <Button size="sm" variant="default">
                          <CreditCard className="h-3 w-3 mr-1" />
                          납부
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 최근 후원 내역 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">최근 후원 내역</CardTitle>
            <CardDescription>최근 3건의 후원 현황</CardDescription>
          </div>
          <Link href="/my/donations">
            <Button variant="ghost" size="sm">
              전체보기 <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {member.donations.length === 0 ? (
            <p className="text-center text-gray-500 py-4">후원 내역이 없습니다.</p>
          ) : (
            <div className="space-y-3">
              {member.donations.map((donation) => (
                <div
                  key={donation.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium">{getPurposeLabel(donation.purpose)}</p>
                    <p className="text-sm text-gray-500">{formatDate(donation.date)}</p>
                  </div>
                  <p className="font-semibold text-green-600">{formatAmount(donation.amount)}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function getMemberTypeLabel(type: string) {
  switch (type) {
    case 'REGULAR':
      return '정회원'
    case 'ASSOCIATE':
      return '준회원'
    case 'YOUTH':
      return '청소년회원'
    case 'DONOR':
      return '후원회원'
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
