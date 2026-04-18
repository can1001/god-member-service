/**
 * 간편인증 (카카오/네이버/PASS) 유틸리티
 */

import { VerificationMethod } from '@prisma/client'
import crypto from 'crypto'

// 간편인증 제공자 설정
export interface SocialAuthProvider {
  name: string
  clientId: string
  clientSecret: string
  redirectUri: string
  authUrl: string
  tokenUrl: string
  userInfoUrl: string
}

// 카카오 간편인증 설정
export const kakaoProvider: SocialAuthProvider = {
  name: 'KAKAO',
  clientId: process.env.KAKAO_AUTH_CLIENT_ID || '',
  clientSecret: process.env.KAKAO_AUTH_CLIENT_SECRET || '',
  redirectUri: process.env.KAKAO_AUTH_REDIRECT_URI || '',
  authUrl: 'https://kauth.kakao.com/oauth/authorize',
  tokenUrl: 'https://kauth.kakao.com/oauth/token',
  userInfoUrl: 'https://kapi.kakao.com/v2/user/me',
}

// 네이버 간편인증 설정
export const naverProvider: SocialAuthProvider = {
  name: 'NAVER',
  clientId: process.env.NAVER_AUTH_CLIENT_ID || '',
  clientSecret: process.env.NAVER_AUTH_CLIENT_SECRET || '',
  redirectUri: process.env.NAVER_AUTH_REDIRECT_URI || '',
  authUrl: 'https://nid.naver.com/oauth2.0/authorize',
  tokenUrl: 'https://nid.naver.com/oauth2.0/token',
  userInfoUrl: 'https://openapi.naver.com/v1/nid/me',
}

// PASS 간편인증 설정
export const passProvider: SocialAuthProvider = {
  name: 'PASS',
  clientId: process.env.PASS_AUTH_CLIENT_ID || '',
  clientSecret: process.env.PASS_AUTH_CLIENT_SECRET || '',
  redirectUri: process.env.PASS_AUTH_REDIRECT_URI || '',
  authUrl: 'https://pass.sktelecom.com/oauth/authorize',
  tokenUrl: 'https://pass.sktelecom.com/oauth/token',
  userInfoUrl: 'https://pass.sktelecom.com/api/user/me',
}

/**
 * 간편인증 제공자별 설정 가져오기
 */
export function getProvider(method: VerificationMethod): SocialAuthProvider | null {
  switch (method) {
    case 'KAKAO':
      return kakaoProvider
    case 'NAVER':
      return naverProvider
    case 'PASS':
      return passProvider
    default:
      return null
  }
}

/**
 * OAuth 인증 URL 생성
 */
export function generateAuthUrl(
  method: VerificationMethod,
  state?: string
): { url: string; state: string } | null {
  const provider = getProvider(method)
  if (!provider) {
    return null
  }

  // 상태값 생성 (CSRF 방지)
  const stateValue = state || crypto.randomBytes(32).toString('hex')

  const params = new URLSearchParams({
    client_id: provider.clientId,
    redirect_uri: provider.redirectUri,
    response_type: 'code',
    state: stateValue,
  })

  // 제공자별 추가 파라미터
  if (method === 'KAKAO') {
    params.append('scope', 'profile_nickname,profile_image,account_email')
  } else if (method === 'NAVER') {
    params.append('scope', 'name,email,profile_image')
  } else if (method === 'PASS') {
    params.append('scope', 'name,birthday,gender,ci')
  }

  return {
    url: `${provider.authUrl}?${params.toString()}`,
    state: stateValue,
  }
}

/**
 * 인증 코드로 액세스 토큰 교환
 */
export async function exchangeCodeForToken(
  method: VerificationMethod,
  code: string
): Promise<{ accessToken: string; refreshToken?: string } | null> {
  const provider = getProvider(method)
  if (!provider) {
    return null
  }

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: provider.clientId,
    client_secret: provider.clientSecret,
    redirect_uri: provider.redirectUri,
    code,
  })

  try {
    const response = await fetch(provider.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    })

    if (!response.ok) {
      throw new Error(`Token exchange failed: ${response.status}`)
    }

    const data = await response.json()

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
    }
  } catch (error) {
    console.error('Token exchange error:', error)
    return null
  }
}

/**
 * 사용자 정보 조회
 */
export async function getUserInfo(
  method: VerificationMethod,
  accessToken: string
): Promise<{
  id: string
  name: string
  email?: string
  phoneNumber?: string
  birthDate?: string
  gender?: string
  ci?: string // 연계정보 (중복가입 방지용)
} | null> {
  const provider = getProvider(method)
  if (!provider) {
    return null
  }

  try {
    const response = await fetch(provider.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      throw new Error(`User info request failed: ${response.status}`)
    }

    const data = await response.json()

    // 제공자별 응답 데이터 파싱
    if (method === 'KAKAO') {
      return {
        id: data.id.toString(),
        name: data.properties?.nickname || '',
        email: data.kakao_account?.email,
        // 카카오는 CI 정보 제공 안 함 (별도 사업자 인증 필요)
      }
    } else if (method === 'NAVER') {
      return {
        id: data.response.id,
        name: data.response.name,
        email: data.response.email,
        phoneNumber: data.response.mobile,
        birthDate: data.response.birthday,
        gender: data.response.gender,
      }
    } else if (method === 'PASS') {
      return {
        id: data.id,
        name: data.name,
        phoneNumber: data.phone_number,
        birthDate: data.birthday,
        gender: data.gender,
        ci: data.ci, // PASS는 CI 정보 제공
      }
    }

    return null
  } catch (error) {
    console.error('Get user info error:', error)
    return null
  }
}

/**
 * 간편인증 처리 결과
 */
export interface SocialAuthResult {
  success: boolean
  provider: string
  userInfo?: {
    id: string
    name: string
    email?: string
    phoneNumber?: string
    birthDate?: string
    gender?: string
    ci?: string
  }
  error?: string
}

/**
 * 간편인증 완전 처리 (코드 → 토큰 → 사용자 정보)
 */
export async function processSocialAuth(
  method: VerificationMethod,
  code: string
): Promise<SocialAuthResult> {
  const provider = getProvider(method)
  if (!provider) {
    return {
      success: false,
      provider: method,
      error: '지원하지 않는 인증 제공자입니다.',
    }
  }

  // 1. 토큰 교환
  const tokenResult = await exchangeCodeForToken(method, code)
  if (!tokenResult) {
    return {
      success: false,
      provider: method,
      error: '토큰 교환에 실패했습니다.',
    }
  }

  // 2. 사용자 정보 조회
  const userInfo = await getUserInfo(method, tokenResult.accessToken)
  if (!userInfo) {
    return {
      success: false,
      provider: method,
      error: '사용자 정보 조회에 실패했습니다.',
    }
  }

  return {
    success: true,
    provider: method,
    userInfo,
  }
}
