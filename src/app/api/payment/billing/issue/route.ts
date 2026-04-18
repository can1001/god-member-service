import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { issueBillingKey, getCardCompanyName, TossPaymentsError } from '@/lib/tosspayments'
import { encrypt } from '@/lib/crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { authKey, customerKey, memberId } = body

    // 필수 파라미터 검증
    if (!authKey || !customerKey || !memberId) {
      return NextResponse.json(
        { success: false, error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      )
    }

    // 회원 확인
    const member = await prisma.member.findUnique({
      where: { id: parseInt(memberId) },
    })

    if (!member) {
      return NextResponse.json(
        { success: false, error: '회원 정보를 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 기존 빌링키 확인
    const existingBilling = await prisma.billingKey.findUnique({
      where: { memberId: parseInt(memberId) },
    })

    if (existingBilling && existingBilling.isActive) {
      return NextResponse.json(
        { success: false, error: '이미 등록된 빌링키가 있습니다.' },
        { status: 400 }
      )
    }

    // 토스페이먼츠 빌링키 발급 요청
    const billingResult = await issueBillingKey({
      authKey,
      customerKey,
    })

    // 빌링키 암호화 저장
    const encryptedBillingKey = encrypt(billingResult.billingKey)

    // DB에 빌링키 저장
    await prisma.$transaction(async (tx) => {
      // 기존 빌링키가 있으면 업데이트, 없으면 생성
      if (existingBilling) {
        await tx.billingKey.update({
          where: { memberId: parseInt(memberId) },
          data: {
            billingKey: encryptedBillingKey,
            customerKey,
            cardCompany: getCardCompanyName(billingResult.card.issuerCode),
            cardNumber: billingResult.card.number,
            cardType: billingResult.card.cardType,
            isActive: true,
            authenticatedAt: new Date(billingResult.authenticatedAt),
          },
        })
      } else {
        await tx.billingKey.create({
          data: {
            memberId: parseInt(memberId),
            billingKey: encryptedBillingKey,
            customerKey,
            cardCompany: getCardCompanyName(billingResult.card.issuerCode),
            cardNumber: billingResult.card.number,
            cardType: billingResult.card.cardType,
            authenticatedAt: new Date(billingResult.authenticatedAt),
          },
        })
      }

      // 회원 결제 수단을 BILLING으로 업데이트
      await tx.member.update({
        where: { id: parseInt(memberId) },
        data: { paymentMethod: 'BILLING' },
      })
    })

    return NextResponse.json({
      success: true,
      data: {
        cardCompany: getCardCompanyName(billingResult.card.issuerCode),
        cardNumber: billingResult.card.number,
        cardType: billingResult.card.cardType,
      },
    })
  } catch (error) {
    console.error('빌링키 발급 오류:', error)

    if (error instanceof TossPaymentsError) {
      return NextResponse.json(
        { success: false, error: error.message, code: error.code },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: '빌링키 발급 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
