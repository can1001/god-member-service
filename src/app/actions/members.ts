'use server'

import { prisma } from '@/lib/prisma'
import { encrypt, decrypt, maskAccountNumber, maskBirthDate } from '@/lib/crypto'
import { logMemberView, logMemberUpdate, logMemberDelete, logAccess } from '@/lib/audit'
import { getCurrentUser, canPerformAction } from '@/lib/auth'
import { normalizeEmail, validateEmail } from '@/lib/email'
import type { MemberType, FeeType, PaymentMethod, Gender, MarketingChannel } from '@prisma/client'

export async function getMemberDetail(id: number) {
  try {
    // 권한 검증
    const user = await getCurrentUser()
    if (!user || !canPerformAction(user, 'VIEW', id)) {
      return { success: false, error: '접근 권한이 없습니다.' }
    }

    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        cmsInfo: true,
        billingKey: true,
        fees: {
          orderBy: [{ year: 'desc' }, { month: 'desc' }],
          take: 12, // 최근 12개월
        },
        donations: {
          orderBy: { date: 'desc' },
          take: 10, // 최근 10건
        },
        documents: {
          orderBy: { uploadedAt: 'desc' },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 10, // 최근 10건
        },
      },
    })

    if (!member) {
      return { success: false, error: '회원을 찾을 수 없습니다.' }
    }

    // 민감정보 마스킹 처리 (UI 표시용)
    if (member.cmsInfo) {
      const decryptedAccountNo = decrypt(member.cmsInfo.accountNo)
      const decryptedBirthNo = decrypt(member.cmsInfo.holderBirthNo)

      member.cmsInfo.accountNo = maskAccountNumber(decryptedAccountNo)
      member.cmsInfo.holderBirthNo = maskBirthDate(decryptedBirthNo)
    }

    // 감사 로그 기록 (실패해도 무시)
    logMemberView(id, member.name).catch(() => {})

    return { success: true, data: member }
  } catch (error) {
    console.error('Error fetching member detail:', error)
    return { success: false, error: '회원 정보를 불러오는데 실패했습니다.' }
  }
}

export interface UpdateMemberData {
  name: string
  email: string
  phone: string
  address: string
  church?: string
  position?: string
  smsConsent: boolean
  consentMarketing: boolean
  marketingChannel?: 'SMS' | 'EMAIL' | 'BOTH' | null
  isActive: boolean
}

export async function updateMember(id: number, data: UpdateMemberData) {
  try {
    const normalizedEmail = normalizeEmail(data.email)

    if (!normalizedEmail || !validateEmail(normalizedEmail)) {
      return { success: false, error: '올바른 이메일 형식을 입력해주세요.' }
    }

    // 권한 검증
    const user = await getCurrentUser()
    if (!user || !canPerformAction(user, 'UPDATE')) {
      return { success: false, error: '수정 권한이 없습니다.' }
    }

    // 이메일 중복 체크 (자신 제외)
    const existingMember = await prisma.member.findFirst({
      where: {
        email: normalizedEmail,
        id: { not: id },
      },
    })

    if (existingMember) {
      return { success: false, error: '이미 사용중인 이메일입니다.' }
    }

    const member = await prisma.member.update({
      where: { id },
      data: {
        name: data.name,
        email: normalizedEmail,
        phone: data.phone,
        address: data.address,
        church: data.church || null,
        position: data.position || null,
        smsConsent: data.smsConsent,
        consentMarketing: data.consentMarketing,
        marketingChannel: data.marketingChannel || null,
        isActive: data.isActive,
        updatedAt: new Date(),
      },
    })

    // 감사 로그 기록 (실패해도 무시)
    logMemberUpdate(id, member.name, data).catch(() => {})

    return { success: true, data: member }
  } catch (error) {
    console.error('Error updating member:', error)
    return { success: false, error: '회원 정보 수정에 실패했습니다.' }
  }
}

export async function deleteMember(id: number) {
  try {
    // 권한 검증
    const user = await getCurrentUser()
    if (!user || !canPerformAction(user, 'DELETE')) {
      return { success: false, error: '삭제 권한이 없습니다.' }
    }

    // 회원 존재 여부 확인
    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        fees: true,
        donations: true,
        cmsInfo: true,
      },
    })

    if (!member) {
      return { success: false, error: '회원을 찾을 수 없습니다.' }
    }

    // 관련 데이터가 있는지 확인 (하드 삭제 방지를 위한 체크)
    const hasFees = member.fees.length > 0
    const hasDonations = member.donations.length > 0

    if (hasFees || hasDonations) {
      // 관련 데이터가 있으면 soft delete (비활성화)
      const updatedMember = await prisma.member.update({
        where: { id },
        data: {
          isActive: false,
          updatedAt: new Date(),
        },
      })

      // 감사 로그 기록 (실패해도 무시)
      logMemberDelete(id, member.name).catch(() => {})

      return {
        success: true,
        data: updatedMember,
        message: '회원 관련 데이터가 존재하여 계정을 비활성화했습니다.',
      }
    } else {
      // 관련 데이터가 없으면 하드 삭제
      // CmsInfo 먼저 삭제 (외래키 제약조건)
      if (member.cmsInfo) {
        await prisma.cmsInfo.delete({
          where: { memberId: id },
        })
      }

      await prisma.member.delete({
        where: { id },
      })

      // 감사 로그 기록 (실패해도 무시)
      logMemberDelete(id, member.name).catch(() => {})

      return {
        success: true,
        message: '회원 정보가 완전히 삭제되었습니다.',
      }
    }
  } catch (error) {
    console.error('Error deleting member:', error)
    return { success: false, error: '회원 삭제에 실패했습니다.' }
  }
}

export interface CreateMemberData {
  // 기본 정보
  name: string
  birthDate: string
  gender: Gender | ''
  address: string
  phone: string
  smsConsent: boolean
  email: string

  // 회원 정보
  memberType: MemberType | ''
  church?: string
  position?: string

  // 회비 정보
  feeType?: FeeType | ''
  paymentMethod?: PaymentMethod | ''

  // CMS 정보
  cmsInfo?: {
    bankName: string
    accountNo: string
    accountHolder: string
    holderBirthNo: string
    holderPhone: string
    scheduledAmount: number | string
    withdrawDay: number | string
  }

  // 개인정보 동의
  consentPrivacy: boolean
  consentMarketing: boolean
  marketingChannel?: MarketingChannel | '' | null
  consentThirdParty: boolean
}

export async function createMember(formData: CreateMemberData) {
  try {
    const normalizedEmail = normalizeEmail(formData.email)

    if (!normalizedEmail || !validateEmail(normalizedEmail)) {
      return { success: false, error: '올바른 이메일 형식을 입력해주세요.' }
    }

    // 이메일 중복 체크
    const existingMember = await prisma.member.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingMember) {
      return { success: false, error: '이미 사용중인 이메일입니다.' }
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

    // 트랜잭션으로 회원 및 관련 데이터 생성
    const result = await prisma.$transaction(async (tx) => {
      // 회원 생성
      const member = await tx.member.create({
        data: {
          name: formData.name,
          birthDate: new Date(formData.birthDate),
          gender: formData.gender as Gender,
          address: formData.address,
          phone: formData.phone,
          smsConsent: formData.smsConsent,
          email: normalizedEmail,
          memberType: formData.memberType as MemberType,
          church: formData.church || null,
          position: formData.position || null,
          joinDate: now,
          feeType: (formData.feeType as FeeType) || 'MONTHLY',
          paymentMethod: (formData.paymentMethod as PaymentMethod) || 'DIRECT_TRANSFER',
          consentPrivacy: formData.consentPrivacy,
          consentMarketing: formData.consentMarketing,
          marketingChannel: formData.consentMarketing
            ? (formData.marketingChannel as MarketingChannel)
            : null,
          consentThirdParty: formData.consentThirdParty,
          consentDate: now,
        },
      })

      // CMS 정보 생성 (선택한 경우)
      if (formData.paymentMethod === 'CMS' && formData.cmsInfo) {
        await tx.cmsInfo.create({
          data: {
            memberId: member.id,
            bankName: formData.cmsInfo.bankName,
            accountNo: encrypt(formData.cmsInfo.accountNo), // 실제 암호화 적용
            accountHolder: formData.cmsInfo.accountHolder,
            holderBirthNo: encrypt(formData.cmsInfo.holderBirthNo), // 실제 암호화 적용
            holderPhone: formData.cmsInfo.holderPhone,
            scheduledAmount:
              typeof formData.cmsInfo.scheduledAmount === 'string'
                ? parseInt(formData.cmsInfo.scheduledAmount)
                : formData.cmsInfo.scheduledAmount,
            withdrawDay:
              typeof formData.cmsInfo.withdrawDay === 'string'
                ? parseInt(formData.cmsInfo.withdrawDay)
                : formData.cmsInfo.withdrawDay,
          },
        })
      }

      // 회비 자동 생성 (청소년/후원회원 제외)
      if (formData.memberType !== 'YOUTH' && formData.memberType !== 'DONOR' && formData.feeType) {
        const feeAmount = getFeeAmount(formData.feeType)

        if (formData.feeType === 'MONTHLY') {
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
        } else if (formData.feeType === 'ANNUAL') {
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
        } else if (formData.feeType === 'LIFETIME') {
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
      details: `Created member: ${result.name}`,
    }).catch(() => {})

    return { success: true, data: result }
  } catch (error) {
    console.error('Error creating member:', error)
    return { success: false, error: '회원 등록에 실패했습니다.' }
  }
}

// 회비 내역 페이지네이션 조회
export async function getMemberFees(memberId: number, page: number = 1, limit: number = 10) {
  try {
    const skip = (page - 1) * limit

    const [fees, totalCount] = await prisma.$transaction([
      prisma.memberFee.findMany({
        where: { memberId },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.memberFee.count({ where: { memberId } }),
    ])

    return {
      success: true,
      data: {
        fees,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasMore: skip + fees.length < totalCount,
        },
      },
    }
  } catch (error) {
    console.error('Error fetching member fees:', error)
    return { success: false, error: '회비 내역을 불러오는데 실패했습니다.' }
  }
}

// 후원 내역 페이지네이션 조회
export async function getMemberDonations(memberId: number, page: number = 1, limit: number = 10) {
  try {
    const skip = (page - 1) * limit

    const [donations, totalCount] = await prisma.$transaction([
      prisma.donation.findMany({
        where: { memberId },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.donation.count({ where: { memberId } }),
    ])

    return {
      success: true,
      data: {
        donations,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasMore: skip + donations.length < totalCount,
        },
      },
    }
  } catch (error) {
    console.error('Error fetching member donations:', error)
    return { success: false, error: '후원 내역을 불러오는데 실패했습니다.' }
  }
}

// 기본 정보만 조회 (빠른 초기 로딩용)
export async function getMemberBasicInfo(id: number) {
  try {
    // 권한 검증
    const user = await getCurrentUser()
    if (!user || !canPerformAction(user, 'VIEW', id)) {
      return { success: false, error: '접근 권한이 없습니다.' }
    }

    const member = await prisma.member.findUnique({
      where: { id },
      include: {
        cmsInfo: true, // CMS 정보만 포함 (1:1 관계, 빠름)
      },
    })

    if (!member) {
      return { success: false, error: '회원을 찾을 수 없습니다.' }
    }

    // 민감정보 마스킹 처리 (UI 표시용)
    if (member.cmsInfo) {
      const decryptedAccountNo = decrypt(member.cmsInfo.accountNo)
      const decryptedBirthNo = decrypt(member.cmsInfo.holderBirthNo)

      member.cmsInfo.accountNo = maskAccountNumber(decryptedAccountNo)
      member.cmsInfo.holderBirthNo = maskBirthDate(decryptedBirthNo)
    }

    // 감사 로그 기록 (fire-and-forget)
    logMemberView(id, member.name).catch(() => {})

    return { success: true, data: member }
  } catch (error) {
    console.error('Error fetching member basic info:', error)
    return { success: false, error: '회원 정보를 불러오는데 실패했습니다.' }
  }
}

// 문서 내역 페이지네이션 조회
export async function getMemberDocuments(memberId: number, page: number = 1, limit: number = 10) {
  try {
    const skip = (page - 1) * limit

    const [documents, totalCount] = await prisma.$transaction([
      prisma.memberDocument.findMany({
        where: { memberId },
        orderBy: { uploadedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.memberDocument.count({ where: { memberId } }),
    ])

    return {
      success: true,
      data: {
        documents,
        pagination: {
          page,
          limit,
          totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasMore: skip + documents.length < totalCount,
        },
      },
    }
  } catch (error) {
    console.error('Error fetching member documents:', error)
    return { success: false, error: '문서를 불러오는데 실패했습니다.' }
  }
}
