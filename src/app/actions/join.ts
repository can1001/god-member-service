'use server'

import { prisma } from '@/lib/prisma'
import { logAccess } from '@/lib/audit'
import { normalizeEmail, validateEmail } from '@/lib/email'
import { calcAge } from '@/lib/utils'
import type { MemberType, FeeType, MarketingChannel, Gender } from '@prisma/client'

export interface JoinFormData {
  // 1단계: 기본정보
  name: string
  birthDate: string
  gender: 'MALE' | 'FEMALE'
  phone: string
  email: string
  smsConsent: boolean
  // 2단계: 주소
  address: string
  // 3단계: 회원정보
  memberType: 'REGULAR' | 'ASSOCIATE' | 'YOUTH' | 'DONOR'
  church?: string
  position?: string
  // 4단계: 회비선택 (청소년은 제외)
  feeType?: 'MONTHLY' | 'ANNUAL' | 'LIFETIME'
  // 5단계: 동의
  consentPrivacy: boolean
  consentMarketing: boolean
  marketingChannel?: 'SMS' | 'EMAIL' | 'BOTH'
}

export async function joinMember(
  data: JoinFormData
): Promise<{ success: boolean; data?: { id: number; name: string }; error?: string }> {
  try {
    const normalizedEmail = normalizeEmail(data.email)

    // 필수 필드 검증
    if (!data.name || !data.birthDate || !data.gender || !data.phone || !normalizedEmail) {
      return { success: false, error: '필수 정보를 모두 입력해주세요.' }
    }

    if (!validateEmail(normalizedEmail)) {
      return { success: false, error: '올바른 이메일 형식을 입력해주세요.' }
    }

    if (!data.address) {
      return { success: false, error: '주소를 입력해주세요.' }
    }

    if (!data.memberType) {
      return { success: false, error: '회원 구분을 선택해주세요.' }
    }

    if (!data.consentPrivacy) {
      return { success: false, error: '개인정보 수집·이용에 동의해주세요.' }
    }

    // 나이 검증 (DONOR는 나이 제한 없음)
    if (data.memberType !== 'DONOR') {
      const age = calcAge(data.birthDate)
      if (data.memberType === 'YOUTH' && (age < 13 || age > 18)) {
        return { success: false, error: '청소년 회원은 만 13~18세만 가입 가능합니다.' }
      }
      if ((data.memberType === 'REGULAR' || data.memberType === 'ASSOCIATE') && age < 19) {
        return { success: false, error: '정회원/준회원은 만 19세 이상만 가입 가능합니다.' }
      }
    }

    // 청소년/후원회원이 아닌 경우 회비 유형 필수
    if (data.memberType !== 'YOUTH' && data.memberType !== 'DONOR' && !data.feeType) {
      return { success: false, error: '회비 유형을 선택해주세요.' }
    }

    // 이메일 중복 체크
    const existingMember = await prisma.member.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingMember) {
      return {
        success: false,
        error: '이미 등록된 이메일입니다. 기존 회원이시라면 관리자에게 문의해주세요.',
      }
    }

    // 회비 금액 계산
    const getFeeAmount = (feeType: string) => {
      switch (feeType) {
        case 'MONTHLY':
          return 10000
        case 'ANNUAL':
          return 100000
        case 'LIFETIME':
          return 1000000
        default:
          return 0
      }
    }

    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1

    // 트랜잭션으로 회원 및 회비 데이터 생성
    const result = await prisma.$transaction(async (tx) => {
      // 회원 생성
      const member = await tx.member.create({
        data: {
          name: data.name,
          birthDate: new Date(data.birthDate),
          gender: data.gender as Gender,
          address: data.address,
          phone: data.phone,
          smsConsent: data.smsConsent,
          email: normalizedEmail,
          memberType: data.memberType as MemberType,
          church: data.church || null,
          position: data.position || null,
          joinDate: now,
          feeType:
            data.memberType === 'YOUTH' || data.memberType === 'DONOR'
              ? 'MONTHLY'
              : (data.feeType as FeeType),
          paymentMethod: 'DIRECT_TRANSFER', // 모바일 가입은 직접입금만
          consentPrivacy: data.consentPrivacy,
          consentMarketing: data.consentMarketing,
          marketingChannel: data.consentMarketing
            ? (data.marketingChannel as MarketingChannel)
            : null,
          consentThirdParty: false, // CMS 없으므로 false
          consentDate: now,
        },
      })

      // 회비 자동 생성 (청소년/후원회원 제외)
      if (data.memberType !== 'YOUTH' && data.memberType !== 'DONOR' && data.feeType) {
        const feeAmount = getFeeAmount(data.feeType)

        if (data.feeType === 'MONTHLY') {
          // 월납: 가입 월부터 12월까지
          for (let month = currentMonth; month <= 12; month++) {
            await tx.memberFee.create({
              data: {
                memberId: member.id,
                year: currentYear,
                month: month,
                feeType: 'MONTHLY',
                amount: feeAmount,
              },
            })
          }
        } else if (data.feeType === 'ANNUAL') {
          // 연납: 당해 연도 1건
          await tx.memberFee.create({
            data: {
              memberId: member.id,
              year: currentYear,
              month: null,
              feeType: 'ANNUAL',
              amount: feeAmount,
            },
          })
        } else if (data.feeType === 'LIFETIME') {
          // 평생: 1건만 생성
          await tx.memberFee.create({
            data: {
              memberId: member.id,
              year: currentYear,
              month: null,
              feeType: 'LIFETIME',
              amount: feeAmount,
            },
          })
        }
      }

      return member
    })

    // 감사 로그 기록 (실패해도 무시)
    logAccess({
      action: 'MEMBER_CREATE',
      resourceType: 'MEMBER',
      resourceId: result.id,
      details: `Self-registered member: ${result.name} (${data.memberType})`,
    }).catch(() => {})

    return { success: true, data: { id: result.id, name: result.name } }
  } catch (error) {
    console.error('Error in self-registration:', error)
    return { success: false, error: '회원 가입에 실패했습니다. 잠시 후 다시 시도해주세요.' }
  }
}
