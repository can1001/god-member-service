import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: '검색어를 입력하세요' }, { status: 400 })
  }

  try {
    const member = await prisma.member.findFirst({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        memberType: true,
      },
    })

    if (!member) {
      return NextResponse.json({ member: null, fees: [], donations: [] })
    }

    const [fees, donations] = await Promise.all([
      prisma.memberFee.findMany({
        where: { memberId: member.id },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        select: {
          id: true,
          year: true,
          month: true,
          feeType: true,
          amount: true,
          status: true,
          paidDate: true,
        },
      }),
      prisma.donation.findMany({
        where: { memberId: member.id },
        orderBy: { date: 'desc' },
        select: {
          id: true,
          receiptNo: true,
          amount: true,
          date: true,
          purpose: true,
        },
      }),
    ])

    return NextResponse.json({
      member,
      fees,
      donations,
    })
  } catch (error) {
    console.error('Certificate search error:', error)
    return NextResponse.json({ error: '검색 중 오류가 발생했습니다' }, { status: 500 })
  }
}
