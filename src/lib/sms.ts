/**
 * SMS 발송 관련 함수
 * MVP 단계에서는 실제 SMS 발송 대신 콘솔 로그로 대체
 */

export interface SmsResult {
  success: boolean
  messageId?: string
  error?: string
}

/**
 * OTP SMS 발송 (MVP: 콘솔 로그)
 */
export async function sendOtpSms(phone: string, otpCode: string): Promise<SmsResult> {
  try {
    // MVP: 실제 SMS 발송 대신 콘솔 로그
    // eslint-disable-next-line no-console
    console.log(`[SMS OTP] 발송 - 번호: ${phone}, 코드: ${otpCode}`)

    const message = `[하나님나라연구소] 본인인증 번호는 [${otpCode}]입니다. 5분 내에 입력해주세요.`

    // TODO: 실제 SMS 서비스 연동
    // 예: NHN Toast SMS, 알리고, 문자나라 등

    // eslint-disable-next-line no-console
    console.log(`[SMS Message] ${message}`)

    // 성공으로 가정
    return {
      success: true,
      messageId: `mock-${Date.now()}`,
    }
  } catch (error) {
    console.error('SMS 발송 실패:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    }
  }
}

/**
 * SMS 발송 가능 여부 확인
 */
export function validatePhoneNumber(phone: string): boolean {
  // 한국 휴대폰 번호 패턴 (010, 011, 016, 017, 018, 019)
  const phonePattern = /^01[0-9]-?\d{3,4}-?\d{4}$/
  const cleaned = phone.replace(/[^0-9]/g, '')

  return phonePattern.test(phone) && cleaned.length === 11
}

/**
 * SMS 발송 제한 확인 (하루 최대 5회)
 */
export function checkSmsRateLimit(attempts: number): boolean {
  const MAX_SMS_PER_DAY = 5
  return attempts < MAX_SMS_PER_DAY
}
