import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import PaymentWidget from '@/components/client/PaymentWidget'
import { generateOrderId } from '@/lib/tosspayments'

interface PaymentPageProps {
  searchParams: Promise<{
    memberId?: string
    feeId?: string
    donationId?: string
  }>
}

export default async function PaymentPage({ searchParams }: PaymentPageProps) {
  const params = await searchParams
  const { memberId, feeId, donationId } = params

  if (!memberId) {
    redirect('/my')
  }

  const member = await prisma.member.findUnique({
    where: { id: parseInt(memberId) },
    select: { id: true, name: true, email: true },
  })

  if (!member) {
    redirect('/my')
  }

  let amount = 0
  let orderName = ''
  let memberFeeId: number | undefined

  // 회비 결제인 경우
  if (feeId) {
    const fee = await prisma.memberFee.findUnique({
      where: { id: parseInt(feeId) },
    })

    if (!fee || fee.status === 'PAID') {
      redirect('/my/fees')
    }

    amount = fee.amount
    orderName = `${fee.year}년 ${fee.month ? `${fee.month}월` : '연납'} 회비`
    memberFeeId = fee.id
  }

  // 후원금 결제인 경우
  if (donationId) {
    const donation = await prisma.donation.findUnique({
      where: { id: parseInt(donationId) },
    })

    if (!donation) {
      redirect('/my/donations')
    }

    amount = donation.amount
    orderName = `후원금 - ${donation.purpose}`
  }

  if (amount === 0) {
    redirect('/my')
  }

  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || process.env.TOSS_CLIENT_KEY || ''
  const customerKey = `customer_${member.id}_${Date.now()}`
  const orderId = generateOrderId('fee')

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const successUrl = `${baseUrl}/my/payment/success`
  const failUrl = `${baseUrl}/my/payment/fail`

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold text-center mb-8">결제하기</h1>
      <PaymentWidget
        clientKey={clientKey}
        customerKey={customerKey}
        orderId={orderId}
        orderName={orderName}
        amount={amount}
        customerName={member.name}
        customerEmail={member.email}
        memberId={member.id}
        memberFeeId={memberFeeId}
        donationId={donationId ? parseInt(donationId) : undefined}
        successUrl={successUrl}
        failUrl={failUrl}
      />
    </div>
  )
}
