/**
 * 토스페이먼츠 API 클라이언트
 * @see https://docs.tosspayments.com
 */

const TOSS_API_BASE = 'https://api.tosspayments.com/v1'

// 환경변수에서 시크릿 키 가져오기
function getSecretKey(): string {
  const secretKey = process.env.TOSS_SECRET_KEY
  if (!secretKey) {
    throw new Error('TOSS_SECRET_KEY 환경변수가 설정되지 않았습니다.')
  }
  return secretKey
}

// Basic Auth 헤더 생성
function getAuthHeader(): string {
  const secretKey = getSecretKey()
  const encoded = Buffer.from(`${secretKey}:`).toString('base64')
  return `Basic ${encoded}`
}

// API 요청 공통 함수
async function tossRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${TOSS_API_BASE}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: getAuthHeader(),
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  const data = await response.json()

  if (!response.ok) {
    throw new TossPaymentsError(
      data.code || 'UNKNOWN_ERROR',
      data.message || '알 수 없는 오류가 발생했습니다.'
    )
  }

  return data as T
}

// 토스페이먼츠 에러 클래스
export class TossPaymentsError extends Error {
  code: string

  constructor(code: string, message: string) {
    super(message)
    this.code = code
    this.name = 'TossPaymentsError'
  }
}

// ─────────────────────────────────────────────────────────────
// 결제 승인 API
// ─────────────────────────────────────────────────────────────

export interface ConfirmPaymentRequest {
  paymentKey: string
  orderId: string
  amount: number
}

export interface PaymentResponse {
  paymentKey: string
  orderId: string
  orderName: string
  status: string
  approvedAt: string | null
  method: string
  totalAmount: number
  balanceAmount: number
  suppliedAmount: number
  vat: number
  receipt: {
    url: string
  } | null
  card?: {
    issuerCode: string
    company: string
    number: string
    cardType: string
    installmentPlanMonths: number
  }
  easyPay?: {
    provider: string
    amount: number
  }
  mobilePhone?: {
    carrier: string
    customerMobilePhone: string
  }
  failureReason?: string
}

/**
 * 결제 승인 요청
 */
export async function confirmPayment(request: ConfirmPaymentRequest): Promise<PaymentResponse> {
  return tossRequest<PaymentResponse>('/payments/confirm', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

// ─────────────────────────────────────────────────────────────
// 결제 조회 API
// ─────────────────────────────────────────────────────────────

/**
 * paymentKey로 결제 조회
 */
export async function getPaymentByKey(paymentKey: string): Promise<PaymentResponse> {
  return tossRequest<PaymentResponse>(`/payments/${paymentKey}`)
}

/**
 * orderId로 결제 조회
 */
export async function getPaymentByOrderId(orderId: string): Promise<PaymentResponse> {
  return tossRequest<PaymentResponse>(`/payments/orders/${orderId}`)
}

// ─────────────────────────────────────────────────────────────
// 결제 취소 API
// ─────────────────────────────────────────────────────────────

export interface CancelPaymentRequest {
  cancelReason: string
  cancelAmount?: number
  refundReceiveAccount?: {
    bank: string
    accountNumber: string
    holderName: string
  }
}

export interface CancelResponse {
  paymentKey: string
  orderId: string
  status: string
  cancels: Array<{
    cancelReason: string
    canceledAt: string
    cancelAmount: number
    taxFreeAmount: number
    refundableAmount: number
    cancelStatus: string
  }>
}

/**
 * 결제 취소
 */
export async function cancelPayment(
  paymentKey: string,
  request: CancelPaymentRequest
): Promise<CancelResponse> {
  return tossRequest<CancelResponse>(`/payments/${paymentKey}/cancel`, {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

// ─────────────────────────────────────────────────────────────
// 빌링키 발급 API (정기결제)
// ─────────────────────────────────────────────────────────────

export interface IssueBillingKeyRequest {
  authKey: string
  customerKey: string
}

export interface BillingKeyResponse {
  mId: string
  customerKey: string
  billingKey: string
  authenticatedAt: string
  method: string
  card: {
    issuerCode: string
    acquirerCode: string
    number: string
    cardType: string
    ownerType: string
  }
}

/**
 * 빌링키 발급
 */
export async function issueBillingKey(
  request: IssueBillingKeyRequest
): Promise<BillingKeyResponse> {
  return tossRequest<BillingKeyResponse>('/billing/authorizations/issue', {
    method: 'POST',
    body: JSON.stringify(request),
  })
}

// ─────────────────────────────────────────────────────────────
// 빌링키 결제 API (자동결제)
// ─────────────────────────────────────────────────────────────

export interface BillingPaymentRequest {
  billingKey: string
  customerKey: string
  amount: number
  orderId: string
  orderName: string
  customerEmail?: string
  customerName?: string
}

/**
 * 빌링키로 결제 실행
 */
export async function executeBillingPayment(
  request: BillingPaymentRequest
): Promise<PaymentResponse> {
  return tossRequest<PaymentResponse>('/billing/' + request.billingKey, {
    method: 'POST',
    body: JSON.stringify({
      customerKey: request.customerKey,
      amount: request.amount,
      orderId: request.orderId,
      orderName: request.orderName,
      customerEmail: request.customerEmail,
      customerName: request.customerName,
    }),
  })
}

// ─────────────────────────────────────────────────────────────
// 유틸리티 함수
// ─────────────────────────────────────────────────────────────

/**
 * 주문 ID 생성 (UUID 기반)
 */
export function generateOrderId(prefix: string = 'order'): string {
  const timestamp = Date.now().toString(36)
  const randomPart = Math.random().toString(36).substring(2, 10)
  return `${prefix}_${timestamp}_${randomPart}`
}

/**
 * 결제 수단 코드 -> PaymentMethod enum 변환
 */
export function toPaymentMethod(method: string, easyPayProvider?: string): string {
  if (method === '카드') return 'CARD'
  if (method === '휴대폰') return 'PHONE'
  if (method === '간편결제') {
    switch (easyPayProvider) {
      case '카카오페이':
        return 'KAKAO_PAY'
      case '네이버페이':
        return 'NAVER_PAY'
      case '토스페이':
        return 'TOSS_PAY'
      default:
        return 'CARD'
    }
  }
  return 'DIRECT_TRANSFER'
}

/**
 * 카드사 코드 -> 한글 카드사명 변환
 */
export function getCardCompanyName(issuerCode: string): string {
  const cardCompanies: Record<string, string> = {
    '3K': '기업BC',
    '46': '광주은행',
    '71': '롯데카드',
    '30': 'KDB산업은행',
    '31': 'BC카드',
    '51': '삼성카드',
    '38': '새마을금고',
    '41': '신한카드',
    '62': '신협',
    '36': '씨티카드',
    '33': '우리BC카드',
    W1: '우리카드',
    '37': '우체국예금보험',
    '39': '저축은행중앙회',
    '35': '전북은행',
    '42': '제주은행',
    '15': '카카오뱅크',
    '3A': '케이뱅크',
    '24': '토스뱅크',
    '21': '하나카드',
    '61': '현대카드',
    '11': 'KB국민카드',
    '91': 'NH농협카드',
    '34': 'Sh수협은행',
  }

  return cardCompanies[issuerCode] || issuerCode
}
