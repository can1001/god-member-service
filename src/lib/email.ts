/**
 * 이메일 발송 관련 함수
 * MVP 단계에서는 실제 이메일 발송 대신 콘솔 로그로 대체
 */

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

const EMAIL_ALLOWED_CHAR_PATTERN = /[^a-z0-9@._%+-]/g
const EMAIL_PATTERN =
  /^[a-z0-9](?:[a-z0-9._%+-]{0,63})@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i

/**
 * 이메일 입력값 정규화
 * - 한글/공백/허용되지 않은 문자는 제거
 * - 영문은 소문자로 통일
 */
export function sanitizeEmailInput(email: string): string {
  return email
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(EMAIL_ALLOWED_CHAR_PATTERN, '')
}

/**
 * 저장/검증 전 이메일 정규화
 */
export function normalizeEmail(email: string): string {
  return sanitizeEmailInput(email).trim()
}

/**
 * OTP 이메일 발송 (MVP: 콘솔 로그)
 */
export async function sendOtpEmail(email: string, otpCode: string): Promise<EmailResult> {
  try {
    // MVP: 실제 이메일 발송 대신 콘솔 로그
    // eslint-disable-next-line no-console
    console.log(`[EMAIL OTP] 발송 - 이메일: ${email}, 코드: ${otpCode}`)

    const subject = '[하나님나라연구소] 본인인증 번호 안내'
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>본인인증 번호 안내</title>
  <style>
    body { font-family: 'Malgun Gothic', sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 8px; overflow: hidden; }
    .header { background: #2563eb; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; }
    .otp-code { background: #eff6ff; border: 2px dashed #2563eb; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
    .code-text { font-size: 36px; font-weight: bold; color: #2563eb; letter-spacing: 4px; }
    .footer { background: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
    .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>본인인증 번호 안내</h1>
    </div>
    <div class="content">
      <p>안녕하세요, 하나님나라연구소입니다.</p>
      <p>요청하신 본인인증을 위한 인증번호를 안내해 드립니다.</p>

      <div class="otp-code">
        <p style="margin: 0 0 10px 0;">인증번호</p>
        <div class="code-text">${otpCode}</div>
      </div>

      <div class="warning">
        <strong>⚠️ 중요사항</strong>
        <ul style="margin: 5px 0 0 0; padding-left: 20px;">
          <li>인증번호는 <strong>5분간</strong> 유효합니다.</li>
          <li>본인이 요청하지 않은 경우, 이 이메일을 무시해주세요.</li>
          <li>인증번호를 타인에게 절대 알려주지 마세요.</li>
        </ul>
      </div>

      <p>문의사항이 있으시면 언제든지 연락 주시기 바랍니다.</p>
      <p>감사합니다.</p>
    </div>
    <div class="footer">
      <p>하나님나라연구소</p>
      <p>이 메일은 발신 전용입니다. 답장하지 마세요.</p>
    </div>
  </div>
</body>
</html>
    `

    const textContent = `
[하나님나라연구소] 본인인증 번호 안내

인증번호: ${otpCode}

⚠️ 중요사항:
- 인증번호는 5분간 유효합니다.
- 본인이 요청하지 않은 경우, 이 이메일을 무시해주세요.
- 인증번호를 타인에게 절대 알려주지 마세요.

문의사항이 있으시면 언제든지 연락 주시기 바랍니다.

하나님나라연구소
이 메일은 발신 전용입니다.
    `

    /* eslint-disable no-console */
    console.log(`[EMAIL Subject] ${subject}`)
    console.log(`[EMAIL HTML] ${htmlContent}`)
    console.log(`[EMAIL Text] ${textContent}`)
    /* eslint-enable no-console */

    // TODO: 실제 이메일 서비스 연동
    // 예: Nodemailer with Gmail/SendGrid/AWS SES

    // 성공으로 가정
    return {
      success: true,
      messageId: `email-mock-${Date.now()}`,
    }
  } catch (error) {
    console.error('이메일 발송 실패:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
    }
  }
}

/**
 * 이메일 주소 유효성 검사
 */
export function validateEmail(email: string): boolean {
  const normalizedEmail = normalizeEmail(email)
  return EMAIL_PATTERN.test(normalizedEmail)
}

/**
 * 이메일 발송 제한 확인 (하루 최대 5회)
 */
export function checkEmailRateLimit(attempts: number): boolean {
  const MAX_EMAILS_PER_DAY = 5
  return attempts < MAX_EMAILS_PER_DAY
}
