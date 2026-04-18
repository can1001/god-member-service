import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { memberId } = body

    // 필수 파라미터 검증
    if (!memberId) {
      return NextResponse.json({ success: false, error: '회원 ID가 필요합니다.' }, { status: 400 })
    }

    // 빌링키 확인
    const billing = await prisma.billingKey.findUnique({
      where: { memberId: parseInt(memberId) },
    })

    if (!billing) {
      return NextResponse.json(
        { success: false, error: '빌링키 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 빌링키 비활성화 및 회원 결제 수단 변경
    await prisma.$transaction(async (tx) => {
      await tx.billingKey.update({
        where: { memberId: parseInt(memberId) },
        data: { isActive: false },
      })

      await tx.member.update({
        where: { id: parseInt(memberId) },
        data: { paymentMethod: 'DIRECT_TRANSFER' },
      })
    })

    return NextResponse.json({
      success: true,
      message: '빌링키가 해지되었습니다.',
    })
  } catch (error) {
    console.error('빌링키 해지 오류:', error)

    return NextResponse.json(
      { success: false, error: '빌링키 해지 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
