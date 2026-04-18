import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import BillingRegistration from '@/components/client/BillingRegistration'
import { v4 as uuidv4 } from 'uuid'

interface BillingPageProps {
  searchParams: Promise<{
    memberId?: string
  }>
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const params = await searchParams
  const { memberId } = params

  if (!memberId) {
    redirect('/my')
  }

  const member = await prisma.member.findUnique({
    where: { id: parseInt(memberId) },
    include: { billingKey: true },
  })

  if (!member) {
    redirect('/my')
  }

  // 이미 활성화된 빌링키가 있으면 안내
  if (member.billingKey?.isActive) {
    redirect(`/my/profile?message=already_registered`)
  }

  const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || process.env.TOSS_CLIENT_KEY || ''
  const customerKey = `customer_${member.id}_${uuidv4()}`

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
  const successUrl = `${baseUrl}/my/payment/billing/success`
  const failUrl = `${baseUrl}/my/payment/fail`

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold text-center mb-8">정기결제 카드 등록</h1>
      <BillingRegistration
        clientKey={clientKey}
        customerKey={customerKey}
        memberId={member.id}
        memberName={member.name}
        successUrl={successUrl}
        failUrl={failUrl}
      />
    </div>
  )
}
