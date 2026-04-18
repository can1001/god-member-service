import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// 디바이스 세션 추적이 필요한 경로
const SESSION_TRACKING_PATHS = ['/members', '/fees', '/donations', '/dashboard', '/ai']

// API 경로 중 세션 추적이 필요한 경로
const API_SESSION_TRACKING_PATHS = ['/api/documents/', '/api/certificates/']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 세션 추적이 필요한 페이지인지 확인
  const needsSessionTracking =
    SESSION_TRACKING_PATHS.some((path) => pathname.startsWith(path)) ||
    API_SESSION_TRACKING_PATHS.some((path) => pathname.startsWith(path))

  if (needsSessionTracking) {
    // 클라이언트 정보 수집
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    const forwarded = request.headers.get('x-forwarded-for')
    const realIP = request.headers.get('x-real-ip')
    const remoteAddr = request.headers.get('x-remote-addr')

    let ipAddress = '127.0.0.1'
    if (forwarded) {
      ipAddress = forwarded.split(',')[0].trim()
    } else if (realIP) {
      ipAddress = realIP
    } else if (remoteAddr) {
      ipAddress = remoteAddr
    }

    // 디바이스 세션 추적을 위한 헤더 추가
    const response = NextResponse.next()

    // 커스텀 헤더로 클라이언트 정보 전달 (API 라우트에서 사용 가능)
    response.headers.set('X-Device-UserAgent', userAgent)
    response.headers.set('X-Device-IP', ipAddress)

    // 새로운 디바이스 감지 시 알림 쿠키 설정 (클라이언트에서 처리)
    const deviceFingerprint = generateSimpleFingerprint(userAgent, ipAddress)

    // 기존 디바이스 쿠키 확인
    const existingDevice = request.cookies.get('device-id')?.value

    if (!existingDevice || existingDevice !== deviceFingerprint) {
      // 새로운 디바이스 감지
      response.cookies.set('device-id', deviceFingerprint, {
        maxAge: 365 * 24 * 60 * 60, // 1년
        httpOnly: false, // 클라이언트에서 읽을 수 있도록
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      })

      // 새 디바이스 알림 플래그
      if (!existingDevice) {
        response.cookies.set('new-device-detected', 'true', {
          maxAge: 60, // 1분 (한 번만 표시)
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
        })
      }
    }

    return response
  }

  return NextResponse.next()
}

/**
 * 간단한 디바이스 Fingerprint 생성
 * (실제 crypto 모듈 없이 간단한 해시 생성)
 */
function generateSimpleFingerprint(userAgent: string, ipAddress: string): string {
  const data = `${userAgent}|${ipAddress}`
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // 32bit 정수로 변환
  }
  return Math.abs(hash).toString(16)
}

export const config = {
  matcher: [
    /*
     * 다음 경로들을 제외한 모든 요청에 매칭:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
