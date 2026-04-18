import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { VerificationMethod, VerificationStatus } from '@prisma/client'
import { phoneAuthService } from '@/lib/phone-verification'

/**
 * 휴대폰 본인인증 시작
 *
 * KG이니시스/다날 등의 본인인증 서비스를 연동하여
 * 휴대폰 인증 세션을 시작합니다.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, returnUrl } = body

    // 입력값 검증
    if (!phone) {
      return NextResponse.json(
        { success: false, error: '휴대폰 번호를 입력해주세요.' },
        { status: 400 }
      )
    }

    // 휴대폰 번호 형식 검증 (010-XXXX-XXXX 또는 01012345678)
    const phonePattern = /^01[0-9]-?[0-9]{3,4}-?[0-9]{4}$/
    if (!phonePattern.test(phone.replace(/\s/g, ''))) {
      return NextResponse.json(
        { success: false, error: '올바른 휴대폰 번호 형식이 아닙니다.' },
        { status: 400 }
      )
    }

    // 정규화된 휴대폰 번호
    const normalizedPhone = phone.replace(/[-\s]/g, '')

    // 요청 ID 생성
    const requestId = `phone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // 만료 시간 (30분)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000)

    // 인증 요청 레코드 생성
    const verification = await prisma.identityVerification.create({
      data: {
        requestId,
        method: VerificationMethod.PHONE,
        status: VerificationStatus.PENDING,
        phone: normalizedPhone,
        redirectUrl: returnUrl || '/join',
        expiresAt,
      },
    })

    // KG이니시스/다날 본인인증 서비스 호출
    const authResult = await phoneAuthService.requestAuth({
      requestId: verification.requestId,
      phone: normalizedPhone,
      returnUrl,
    })

    if (!authResult.success) {
      // 인증 서비스 호출 실패 시 레코드 삭제
      await prisma.identityVerification.delete({
        where: { id: verification.id },
      })

      return NextResponse.json({ success: false, error: authResult.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: {
        requestId: verification.requestId,
        authUrl: authResult.authUrl,
        expiresAt: verification.expiresAt,
      },
    })
  } catch (error) {
    console.error('휴대폰 본인인증 시작 중 오류:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
