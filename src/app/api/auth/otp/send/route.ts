import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateOtpCode, hashOtpCode, generateOtpExpiry } from '@/lib/otp'
import { sendOtpSms, validatePhoneNumber } from '@/lib/sms'
import { sendOtpEmail, validateEmail } from '@/lib/email'
import { VerificationMethod, VerificationStatus } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { method, phone, email } = body

    // 입력 값 검증
    if (!method || !Object.values(VerificationMethod).includes(method)) {
      return NextResponse.json(
        { success: false, error: '올바른 인증 방식을 선택해주세요.' },
        { status: 400 }
      )
    }

    // 전화번호/이메일 검증
    if (method === VerificationMethod.SMS_OTP) {
      if (!phone || !validatePhoneNumber(phone)) {
        return NextResponse.json(
          { success: false, error: '올바른 전화번호를 입력해주세요.' },
          { status: 400 }
        )
      }
    } else if (method === VerificationMethod.EMAIL_OTP) {
      if (!email || !validateEmail(email)) {
        return NextResponse.json(
          { success: false, error: '올바른 이메일 주소를 입력해주세요.' },
          { status: 400 }
        )
      }
    }

    // 최근 5분 내 동일 번호/이메일로 요청한 인증이 있는지 확인
    const recentVerification = await prisma.identityVerification.findFirst({
      where: {
        method,
        ...(method === VerificationMethod.SMS_OTP ? { phone } : { providerEmail: email }),
        createdAt: {
          gte: new Date(Date.now() - 5 * 60 * 1000), // 5분 전
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (recentVerification) {
      return NextResponse.json(
        { success: false, error: '잠시 후 다시 시도해주세요.' },
        { status: 429 }
      )
    }

    // 오늘 하루 동안 같은 번호/이메일로 요청한 횟수 확인
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const todayAttempts = await prisma.identityVerification.count({
      where: {
        method,
        ...(method === VerificationMethod.SMS_OTP ? { phone } : { providerEmail: email }),
        createdAt: {
          gte: today,
        },
      },
    })

    if (todayAttempts >= 5) {
      return NextResponse.json(
        { success: false, error: '오늘 인증 요청 횟수를 초과했습니다.' },
        { status: 429 }
      )
    }

    // OTP 코드 생성
    const otpCode = generateOtpCode()
    const hashedOtpCode = hashOtpCode(otpCode)
    const expiresAt = generateOtpExpiry()
    const requestId = `otp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // 인증 요청 레코드 생성
    const verification = await prisma.identityVerification.create({
      data: {
        requestId,
        method,
        status: VerificationStatus.PENDING,
        phone: method === VerificationMethod.SMS_OTP ? phone : null,
        providerEmail: method === VerificationMethod.EMAIL_OTP ? email : null,
        otpCode: hashedOtpCode,
        otpSentAt: new Date(),
        otpAttempts: 0,
        expiresAt,
      },
    })

    // OTP 발송
    let sendResult
    if (method === VerificationMethod.SMS_OTP) {
      sendResult = await sendOtpSms(phone, otpCode)
    } else {
      sendResult = await sendOtpEmail(email, otpCode)
    }

    if (!sendResult.success) {
      // 발송 실패 시 레코드 삭제
      await prisma.identityVerification.delete({
        where: { id: verification.id },
      })

      return NextResponse.json(
        { success: false, error: '인증번호 발송에 실패했습니다.' },
        { status: 500 }
      )
    }

    // 성공 응답 (민감한 정보는 제외)
    return NextResponse.json({
      success: true,
      data: {
        requestId: verification.requestId,
        method: verification.method,
        expiresAt: verification.expiresAt,
        maskedTarget:
          method === VerificationMethod.SMS_OTP
            ? phone.replace(/(\d{3})-?(\d{4})-?(\d{4})/, '$1-****-$3')
            : email.replace(/(.{1,3})(.*)(@.*)/, '$1***$3'),
      },
    })
  } catch (error) {
    console.error('OTP 발송 중 오류:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
