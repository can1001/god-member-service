/**
 * 휴대폰 본인인증 서비스
 *
 * KG이니시스, 다날 등의 본인인증 API 연동
 * MVP에서는 모의 구현, 실제 연동을 위한 인터페이스 제공
 */

export interface PhoneAuthRequest {
  requestId: string
  phone: string
  returnUrl?: string
}

export interface PhoneAuthResponse {
  success: boolean
  authUrl?: string
  error?: string
}

export interface PhoneAuthResult {
  requestId: string
  resultCode: string
  resultMessage: string
  name?: string
  phone?: string
  birthDate?: string
  gender?: string // 'M' | 'F'
  ci?: string // 연계정보
  di?: string // 중복가입확인정보
}

/**
 * KG이니시스 본인인증 서비스
 */
export class KGInisysPhoneAuth {
  private readonly cpId: string
  private readonly cpPassword: string
  private readonly returnUrl: string

  constructor() {
    this.cpId = process.env.KG_INICIS_CP_ID || ''
    this.cpPassword = process.env.KG_INICIS_CP_PASSWORD || ''
    this.returnUrl =
      process.env.KG_INICIS_RETURN_URL ||
      'http://localhost:3000/api/auth/phone-verification/callback'
  }

  /**
   * 본인인증 요청
   */
  async requestAuth(request: PhoneAuthRequest): Promise<PhoneAuthResponse> {
    try {
      // 실제 구현에서는 KG이니시스 API 호출
      if (process.env.NODE_ENV === 'production' && this.cpId) {
        return await this.realKGInisysRequest(request)
      }

      // MVP: 모의 구현
      return this.mockKGInisysRequest(request)
    } catch (error) {
      console.error('KG이니시스 본인인증 요청 오류:', error)
      return {
        success: false,
        error: '본인인증 서비스 연결에 실패했습니다.',
      }
    }
  }

  /**
   * 실제 KG이니시스 API 호출 (실제 구현 시 사용)
   */
  private async realKGInisysRequest(_request: PhoneAuthRequest): Promise<PhoneAuthResponse> {
    // TODO: 실제 KG이니시스 API 구현
    // const response = await fetch('https://cert.inicis.com/...', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/x-www-form-urlencoded',
    //   },
    //   body: new URLSearchParams({
    //     cpId: this.cpId,
    //     cpPassword: this.cpPassword,
    //     requestId: request.requestId,
    //     phone: request.phone,
    //     returnUrl: this.returnUrl,
    //     // 기타 KG이니시스 필수 파라미터들
    //   }),
    // })

    return {
      success: false,
      error: '실제 KG이니시스 연동이 필요합니다.',
    }
  }

  /**
   * 모의 KG이니시스 구현 (MVP용)
   */
  private mockKGInisysRequest(request: PhoneAuthRequest): PhoneAuthResponse {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const params = new URLSearchParams({
      service: 'kginisys',
      requestId: request.requestId,
      phone: request.phone,
      returnUrl: request.returnUrl || '/join',
    })

    return {
      success: true,
      authUrl: `${baseUrl}/mock/phone-auth?${params.toString()}`,
    }
  }
}

/**
 * 다날 본인인증 서비스
 */
export class DanalPhoneAuth {
  private readonly cpId: string
  private readonly cpPassword: string
  private readonly returnUrl: string

  constructor() {
    this.cpId = process.env.DANAL_CP_ID || ''
    this.cpPassword = process.env.DANAL_CP_PASSWORD || ''
    this.returnUrl =
      process.env.DANAL_RETURN_URL || 'http://localhost:3000/api/auth/phone-verification/callback'
  }

  /**
   * 본인인증 요청
   */
  async requestAuth(request: PhoneAuthRequest): Promise<PhoneAuthResponse> {
    try {
      // 실제 구현에서는 다날 API 호출
      if (process.env.NODE_ENV === 'production' && this.cpId) {
        return await this.realDanalRequest(request)
      }

      // MVP: 모의 구현
      return this.mockDanalRequest(request)
    } catch (error) {
      console.error('다날 본인인증 요청 오류:', error)
      return {
        success: false,
        error: '본인인증 서비스 연결에 실패했습니다.',
      }
    }
  }

  /**
   * 실제 다날 API 호출 (실제 구현 시 사용)
   */
  private async realDanalRequest(_request: PhoneAuthRequest): Promise<PhoneAuthResponse> {
    // TODO: 실제 다날 API 구현
    return {
      success: false,
      error: '실제 다날 연동이 필요합니다.',
    }
  }

  /**
   * 모의 다날 구현 (MVP용)
   */
  private mockDanalRequest(request: PhoneAuthRequest): PhoneAuthResponse {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const params = new URLSearchParams({
      service: 'danal',
      requestId: request.requestId,
      phone: request.phone,
      returnUrl: request.returnUrl || '/join',
    })

    return {
      success: true,
      authUrl: `${baseUrl}/mock/phone-auth?${params.toString()}`,
    }
  }
}

/**
 * 본인인증 서비스 팩토리
 */
export class PhoneAuthService {
  private readonly provider: string

  constructor(provider: string = 'kginisys') {
    this.provider = provider
  }

  /**
   * 본인인증 요청
   */
  async requestAuth(request: PhoneAuthRequest): Promise<PhoneAuthResponse> {
    const service = this.getService()
    return await service.requestAuth(request)
  }

  /**
   * 서비스 제공자에 따른 인스턴스 반환
   */
  private getService() {
    switch (this.provider) {
      case 'danal':
        return new DanalPhoneAuth()
      case 'kginisys':
      default:
        return new KGInisysPhoneAuth()
    }
  }
}

/**
 * 기본 본인인증 서비스 인스턴스
 */
export const phoneAuthService = new PhoneAuthService(process.env.PHONE_AUTH_PROVIDER || 'kginisys')
