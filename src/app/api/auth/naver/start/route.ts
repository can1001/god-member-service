import { NextRequest, NextResponse } from 'next/server'
import { generateAuthUrl } from '@/lib/social-auth'

/**
 * 네이버 간편인증 시작
 * GET /api/auth/naver/start
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const returnUrl = searchParams.get('returnUrl') || '/my'

    // OAuth 인증 URL 생성
    const authResult = generateAuthUrl('NAVER')
    if (!authResult) {
      return NextResponse.json(
        { success: false, error: '네이버 인증 설정이 올바르지 않습니다.' },
        { status: 500 }
      )
    }

    // 상태 정보를 쿠키에 저장 (CSRF 방지 & 리턴 URL 저장)
    const stateData = {
      state: authResult.state,
      returnUrl,
      timestamp: Date.now(),
    }

    const response = NextResponse.json({
      success: true,
      authUrl: authResult.url,
    })

    // 상태 쿠키 설정 (5분 만료)
    response.cookies.set('naver_auth_state', JSON.stringify(stateData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 5 * 60, // 5분
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Naver auth start error:', error)
    return NextResponse.json(
      { success: false, error: '네이버 인증 초기화에 실패했습니다.' },
      { status: 500 }
    )
  }
}
