import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * 휴대폰 본인인증 상태 조회
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const requestId = searchParams.get('requestId')

    if (!requestId) {
      return NextResponse.json({ success: false, error: '요청 ID가 필요합니다.' }, { status: 400 })
    }

    // 인증 요청 조회
    const verification = await prisma.identityVerification.findUnique({
      where: { requestId },
      include: {
        member: {
          select: {
            id: true,
            name: true,
            email: true,
            joinDate: true,
          },
        },
      },
    })

    if (!verification) {
      return NextResponse.json(
        { success: false, error: '인증 요청을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        requestId: verification.requestId,
        status: verification.status,
        method: verification.method,
        expiresAt: verification.expiresAt,
        completedAt: verification.completedAt,
        // 인증 완료된 정보 (CI가 있으면 중복회원 존재)
        verifiedInfo:
          verification.status === 'VERIFIED'
            ? {
                name: verification.name,
                phone: verification.phone,
                birthDate: verification.birthDate,
                gender: verification.gender,
                hasExistingMember: !!verification.ci && !!verification.member,
                existingMember: verification.member
                  ? {
                      id: verification.member.id,
                      name: verification.member.name,
                      email: verification.member.email,
                      joinDate: verification.member.joinDate,
                    }
                  : null,
              }
            : null,
      },
    })
  } catch (error) {
    console.error('인증 상태 조회 중 오류:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
