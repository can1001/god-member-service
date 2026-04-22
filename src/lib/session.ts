import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

// 세션 쿠키 이름
const SESSION_COOKIE_NAME = 'session'

// 세션 만료 시간 (7일)
const SESSION_EXPIRY_DAYS = 7

// JWT 시크릿 키
function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET 환경변수가 설정되지 않았습니다.')
  }
  return new TextEncoder().encode(secret)
}

// 세션 페이로드 타입
export interface SessionPayload {
  memberId: number
  role: 'MEMBER' | 'ADMIN'
  email: string
  name: string
}

/**
 * JWT 세션 토큰 생성 (Server Action)
 */
export async function createSession(payload: SessionPayload): Promise<string> {
  'use server'

  const secret = getJwtSecret()
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000)

  const token = await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(secret)

  // 쿠키에 세션 저장
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  })

  return token
}

/**
 * JWT 토큰 검증 (읽기 전용 - Server Action 아님)
 */
export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const secret = getJwtSecret()
    const { payload } = await jwtVerify(token, secret)

    return {
      memberId: payload.memberId as number,
      role: payload.role as 'MEMBER' | 'ADMIN',
      email: payload.email as string,
      name: payload.name as string,
    }
  } catch {
    return null
  }
}

/**
 * 현재 세션 조회 (읽기 전용 - Server Action 아님)
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!token) {
    return null
  }

  return verifySession(token)
}

/**
 * 세션 삭제 (로그아웃) (Server Action)
 */
export async function deleteSession(): Promise<void> {
  'use server'

  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE_NAME)
}
