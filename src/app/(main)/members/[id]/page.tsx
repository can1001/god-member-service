import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, Calendar, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { prisma } from '@/lib/prisma'
import { formatDate } from '@/lib/utils'
import { MemberEditDialog } from '@/components/client/MemberEditDialog'
import { MemberDeleteDialog } from '@/components/client/MemberDeleteDialog'
import { MemberDetailTabs } from '@/components/client/MemberDetailTabs'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getMember(id: number) {
  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      cmsInfo: true,
      billingKey: true,
      fees: {
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        take: 12,
      },
      donations: {
        orderBy: { date: 'desc' },
        take: 10,
      },
      documents: {
        orderBy: { uploadedAt: 'desc' },
      },
      payments: {
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  })

  if (!member) return null

  // 계좌번호 마스킹
  if (member.cmsInfo?.accountNo) {
    const acc = member.cmsInfo.accountNo
    member.cmsInfo.accountNo = acc.length > 4 ? '****' + acc.slice(-4) : acc
  }

  return member
}

export default async function MemberDetailPage({ params }: PageProps) {
  const { id } = await params
  const memberId = parseInt(id, 10)

  if (isNaN(memberId)) {
    notFound()
  }

  const member = await getMember(memberId)

  if (!member) {
    notFound()
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link href="/members">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">목록으로</span>
            </Button>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">{member.name}</h1>
            <p className="text-sm text-gray-500">
              {getMemberTypeLabel(member.memberType)} · {member.isActive ? '활성' : '비활성'}
            </p>
          </div>
        </div>
        <div className="flex gap-2 self-end sm:self-auto">
          <MemberEditDialog memberId={member.id} memberName={member.name} />
          <MemberDeleteDialog memberId={member.id} memberName={member.name} />
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <SummaryCard
          label="가입일"
          value={formatDate(member.joinDate)}
          icon={<Calendar className="h-5 w-5 text-blue-500" />}
        />
        <SummaryCard
          label="회비 유형"
          value={getFeeTypeLabel(member.feeType)}
          icon={<CreditCard className="h-5 w-5 text-green-500" />}
        />
        <SummaryCard
          label="납부 방법"
          value={getPaymentMethodLabel(member.paymentMethod)}
          icon={<CreditCard className="h-5 w-5 text-purple-500" />}
        />
        <SummaryCard
          label="등록 문서"
          value={`${member.documents.length}건`}
          icon={<FileText className="h-5 w-5 text-orange-500" />}
        />
      </div>

      {/* 탭 컨텐츠 */}
      <MemberDetailTabs member={member} />
    </div>
  )
}

function SummaryCard({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-lg border p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
      <div className="p-1.5 sm:p-2 bg-gray-50 rounded-lg">{icon}</div>
      <div className="min-w-0">
        <div className="text-xs sm:text-sm text-gray-500">{label}</div>
        <div className="font-semibold text-sm sm:text-base truncate">{value}</div>
      </div>
    </div>
  )
}

// Helper functions
function getMemberTypeLabel(type: string) {
  switch (type) {
    case 'REGULAR':
      return '정회원'
    case 'ASSOCIATE':
      return '준회원'
    case 'YOUTH':
      return '청소년회원'
    case 'DONOR':
      return '후원회원'
    default:
      return type
  }
}

function getFeeTypeLabel(type: string) {
  switch (type) {
    case 'MONTHLY':
      return '월납'
    case 'ANNUAL':
      return '연납'
    case 'LIFETIME':
      return '평생'
    default:
      return type
  }
}

function getPaymentMethodLabel(method: string) {
  switch (method) {
    case 'CMS':
      return 'CMS 자동이체'
    case 'DIRECT_TRANSFER':
      return '직접입금'
    default:
      return method
  }
}
