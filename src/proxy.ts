import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const SESSION_COOKIE_NAME = 'session'

// 보호된 라우트 설정
const protectedRoutes = {
  // 회원 포털 (회원 + 관리자 접근 가능)
  '/my': ['MEMBER', 'ADMIN'],
  // 관리자 전용
  '/dashboard': ['ADMIN'],
  '/members': ['ADMIN'],
  '/fees': ['ADMIN'],
  '/donations': ['ADMIN'],
  '/ai': ['ADMIN'],
  '/documents': ['ADMIN'],
  '/certificates': ['ADMIN'],
  '/payment': ['MEMBER', 'ADMIN'],
}

// 인증된 사용자가 접근하면 안 되는 라우트
const authRoutes = ['/login', '/set-password']

// 공개 라우트 (인증 불필요)
const publicRoutes = ['/join', '/api']

async function verifyToken(token: string): Promise<{ memberId: number; role: string } | null> {
  try {
    const secret = process.env.JWT_SECRET
    if (!secret) return null

    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret))
    return {
      memberId: payload.memberId as number,
      role: payload.role as string,
    }
  } catch {
    return null
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // API 라우트와 정적 파일은 통과
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next()
  }

  // 쿠키에서 세션 토큰 가져오기
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value
  const session = token ? await verifyToken(token) : null

  // 공개 라우트 확인
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route))
  if (isPublicRoute) {
    return NextResponse.next()
  }

  // 인증 라우트 확인 (로그인, 비밀번호 설정)
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))
  if (isAuthRoute) {
    // 이미 로그인된 사용자는 적절한 페이지로 리다이렉트
    if (session) {
      const redirectUrl = session.role === 'ADMIN' ? '/dashboard' : '/my'
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }
    return NextResponse.next()
  }

  // 보호된 라우트 확인
  const matchedRoute = Object.entries(protectedRoutes).find(([route]) => pathname.startsWith(route))

  if (matchedRoute) {
    const [, allowedRoles] = matchedRoute

    // 로그인 안 된 경우
    if (!session) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // 권한 확인
    if (!allowedRoles.includes(session.role)) {
      // 권한이 없으면 적절한 페이지로 리다이렉트
      const redirectUrl = session.role === 'ADMIN' ? '/dashboard' : '/my'
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }

    return NextResponse.next()
  }

  // 루트 경로 처리
  if (pathname === '/') {
    if (session) {
      const redirectUrl = session.role === 'ADMIN' ? '/dashboard' : '/my'
      return NextResponse.redirect(new URL(redirectUrl, request.url))
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
