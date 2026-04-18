import crypto from 'crypto'

// 암호화 설정 - 안전한 AES-256-CBC 사용
const ALGORITHM = 'aes-256-cbc'
const KEY_LENGTH = 32
const IV_LENGTH = 16

/**
 * 환경변수에서 암호화 키를 가져옵니다.
 * 실제 프로덕션에서는 AWS KMS, Azure Key Vault 등 보안 키 관리 서비스 사용 권장
 */
function getEncryptionKey(): Buffer {
  const keyFromEnv = process.env.ENCRYPTION_KEY

  if (!keyFromEnv) {
    // 개발 환경용 기본 키 (실제 프로덕션에서는 반드시 환경변수 설정)
    console.warn('ENCRYPTION_KEY not set. Using default key for development.')
    return crypto.scryptSync('default-encryption-key-for-development-only', 'salt', KEY_LENGTH)
  }

  // 환경변수에서 키를 읽어서 32바이트로 생성
  return crypto.scryptSync(keyFromEnv, 'salt', KEY_LENGTH)
}

/**
 * 민감한 문자열을 암호화합니다.
 * @param text 암호화할 텍스트
 * @returns 암호화된 문자열 (base64 인코딩)
 */
export function encrypt(text: string): string {
  if (!text || text.trim() === '') {
    return text
  }

  try {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    // IV + 암호화된 데이터를 조합하여 반환
    const result = iv.toString('hex') + ':' + encrypted
    return Buffer.from(result).toString('base64')
  } catch (error) {
    console.error('암호화 실패:', error)
    throw new Error('데이터 암호화에 실패했습니다.')
  }
}

/**
 * 암호화된 문자열을 복호화합니다.
 * @param encryptedText 암호화된 텍스트 (base64)
 * @returns 복호화된 원본 문자열
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText || encryptedText.trim() === '') {
    return encryptedText
  }

  // MVP 마스킹 텍스트는 복호화하지 않고 그대로 반환
  if (encryptedText === '[ENCRYPTED]') {
    return '[ENCRYPTED]'
  }

  try {
    const key = getEncryptionKey()
    const decodedData = Buffer.from(encryptedText, 'base64').toString('utf8')
    const [ivHex, encryptedHex] = decodedData.split(':')

    if (!ivHex || !encryptedHex) {
      throw new Error('Invalid encrypted format')
    }

    const iv = Buffer.from(ivHex, 'hex')
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  } catch (error) {
    console.error('복호화 실패:', error)
    // 복호화 실패 시 마스킹된 텍스트로 반환 (데이터 무결성 유지)
    return '[ENCRYPTED]'
  }
}

/**
 * 데이터를 마스킹 처리합니다.
 * @param text 마스킹할 텍스트
 * @param visibleLength 뒤에서부터 보여줄 글자 수 (기본 4자리)
 * @returns 마스킹된 문자열
 */
export function mask(text: string, visibleLength = 4): string {
  if (!text || text.length <= visibleLength) {
    return text
  }

  const maskedPart = '*'.repeat(text.length - visibleLength)
  const visiblePart = text.slice(-visibleLength)

  return maskedPart + visiblePart
}

/**
 * 계좌번호를 마스킹합니다.
 * @param accountNo 계좌번호
 * @returns 마스킹된 계좌번호 (예: ****-**-1234)
 */
export function maskAccountNumber(accountNo: string): string {
  if (!accountNo || accountNo === '[ENCRYPTED]') {
    return accountNo
  }

  // 하이픈 제거 후 마스킹
  const cleanAccountNo = accountNo.replace(/-/g, '')
  const masked = mask(cleanAccountNo, 4)

  // 계좌번호 형태로 포맷팅 (예: ****-**-1234)
  if (masked.length >= 8) {
    return masked.slice(0, -6) + '-' + masked.slice(-6, -4) + '-' + masked.slice(-4)
  }

  return masked
}

/**
 * 생년월일을 마스킹합니다.
 * @param birthNo 생년월일 (YYYYMMDD 또는 YYMMDD)
 * @returns 마스킹된 생년월일
 */
export function maskBirthDate(birthNo: string): string {
  if (!birthNo || birthNo === '[ENCRYPTED]') {
    return birthNo
  }

  return mask(birthNo, 2)
}

/**
 * 해시 함수로 민감하지 않은 고유 식별자를 생성합니다.
 * 로그에서 개인 식별 없이 추적할 때 사용
 */
export function hashForTracking(sensitiveData: string): string {
  return crypto.createHash('sha256').update(sensitiveData).digest('hex').substring(0, 16) // 16자리로 축약
}
