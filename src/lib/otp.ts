import { createHash } from 'crypto'

/**
 * OTP 관련 유틸리티 함수
 */

/**
 * 6자리 OTP 코드 생성
 */
export function generateOtpCode(): string {
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  return code
}

/**
 * OTP 코드 해시 생성 (데이터베이스 저장용)
 */
export function hashOtpCode(code: string): string {
  return createHash('sha256').update(code).digest('hex')
}

/**
 * OTP 코드 검증
 */
export function verifyOtpCode(inputCode: string, hashedCode: string): boolean {
  const inputHash = hashOtpCode(inputCode)
  return inputHash === hashedCode
}

/**
 * OTP 만료 시간 생성 (5분)
 */
export function generateOtpExpiry(): Date {
  const expiry = new Date()
  expiry.setMinutes(expiry.getMinutes() + 5)
  return expiry
}

/**
 * OTP 만료 여부 확인
 */
export function isOtpExpired(expiryDate: Date): boolean {
  return new Date() > expiryDate
}

/**
 * 전화번호 포맷팅 (010-1234-5678 → 01012345678)
 */
export function formatPhoneForSms(phone: string): string {
  return phone.replace(/[^0-9]/g, '')
}

/**
 * 전화번호 마스킹 (010-1234-5678 → 010-****-5678)
 */
export function maskPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[^0-9]/g, '')
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-****-${cleaned.slice(-4)}`
  }
  return phone
}

/**
 * 이메일 마스킹 (user@example.com → u***@example.com)
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (local.length <= 1) return email

  const maskedLocal = local[0] + '*'.repeat(local.length - 1)
  return `${maskedLocal}@${domain}`
}
