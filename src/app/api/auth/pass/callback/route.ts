import { NextRequest, NextResponse } from 'next/server'
import { processSocialAuth } from '@/lib/social-auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

/**
 * PASS 간편인증 콜백
 * GET /api/auth/pass/callback?code=...&state=...
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code || !state) {
      return NextResponse.redirect(new URL('/login?error=missing_params', request.url))
    }

    // 상태 검증
    const stateCookie = request.cookies.get('pass_auth_state')
    if (!stateCookie) {
      return NextResponse.redirect(new URL('/login?error=invalid_state', request.url))
    }

    let stateData
    try {
      stateData = JSON.parse(stateCookie.value)
    } catch {
      return NextResponse.redirect(new URL('/login?error=invalid_state', request.url))
    }

    // 상태값 검증
    if (stateData.state !== state) {
      return NextResponse.redirect(new URL('/login?error=invalid_state', request.url))
    }

    // 시간 검증 (5분 초과 시 만료)
    if (Date.now() - stateData.timestamp > 5 * 60 * 1000) {
      return NextResponse.redirect(new URL('/login?error=expired_state', request.url))
    }

    // 간편인증 처리
    const authResult = await processSocialAuth('PASS', code)
    if (!authResult.success || !authResult.userInfo) {
      console.error('PASS auth failed:', authResult.error)
      return NextResponse.redirect(new URL('/login?error=auth_failed', request.url))
    }

    // CI 기반 중복가입 확인
    const ci = authResult.userInfo.ci
    if (ci) {
      const existingMember = await prisma.member.findFirst({
        where: { verificationCi: ci },
      })

      if (existingMember) {
        // 기존 회원이 있음을 표시하고 인증 완료 처리
        const verification = await prisma.identityVerification.create({
          data: {
            requestId: crypto.randomUUID(),
            method: 'PASS',
            status: 'VERIFIED',
            name: authResult.userInfo.name,
            providerId: authResult.userInfo.id,
            phone: authResult.userInfo.phoneNumber,
            birthDate: authResult.userInfo.birthDate
              ? new Date(authResult.userInfo.birthDate)
              : undefined,
            gender: authResult.userInfo.gender as 'MALE' | 'FEMALE' | undefined,
            ci,
            completedAt: new Date(),
            expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30분 후 만료
          },
        })

        // 기존 회원 정보와 함께 리디렉트
        const returnUrl = stateData.returnUrl || '/my'
        const redirectUrl = new URL(returnUrl, request.url)
        redirectUrl.searchParams.set('verification_id', verification.id.toString())
        redirectUrl.searchParams.set('auth_success', 'pass')
        redirectUrl.searchParams.set('existing_member', 'true')
        redirectUrl.searchParams.set('existing_member_name', existingMember.name)
        redirectUrl.searchParams.set('existing_member_email', existingMember.email)
        redirectUrl.searchParams.set(
          'existing_member_join_date',
          existingMember.joinDate.toISOString()
        )

        const response = NextResponse.redirect(redirectUrl)
        response.cookies.delete('pass_auth_state')
        return response
      }
    }

    // 신규 회원 인증 완료
    const verification = await prisma.identityVerification.create({
      data: {
        requestId: crypto.randomUUID(),
        method: 'PASS',
        status: 'VERIFIED',
        name: authResult.userInfo.name,
        providerId: authResult.userInfo.id,
        phone: authResult.userInfo.phoneNumber,
        birthDate: authResult.userInfo.birthDate
          ? new Date(authResult.userInfo.birthDate)
          : undefined,
        gender: authResult.userInfo.gender as 'MALE' | 'FEMALE' | undefined,
        ci,
        completedAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30분 후 만료
      },
    })

    // 성공 시 리턴 URL로 리디렉트 (인증 ID 포함)
    const returnUrl = stateData.returnUrl || '/my'
    const redirectUrl = new URL(returnUrl, request.url)
    redirectUrl.searchParams.set('verification_id', verification.id.toString())
    redirectUrl.searchParams.set('auth_success', 'pass')

    const response = NextResponse.redirect(redirectUrl)

    // 상태 쿠키 삭제
    response.cookies.delete('pass_auth_state')

    return response
  } catch (error) {
    console.error('PASS auth callback error:', error)
    return NextResponse.redirect(new URL('/login?error=callback_failed', request.url))
  }
}
