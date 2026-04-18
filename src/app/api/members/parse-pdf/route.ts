import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { processAddress } from '@/lib/address'

interface ParsedMemberData {
  name?: string
  birthDate?: string
  gender?: 'MALE' | 'FEMALE'
  address?: string
  postalCode?: string
  phone?: string
  smsConsent?: boolean
  email?: string
  church?: string
  position?: string
  memberType?: 'REGULAR' | 'ASSOCIATE' | 'YOUTH'
  feeType?: 'MONTHLY' | 'ANNUAL' | 'LIFETIME'
  paymentMethod?: 'CMS' | 'DIRECT_TRANSFER'
  cmsInfo?: {
    bankName?: string
    accountNo?: string
    accountHolder?: string
    holderBirthNo?: string
    holderPhone?: string
    scheduledAmount?: string
    withdrawDay?: string
  }
  consentPrivacy?: boolean
  consentMarketing?: boolean
  marketingChannel?: 'SMS' | 'EMAIL' | 'BOTH'
  consentThirdParty?: boolean
}

const EXTRACTION_PROMPT = `이 회원가입 신청서 이미지에서 다음 정보를 추출하여 JSON 형식으로 반환해주세요.
찾을 수 없는 필드는 null로 반환하세요.

추출 필드:
{
  "name": "성명 (문자열)",
  "birthDate": "생년월일 (YYYY-MM-DD 형식으로 변환)",
  "gender": "성별 (남성이면 'MALE', 여성이면 'FEMALE')",
  "address": "주소 (문자열, 우편번호 포함된 경우 우편번호도 함께 추출)",
  "postalCode": "우편번호 (5자리 숫자, 예: 12345)",
  "phone": "휴대전화 (000-0000-0000 형식)",
  "smsConsent": "문자 수신 동의/여부 (체크되어 있으면 true)",
  "email": "이메일주소 (문자열)",
  "church": "출석교회 (문자열)",
  "position": "직분 (문자열)",
  "memberType": "회원구분 (정회원이면 'REGULAR', 준회원이면 'ASSOCIATE', 청소년회원이면 'YOUTH')",
  "feeType": "회비유형 (월납이면 'MONTHLY', 연납이면 'ANNUAL', 평생이면 'LIFETIME')",
  "paymentMethod": "납부방법 (CMS/자동이체면 'CMS', 직접입금이면 'DIRECT_TRANSFER')",
  "cmsInfo": {
    "bankName": "은행명",
    "accountNo": "계좌번호",
    "accountHolder": "예금주",
    "holderBirthNo": "예금주 생년월일/주민번호 앞자리 (6자리)",
    "holderPhone": "예금주 연락처",
    "scheduledAmount": "약정금액/이체금액 (숫자만)",
    "withdrawDay": "1페이지 'CMS 자동출금 이체신청서' 섹션의 '*지정 출금일' 행에서 체크박스 내부에 ✓가 있는 것을 찾으세요. □10일/□20일/□25일/□기타 중 체크마크가 있는 숫자: 10일→'10', 20일→'20', 25일→'25'. 반드시 하나의 값을 반환해야 함"
  },
  "consentPrivacy": "개인정보 수집·이용 동의 (체크되어 있으면 true)",
  "consentMarketing": "마케팅/웹진 수신 동의 (체크되어 있으면 true)",
  "marketingChannel": "2페이지 웹진/교육 안내 발송 옵션에서 체크박스 내부에 ✓가 있는 것을 찾으세요. □문자/□이메일/□문자,이메일 중 체크마크가 있는 옵션: 문자→'SMS', 이메일→'EMAIL', 문자,이메일→'BOTH'. 반드시 하나의 값을 반환해야 함",
  "consentThirdParty": "제3자 제공 동의 (체크되어 있으면 true)"
}

중요 지시사항:
- 날짜 형식은 반드시 YYYY-MM-DD로 변환 (예: 1990-05-15)
- 전화번호는 000-0000-0000 형식으로 정리
- 우편번호는 5자리 숫자만 추출 (예: 12345)
- 체크박스가 체크되어 있으면 true, 아니면 false
- CMS 정보가 없으면 cmsInfo는 null
- ★★★ 체크박스 확인법: 박스 내부가 비어있으면(□) 선택 안 됨. 박스 내부에 ✓ 또는 체크마크가 있으면(☑) 선택됨.
- ★★★ 지정출금일: 각 옵션(10일/20일/25일/기타)의 박스 내부를 확인하여 ✓가 있는 것의 숫자 반환
- ★★★ 마케팅 수신방법: 문자/이메일/문자,이메일 각 옵션의 박스 내부를 확인하여 ✓가 있는 것 반환
- JSON만 반환하고 다른 텍스트는 포함하지 마세요`

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'PDF 파일이 필요합니다' }, { status: 400 })
    }

    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'PDF 또는 이미지 파일만 지원됩니다' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const base64Data = buffer.toString('base64')

    // Claude Vision API 호출
    const client = new Anthropic()

    // 파일 타입에 따라 content 구성
    type ContentBlock =
      | {
          type: 'document'
          source: { type: 'base64'; media_type: 'application/pdf'; data: string }
        }
      | {
          type: 'image'
          source: {
            type: 'base64'
            media_type: 'image/png' | 'image/jpeg' | 'image/webp'
            data: string
          }
        }
      | { type: 'text'; text: string }

    const contentBlocks: ContentBlock[] = []

    if (file.type === 'application/pdf') {
      // PDF 파일 직접 전송 (Claude의 PDF 지원)
      contentBlocks.push({
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: base64Data,
        },
      })
    } else {
      // 이미지 파일
      contentBlocks.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: file.type as 'image/png' | 'image/jpeg' | 'image/webp',
          data: base64Data,
        },
      })
    }

    contentBlocks.push({
      type: 'text',
      text: EXTRACTION_PROMPT,
    })

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: contentBlocks,
        },
      ],
    })

    // 응답에서 JSON 추출
    const responseText = message.content[0].type === 'text' ? message.content[0].text : ''

    // JSON 블록 추출 (```json ... ``` 또는 순수 JSON)
    let jsonStr = responseText
    const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1]
    } else {
      // 순수 JSON 추출 시도
      const jsonStartIndex = responseText.indexOf('{')
      const jsonEndIndex = responseText.lastIndexOf('}')
      if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
        jsonStr = responseText.slice(jsonStartIndex, jsonEndIndex + 1)
      }
    }

    let parsedData: ParsedMemberData
    try {
      parsedData = JSON.parse(jsonStr)
    } catch {
      console.error('JSON 파싱 실패:', responseText)
      return NextResponse.json(
        { error: 'AI 응답을 파싱할 수 없습니다. 다시 시도해주세요.' },
        { status: 500 }
      )
    }

    // 데이터 정리 및 검증
    const cleanedData = await cleanParsedData(parsedData)

    return NextResponse.json({
      success: true,
      data: cleanedData,
    })
  } catch (error) {
    console.error('PDF 파싱 오류:', error)
    return NextResponse.json({ error: 'PDF 파싱 중 오류가 발생했습니다' }, { status: 500 })
  }
}

async function cleanParsedData(data: ParsedMemberData): Promise<ParsedMemberData> {
  const cleaned: ParsedMemberData = {}

  // 기본 정보
  if (data.name) cleaned.name = String(data.name).trim()
  if (data.birthDate) {
    // 날짜 형식 정리 (YYYY-MM-DD)
    const dateStr = String(data.birthDate)
    const dateMatch = dateStr.match(/(\d{4})[-.\/](\d{1,2})[-.\/](\d{1,2})/)
    if (dateMatch) {
      cleaned.birthDate = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`
    }
  }
  if (data.gender === 'MALE' || data.gender === 'FEMALE') {
    cleaned.gender = data.gender
  }
  if (data.address) {
    const rawAddress = String(data.address).trim()

    // 주소 처리: 기본주소/상세주소 분리 + 우편번호 자동 검색
    const processedAddress = await processAddress(rawAddress)

    // 최종 주소 형식: "(우편번호) 기본주소, 상세주소"
    cleaned.address = processedAddress.fullAddress
    if (processedAddress.postalCode) {
      cleaned.postalCode = processedAddress.postalCode
    }
  }
  if (data.phone) {
    // 전화번호 정리
    const phoneDigits = String(data.phone).replace(/\D/g, '')
    if (phoneDigits.length === 11) {
      cleaned.phone = `${phoneDigits.slice(0, 3)}-${phoneDigits.slice(3, 7)}-${phoneDigits.slice(7)}`
    } else if (phoneDigits.length === 10) {
      cleaned.phone = `${phoneDigits.slice(0, 3)}-${phoneDigits.slice(3, 6)}-${phoneDigits.slice(6)}`
    } else {
      cleaned.phone = String(data.phone).trim()
    }
  }
  if (data.email) cleaned.email = String(data.email).trim().toLowerCase()

  // SMS 수신 동의
  cleaned.smsConsent = data.smsConsent === true

  if (data.church) cleaned.church = String(data.church).trim()
  if (data.position) cleaned.position = String(data.position).trim()

  // 회원 구분
  if (['REGULAR', 'ASSOCIATE', 'YOUTH'].includes(data.memberType as string)) {
    cleaned.memberType = data.memberType
  }

  // 회비 정보
  if (['MONTHLY', 'ANNUAL', 'LIFETIME'].includes(data.feeType as string)) {
    cleaned.feeType = data.feeType
  }
  if (['CMS', 'DIRECT_TRANSFER'].includes(data.paymentMethod as string)) {
    cleaned.paymentMethod = data.paymentMethod
  }

  // CMS 정보
  if (data.cmsInfo && typeof data.cmsInfo === 'object') {
    cleaned.cmsInfo = {}
    if (data.cmsInfo.bankName) cleaned.cmsInfo.bankName = String(data.cmsInfo.bankName).trim()
    if (data.cmsInfo.accountNo) {
      cleaned.cmsInfo.accountNo = String(data.cmsInfo.accountNo).replace(/\s/g, '')
    }
    if (data.cmsInfo.accountHolder)
      cleaned.cmsInfo.accountHolder = String(data.cmsInfo.accountHolder).trim()
    if (data.cmsInfo.holderBirthNo) {
      cleaned.cmsInfo.holderBirthNo = String(data.cmsInfo.holderBirthNo)
        .replace(/\D/g, '')
        .slice(0, 6)
    }
    if (data.cmsInfo.holderPhone) {
      const phoneDigits = String(data.cmsInfo.holderPhone).replace(/\D/g, '')
      if (phoneDigits.length === 11) {
        cleaned.cmsInfo.holderPhone = `${phoneDigits.slice(0, 3)}-${phoneDigits.slice(3, 7)}-${phoneDigits.slice(7)}`
      } else {
        cleaned.cmsInfo.holderPhone = String(data.cmsInfo.holderPhone).trim()
      }
    }
    if (data.cmsInfo.scheduledAmount) {
      cleaned.cmsInfo.scheduledAmount = String(data.cmsInfo.scheduledAmount).replace(/\D/g, '')
    }
    if (data.cmsInfo.withdrawDay) {
      const withdrawDayStr = String(data.cmsInfo.withdrawDay).replace(/\D/g, '')
      // 유효한 출금일인지 확인 (1~31일)
      const withdrawDay = parseInt(withdrawDayStr)
      if (!isNaN(withdrawDay) && withdrawDay >= 1 && withdrawDay <= 31) {
        cleaned.cmsInfo.withdrawDay = withdrawDayStr
      }
    }
  }

  // 동의 항목
  cleaned.consentPrivacy = data.consentPrivacy === true
  cleaned.consentMarketing = data.consentMarketing === true
  if (['SMS', 'EMAIL', 'BOTH'].includes(data.marketingChannel as string)) {
    cleaned.marketingChannel = data.marketingChannel
  }
  cleaned.consentThirdParty = data.consentThirdParty === true

  return cleaned
}
