import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { VerificationStatus } from '@prisma/client'

/**
 * 휴대폰 본인인증 콜백 처리
 *
 * KG이니시스/다날 등의 본인인증 서비스에서
 * 인증 결과를 받아 처리합니다.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { requestId, resultCode, resultMessage, name, phone, birthDate, gender, ci, di } = body

    // 요청 ID로 인증 레코드 조회
    const verification = await prisma.identityVerification.findUnique({
      where: { requestId },
    })

    if (!verification) {
      return NextResponse.json(
        { success: false, error: '인증 요청을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 인증 만료 확인
    if (verification.expiresAt < new Date()) {
      await prisma.identityVerification.update({
        where: { id: verification.id },
        data: { status: VerificationStatus.EXPIRED },
      })

      return NextResponse.json(
        { success: false, error: '인증 요청이 만료되었습니다.' },
        { status: 400 }
      )
    }

    // 인증 성공 여부 확인 (KG이니시스/다날의 응답 코드에 따라)
    const isSuccess = resultCode === '0000' || resultCode === 'success'

    if (!isSuccess) {
      // 인증 실패
      await prisma.identityVerification.update({
        where: { id: verification.id },
        data: {
          status: VerificationStatus.FAILED,
        },
      })

      return NextResponse.json(
        { success: false, error: resultMessage || '본인인증에 실패했습니다.' },
        { status: 400 }
      )
    }

    // CI 기반 중복가입 확인
    if (ci) {
      const existingMember = await prisma.member.findFirst({
        where: { verificationCi: ci },
      })

      if (existingMember) {
        // 기존 회원이 있음을 표시하고 인증 완료 처리
        await prisma.identityVerification.update({
          where: { id: verification.id },
          data: {
            status: VerificationStatus.VERIFIED,
            name,
            phone,
            birthDate: birthDate ? new Date(birthDate) : null,
            gender: gender === 'M' ? 'MALE' : gender === 'F' ? 'FEMALE' : null,
            ci,
            di,
            completedAt: new Date(),
          },
        })

        return NextResponse.json({
          success: true,
          data: {
            isExistingMember: true,
            existingMember: {
              id: existingMember.id,
              name: existingMember.name,
              email: existingMember.email,
              joinDate: existingMember.joinDate,
            },
            verificationId: verification.id,
          },
        })
      }
    }

    // 신규 회원 인증 완료
    await prisma.identityVerification.update({
      where: { id: verification.id },
      data: {
        status: VerificationStatus.VERIFIED,
        name,
        phone,
        birthDate: birthDate ? new Date(birthDate) : null,
        gender: gender === 'M' ? 'MALE' : gender === 'F' ? 'FEMALE' : null,
        ci,
        di,
        completedAt: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        isExistingMember: false,
        verificationId: verification.id,
        verifiedInfo: {
          name,
          phone,
          birthDate,
          gender: gender === 'M' ? 'MALE' : 'FEMALE',
        },
      },
    })
  } catch (error) {
    console.error('휴대폰 본인인증 콜백 처리 중 오류:', error)
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}

/**
 * GET 요청 처리 (KG이니시스/다날 일부 서비스는 GET으로 콜백)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)

  // URL 파라미터를 body 형태로 변환
  const body = {
    requestId: searchParams.get('requestId'),
    resultCode: searchParams.get('resultCode') || searchParams.get('result'),
    resultMessage: searchParams.get('resultMessage') || searchParams.get('message'),
    name: searchParams.get('name'),
    phone: searchParams.get('phone'),
    birthDate: searchParams.get('birthDate'),
    gender: searchParams.get('gender'),
    ci: searchParams.get('ci'),
    di: searchParams.get('di'),
  }

  // POST와 동일한 로직으로 처리
  return await POST(
    new NextRequest(request.url, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    })
  )
}
