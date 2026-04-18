import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyOtpCode, isOtpExpired } from '@/lib/otp'
import { VerificationStatus } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { requestId, otpCode } = body

    // 입력 값 검증
    if (!requestId || !otpCode) {
      return NextResponse.json(
        { success: false, error: '인증 요청 ID와 인증번호를 입력해주세요.' },
        { status: 400 }
      )
    }

    // OTP 코드는 6자리 숫자
    if (!/^\d{6}$/.test(otpCode)) {
      return NextResponse.json(
        { success: false, error: '인증번호는 6자리 숫자여야 합니다.' },
        { status: 400 }
      )
    }

    // 인증 요청 조회
    const verification = await prisma.identityVerification.findUnique({
      where: { requestId },
    })

    if (!verification) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 인증 요청입니다.' },
        { status: 404 }
      )
    }

    // 이미 완료된 인증인지 확인
    if (
      verification.status === VerificationStatus.COMPLETED ||
      verification.status === VerificationStatus.VERIFIED
    ) {
      return NextResponse.json(
        { success: false, error: '이미 완료된 인증입니다.' },
        { status: 400 }
      )
    }

    // 만료된 인증인지 확인
    if (isOtpExpired(verification.expiresAt)) {
      await prisma.identityVerification.update({
        where: { id: verification.id },
        data: { status: VerificationStatus.EXPIRED },
      })

      return NextResponse.json(
        { success: false, error: '인증번호가 만료되었습니다.' },
        { status: 400 }
      )
    }

    // 시도 횟수 확인 (최대 5회)
    if (verification.otpAttempts >= 5) {
      await prisma.identityVerification.update({
        where: { id: verification.id },
        data: { status: VerificationStatus.FAILED },
      })

      return NextResponse.json(
        { success: false, error: '인증 시도 횟수를 초과했습니다.' },
        { status: 400 }
      )
    }

    // OTP 코드 검증
    const isValid = verification.otpCode ? verifyOtpCode(otpCode, verification.otpCode) : false

    // 시도 횟수 증가
    await prisma.identityVerification.update({
      where: { id: verification.id },
      data: { otpAttempts: verification.otpAttempts + 1 },
    })

    if (!isValid) {
      const remainingAttempts = 5 - (verification.otpAttempts + 1)

      if (remainingAttempts <= 0) {
        await prisma.identityVerification.update({
          where: { id: verification.id },
          data: { status: VerificationStatus.FAILED },
        })

        return NextResponse.json(
          { success: false, error: '인증 시도 횟수를 초과했습니다.' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: `인증번호가 올바르지 않습니다. (남은 시도: ${remainingAttempts}회)`,
        },
        { status: 400 }
      )
    }

    // 인증 성공 - 상태 업데이트
    const updatedVerification = await prisma.identityVerification.update({
      where: { id: verification.id },
      data: {
        status: VerificationStatus.COMPLETED,
        completedAt: new Date(),
      },
    })

    // 성공 응답
    return NextResponse.json({
      success: true,
      data: {
        requestId: updatedVerification.requestId,
        method: updatedVerification.method,
        completedAt: updatedVerification.completedAt,
        phone: updatedVerification.phone,
        email: updatedVerification.providerEmail,
      },
    })
  } catch (error) {
    console.error('OTP 검증 중 오류:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
