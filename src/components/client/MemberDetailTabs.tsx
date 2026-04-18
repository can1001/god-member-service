'use client'

import { useState, useTransition } from 'react'
import {
  Download,
  FileText,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Building,
  CreditCard,
  Receipt,
  AlertCircle,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate, calcAge, formatAmount } from '@/lib/utils'
import { getMemberFees, getMemberDonations } from '@/app/actions/members'
import { revokeBillingKey } from '@/app/actions/payments'
import { toast } from 'sonner'
import { Pagination } from '@/components/client/Pagination'
import { FeeDetailDialog } from '@/components/client/FeeDetailDialog'
import type {
  Member,
  CmsInfo,
  MemberFee,
  Donation,
  MemberDocument,
  BillingKey,
  Payment,
} from '@prisma/client'

type MemberWithDetails = Member & {
  cmsInfo: CmsInfo | null
  billingKey: BillingKey | null
  fees: MemberFee[]
  donations: Donation[]
  documents: MemberDocument[]
  payments: Payment[]
}

interface MemberDetailTabsProps {
  member: MemberWithDetails
}

type Tab = 'info' | 'fees' | 'donations' | 'documents' | 'payments'

export function MemberDetailTabs({ member }: MemberDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>('info')

  const tabs = [
    { id: 'info' as Tab, label: '기본정보' },
    { id: 'fees' as Tab, label: `회비내역 (${member.fees.length})` },
    { id: 'donations' as Tab, label: `후원내역 (${member.donations.length})` },
    { id: 'payments' as Tab, label: `결제내역 (${member.payments?.length || 0})` },
    { id: 'documents' as Tab, label: `문서 (${member.documents.length})` },
  ]

  return (
    <div className="bg-white rounded-lg border">
      {/* 탭 헤더 - 모바일에서 가로 스크롤 */}
      <div className="border-b overflow-x-auto">
        <nav className="flex -mb-px min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 sm:px-6 py-3 sm:py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 탭 컨텐츠 */}
      <div className="p-4 sm:p-6">
        {activeTab === 'info' && <InfoTab member={member} />}
        {activeTab === 'fees' && <FeesTab initialFees={member.fees} memberId={member.id} />}
        {activeTab === 'donations' && (
          <DonationsTab initialDonations={member.donations} memberId={member.id} />
        )}
        {activeTab === 'payments' && <PaymentsTab initialPayments={member.payments || []} />}
        {activeTab === 'documents' && (
          <DocumentsTab documents={member.documents} memberId={member.id} />
        )}
      </div>
    </div>
  )
}

function InfoTab({ member }: { member: MemberWithDetails }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* 기본 정보 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">기본 정보</h3>
        <div className="space-y-3">
          <InfoRow label="이름" value={member.name} />
          <InfoRow
            label="생년월일"
            value={`${formatDate(member.birthDate)} (${calcAge(member.birthDate)}세)`}
            icon={<Calendar className="h-4 w-4 text-gray-400" />}
          />
          <InfoRow label="성별" value={member.gender === 'MALE' ? '남성' : '여성'} />
          <InfoRow
            label="주소"
            value={member.address}
            icon={<MapPin className="h-4 w-4 text-gray-400" />}
          />
        </div>
      </div>

      {/* 연락처 정보 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">연락처 정보</h3>
        <div className="space-y-3">
          <InfoRow
            label="전화번호"
            value={`${member.phone} (SMS ${member.smsConsent ? '동의' : '거부'})`}
            icon={<Phone className="h-4 w-4 text-gray-400" />}
          />
          <InfoRow
            label="이메일"
            value={member.email}
            icon={<Mail className="h-4 w-4 text-gray-400" />}
          />
          {member.church && (
            <InfoRow
              label="소속교회"
              value={`${member.church}${member.position ? ` (${member.position})` : ''}`}
              icon={<Building className="h-4 w-4 text-gray-400" />}
            />
          )}
        </div>
      </div>

      {/* 회원 정보 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">회원 정보</h3>
        <div className="space-y-3">
          <InfoRow
            label="회원 구분"
            value={getMemberTypeLabel(member.memberType)}
            badge={getMemberTypeBadge(member.memberType)}
          />
          <InfoRow
            label="회비 유형"
            value={getFeeTypeLabel(member.feeType)}
            badge={getFeeTypeBadge(member.feeType)}
          />
          <InfoRow label="납부 방법" value={getPaymentMethodLabel(member.paymentMethod)} />
          <InfoRow label="가입일" value={formatDate(member.joinDate)} />
          <InfoRow
            label="상태"
            value={member.isActive ? '활성' : '비활성'}
            badge={member.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
          />
        </div>
      </div>

      {/* CMS 정보 */}
      {member.cmsInfo && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">CMS 자동이체 정보</h3>
          <div className="space-y-3">
            <InfoRow label="은행" value={member.cmsInfo.bankName} />
            <InfoRow label="계좌번호" value={member.cmsInfo.accountNo} />
            <InfoRow label="예금주" value={member.cmsInfo.accountHolder} />
            <InfoRow label="이체금액" value={formatAmount(member.cmsInfo.scheduledAmount)} />
            <InfoRow label="이체일" value={`매월 ${member.cmsInfo.withdrawDay}일`} />
          </div>
        </div>
      )}

      {/* 등록 카드 정보 (BILLING) */}
      {member.paymentMethod === 'BILLING' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            등록된 카드 (정기결제)
          </h3>
          {member.billingKey && member.billingKey.isActive ? (
            <div className="space-y-3">
              <InfoRow label="카드사" value={member.billingKey.cardCompany} />
              <InfoRow label="카드번호" value={member.billingKey.cardNumber} />
              <InfoRow
                label="카드유형"
                value={member.billingKey.cardType === 'CREDIT' ? '신용카드' : '체크카드'}
              />
              <InfoRow label="등록일" value={formatDate(member.billingKey.authenticatedAt)} />
              <div className="pt-2">
                <BillingKeyActions memberId={member.id} />
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <AlertCircle className="h-10 w-10 mx-auto mb-3 text-yellow-500" />
              <p className="text-gray-600 mb-4">등록된 카드가 없습니다.</p>
              <Link href={`/payment/billing?memberId=${member.id}`}>
                <Button>
                  <CreditCard className="h-4 w-4 mr-2" />
                  카드 등록하기
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* 개인정보 동의 */}
      <div className="space-y-4 md:col-span-2">
        <h3 className="text-lg font-semibold border-b pb-2">개인정보 처리 동의</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ConsentBadge label="개인정보 수집·이용" agreed={member.consentPrivacy} />
          <ConsentBadge label="마케팅 활용" agreed={member.consentMarketing} />
          <ConsentBadge label="제3자 제공" agreed={member.consentThirdParty} />
          <InfoRow label="동의일" value={formatDate(member.consentDate)} />
        </div>
      </div>
    </div>
  )
}

function FeesTab({ initialFees, memberId }: { initialFees: MemberFee[]; memberId: number }) {
  const [fees, setFees] = useState(initialFees)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(Math.ceil(initialFees.length / 10) || 1)
  const [isPending, startTransition] = useTransition()
  const [selectedFee, setSelectedFee] = useState<MemberFee | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const loadPage = (newPage: number) => {
    startTransition(async () => {
      const result = await getMemberFees(memberId, newPage, 10)
      if (result.success && result.data) {
        setFees(result.data.fees)
        setTotalPages(result.data.pagination.totalPages)
        setPage(newPage)
      }
    })
  }

  const handleRowClick = (fee: MemberFee) => {
    setSelectedFee(fee)
    setDialogOpen(true)
  }

  const handleUpdate = () => {
    loadPage(page)
  }

  if (fees.length === 0 && !isPending) {
    return <EmptyState message="회비 내역이 없습니다." />
  }

  if (isPending) {
    return <FeesTabSkeleton />
  }

  return (
    <>
      <div className="space-y-4">
        {/* 데스크톱 테이블 */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  연월
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  금액
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  상태
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  납부일
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {fees.map((fee) => (
                <tr
                  key={fee.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleRowClick(fee)}
                >
                  <td className="px-4 py-3 text-sm">
                    {fee.year}년 {fee.month ? `${fee.month}월` : '연납'}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">{formatAmount(fee.amount)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getFeeStatusBadge(fee.status)}`}
                    >
                      {getFeeStatusLabel(fee.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {fee.paidDate ? formatDate(fee.paidDate) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 모바일 카드 레이아웃 */}
        <div className="md:hidden space-y-3">
          {fees.map((fee) => (
            <div
              key={fee.id}
              className="bg-white rounded-lg border p-4 space-y-2 active:bg-gray-50 cursor-pointer"
              onClick={() => handleRowClick(fee)}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {fee.year}년 {fee.month ? `${fee.month}월` : '연납'}
                </span>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded-full ${getFeeStatusBadge(fee.status)}`}
                >
                  {getFeeStatusLabel(fee.status)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">금액</span>
                <span className="font-medium">{formatAmount(fee.amount)}</span>
              </div>
              {fee.paidDate && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">납부일</span>
                  <span>{formatDate(fee.paidDate)}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={loadPage}
          loading={isPending}
        />
      </div>

      <FeeDetailDialog
        fee={selectedFee}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onUpdate={handleUpdate}
      />
    </>
  )
}

function FeesTabSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="animate-pulse">
          <div className="hidden md:flex items-center gap-4 py-3 border-b">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <div className="md:hidden border rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      ))}
    </div>
  )
}

function DonationsTab({
  initialDonations,
  memberId,
}: {
  initialDonations: Donation[]
  memberId: number
}) {
  const [donations, setDonations] = useState(initialDonations)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(Math.ceil(initialDonations.length / 10) || 1)
  const [isPending, startTransition] = useTransition()

  const loadPage = (newPage: number) => {
    startTransition(async () => {
      const result = await getMemberDonations(memberId, newPage, 10)
      if (result.success && result.data) {
        setDonations(result.data.donations)
        setTotalPages(result.data.pagination.totalPages)
        setPage(newPage)
      }
    })
  }

  if (donations.length === 0 && !isPending) {
    return <EmptyState message="후원 내역이 없습니다." />
  }

  if (isPending) {
    return <DonationsTabSkeleton />
  }

  return (
    <div className="space-y-4">
      {/* 데스크톱 테이블 */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                일자
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                금액
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                목적
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                영수증번호
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {donations.map((donation) => (
              <tr key={donation.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{formatDate(donation.date)}</td>
                <td className="px-4 py-3 text-sm font-medium">{formatAmount(donation.amount)}</td>
                <td className="px-4 py-3 text-sm">{getDonationPurposeLabel(donation.purpose)}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{donation.receiptNo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 모바일 카드 레이아웃 */}
      <div className="md:hidden space-y-3">
        {donations.map((donation) => (
          <div key={donation.id} className="bg-white rounded-lg border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{formatDate(donation.date)}</span>
              <span className="text-lg font-semibold text-green-600">
                {formatAmount(donation.amount)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">목적</span>
              <span className="font-medium">{getDonationPurposeLabel(donation.purpose)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">영수증번호</span>
              <span className="font-mono text-xs text-gray-600">{donation.receiptNo}</span>
            </div>
          </div>
        ))}
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={loadPage}
        loading={isPending}
      />
    </div>
  )
}

function DonationsTabSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="animate-pulse">
          <div className="hidden md:flex items-center gap-4 py-3 border-b">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-28" />
          </div>
          <div className="md:hidden border rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-20" />
            </div>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
      ))}
    </div>
  )
}

function DocumentsTab({
  documents,
  memberId: _memberId,
}: {
  documents: MemberDocument[]
  memberId: number
}) {
  if (documents.length === 0) {
    return <EmptyState message="등록된 문서가 없습니다." />
  }

  const handleDownload = async (docId: number, fileName: string) => {
    try {
      const response = await fetch(`/api/documents/${docId}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {documents.map((doc) => (
        <div key={doc.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-gray-100 rounded-lg">
              <FileText className="h-6 w-6 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{doc.fileName}</p>
              <p className="text-xs text-gray-500">{getDocumentTypeLabel(doc.documentType)}</p>
              <p className="text-xs text-gray-400">{formatDate(doc.uploadedAt)}</p>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => handleDownload(doc.id, doc.fileName)}
            >
              <Download className="h-4 w-4 mr-1" />
              다운로드
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}

// UI Components
function InfoRow({
  label,
  value,
  icon,
  badge,
}: {
  label: string
  value: string
  icon?: React.ReactNode
  badge?: string
}) {
  return (
    <div className="flex items-center gap-3">
      {icon && icon}
      <div className="w-24 text-sm text-gray-500">{label}</div>
      {badge ? (
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${badge}`}>{value}</span>
      ) : (
        <div className="font-medium">{value}</div>
      )}
    </div>
  )
}

function ConsentBadge({ label, agreed }: { label: string; agreed: boolean }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm text-gray-500">{label}</span>
      <span
        className={`px-2 py-1 text-xs font-semibold rounded-full text-center ${agreed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
      >
        {agreed ? '동의' : '거부'}
      </span>
    </div>
  )
}

function BillingKeyActions({ memberId }: { memberId: number }) {
  const [isPending, startTransition] = useTransition()

  const handleRevoke = () => {
    if (!confirm('등록된 카드를 해지하시겠습니까?\n해지 후 직접입금으로 변경됩니다.')) return

    startTransition(async () => {
      const result = await revokeBillingKey(memberId)
      if (result.success) {
        toast.success('카드가 해지되었습니다.')
        window.location.reload()
      } else {
        toast.error(result.error || '카드 해지에 실패했습니다.')
      }
    })
  }

  return (
    <div className="flex gap-2">
      <Link href={`/payment/billing?memberId=${memberId}`}>
        <Button variant="outline" size="sm">
          <CreditCard className="h-4 w-4 mr-1" />
          카드 변경
        </Button>
      </Link>
      <Button variant="outline" size="sm" onClick={handleRevoke} disabled={isPending}>
        {isPending ? '처리 중...' : '카드 해지'}
      </Button>
    </div>
  )
}

function PaymentsTab({ initialPayments }: { initialPayments: Payment[] }) {
  const [payments] = useState(initialPayments)

  if (payments.length === 0) {
    return <EmptyState message="결제 내역이 없습니다." />
  }

  return (
    <div className="space-y-4">
      {/* 데스크톱 테이블 */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                결제일
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                금액
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                결제수단
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                상태
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                영수증
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.map((payment) => (
              <tr key={payment.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">
                  {payment.approvedAt
                    ? formatDate(payment.approvedAt)
                    : formatDate(payment.createdAt)}
                </td>
                <td className="px-4 py-3 text-sm font-medium">{formatAmount(payment.amount)}</td>
                <td className="px-4 py-3 text-sm">
                  <div>
                    <span>{getPaymentMethodLabel(payment.method)}</span>
                    {payment.cardCompany && (
                      <span className="text-xs text-gray-500 block">
                        {payment.cardCompany} {payment.cardNumber}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusBadge(payment.status)}`}
                  >
                    {getPaymentStatusLabel(payment.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm">
                  {payment.receiptUrl ? (
                    <a
                      href={payment.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Receipt className="h-4 w-4" />
                      영수증
                    </a>
                  ) : (
                    '-'
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 모바일 카드 레이아웃 */}
      <div className="md:hidden space-y-3">
        {payments.map((payment) => (
          <div key={payment.id} className="bg-white rounded-lg border p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {payment.approvedAt
                  ? formatDate(payment.approvedAt)
                  : formatDate(payment.createdAt)}
              </span>
              <span
                className={`px-2 py-1 text-xs font-semibold rounded-full ${getPaymentStatusBadge(payment.status)}`}
              >
                {getPaymentStatusLabel(payment.status)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">{getPaymentMethodLabel(payment.method)}</span>
              <span className="text-lg font-semibold">{formatAmount(payment.amount)}</span>
            </div>
            {payment.cardCompany && (
              <div className="text-xs text-gray-500">
                {payment.cardCompany} {payment.cardNumber}
              </div>
            )}
            {payment.receiptUrl && (
              <a
                href={payment.receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:underline flex items-center gap-1"
              >
                <Receipt className="h-4 w-4" />
                영수증 보기
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 text-gray-500">
      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
      <p>{message}</p>
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

function getMemberTypeBadge(type: string) {
  switch (type) {
    case 'REGULAR':
      return 'bg-blue-100 text-blue-800'
    case 'ASSOCIATE':
      return 'bg-green-100 text-green-800'
    case 'YOUTH':
      return 'bg-purple-100 text-purple-800'
    case 'DONOR':
      return 'bg-orange-100 text-orange-800'
    default:
      return 'bg-gray-100 text-gray-800'
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

function getFeeTypeBadge(type: string) {
  switch (type) {
    case 'MONTHLY':
      return 'bg-orange-100 text-orange-800'
    case 'ANNUAL':
      return 'bg-indigo-100 text-indigo-800'
    case 'LIFETIME':
      return 'bg-yellow-100 text-yellow-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getPaymentMethodLabel(method: string) {
  switch (method) {
    case 'CMS':
      return 'CMS 자동이체'
    case 'DIRECT_TRANSFER':
      return '직접입금'
    case 'BILLING':
      return '카드 정기결제'
    case 'CARD':
      return '신용/체크카드'
    case 'KAKAO_PAY':
      return '카카오페이'
    case 'NAVER_PAY':
      return '네이버페이'
    case 'TOSS_PAY':
      return '토스페이'
    case 'PHONE':
      return '휴대폰 결제'
    default:
      return method
  }
}

function getFeeStatusLabel(status: string) {
  switch (status) {
    case 'PAID':
      return '납부완료'
    case 'UNPAID':
      return '미납'
    case 'EXEMPT':
      return '면제'
    default:
      return status
  }
}

function getFeeStatusBadge(status: string) {
  switch (status) {
    case 'PAID':
      return 'bg-green-100 text-green-800'
    case 'UNPAID':
      return 'bg-red-100 text-red-800'
    case 'EXEMPT':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getPaymentStatusLabel(status: string) {
  switch (status) {
    case 'PENDING':
      return '대기'
    case 'APPROVED':
      return '승인'
    case 'FAILED':
      return '실패'
    case 'CANCELED':
      return '취소'
    case 'REFUNDED':
      return '환불'
    default:
      return status
  }
}

function getPaymentStatusBadge(status: string) {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800'
    case 'APPROVED':
      return 'bg-green-100 text-green-800'
    case 'FAILED':
      return 'bg-red-100 text-red-800'
    case 'CANCELED':
      return 'bg-gray-100 text-gray-800'
    case 'REFUNDED':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

function getDonationPurposeLabel(purpose: string) {
  switch (purpose) {
    case 'GENERAL':
      return '일반기금'
    case 'SCHOLARSHIP':
      return '장학금'
    case 'OPERATION':
      return '운영비'
    case 'WELFARE':
      return '복지사업'
    case 'PROGRAM':
      return '프로그램'
    default:
      return purpose
  }
}

function getDocumentTypeLabel(type: string) {
  switch (type) {
    case 'APPLICATION':
      return '가입신청서'
    case 'ID_CARD':
      return '신분증'
    case 'CMS_CONSENT':
      return 'CMS동의서'
    case 'PRIVACY_CONSENT':
      return '개인정보동의서'
    case 'OTHER':
      return '기타'
    default:
      return type
  }
}
