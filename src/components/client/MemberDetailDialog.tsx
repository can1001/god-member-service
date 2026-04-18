'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Eye,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Building,
  Check,
  X,
  FileText,
  Download,
} from 'lucide-react'
import { formatDate, calcAge, formatAmount } from '@/lib/utils'
import {
  getMemberBasicInfo,
  getMemberFees,
  getMemberDonations,
  getMemberDocuments,
} from '@/app/actions/members'
import { Pagination } from '@/components/client/Pagination'
import type { Member, CmsInfo, MemberFee, Donation, MemberDocument } from '@prisma/client'

type MemberBasicInfo = Member & {
  cmsInfo: CmsInfo | null
}

type Tab = 'info' | 'fees' | 'donations' | 'documents'

interface MemberDetailDialogProps {
  memberId: number
  memberName: string
}

export function MemberDetailDialog({ memberId, memberName: _memberName }: MemberDetailDialogProps) {
  const [member, setMember] = useState<MemberBasicInfo | null>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('info')

  // 탭별 데이터 상태
  const [fees, setFees] = useState<MemberFee[]>([])
  const [feesPage, setFeesPage] = useState(1)
  const [feesTotalPages, setFeesTotalPages] = useState(1)
  const [feesLoaded, setFeesLoaded] = useState(false)

  const [donations, setDonations] = useState<Donation[]>([])
  const [donationsPage, setDonationsPage] = useState(1)
  const [donationsTotalPages, setDonationsTotalPages] = useState(1)
  const [donationsLoaded, setDonationsLoaded] = useState(false)

  const [documents, setDocuments] = useState<MemberDocument[]>([])
  const [documentsPage, setDocumentsPage] = useState(1)
  const [documentsTotalPages, setDocumentsTotalPages] = useState(1)
  const [documentsLoaded, setDocumentsLoaded] = useState(false)

  const [isPending, startTransition] = useTransition()

  // 모달 열기 - 기본 정보만 로드 (빠름)
  const handleOpen = async () => {
    setLoading(true)
    try {
      const result = await getMemberBasicInfo(memberId)
      if (result.success && result.data) {
        setMember(result.data)
        setOpen(true)
        // 탭 상태 초기화
        setActiveTab('info')
        setFeesLoaded(false)
        setDonationsLoaded(false)
        setDocumentsLoaded(false)
      }
    } catch (error) {
      console.error('Error loading member detail:', error)
    } finally {
      setLoading(false)
    }
  }

  // 탭 전환 핸들러
  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)

    if (tab === 'fees' && !feesLoaded) {
      loadFees(1)
    } else if (tab === 'donations' && !donationsLoaded) {
      loadDonations(1)
    } else if (tab === 'documents' && !documentsLoaded) {
      loadDocuments(1)
    }
  }

  // 회비 로드
  const loadFees = (page: number) => {
    startTransition(async () => {
      const result = await getMemberFees(memberId, page, 10)
      if (result.success && result.data) {
        setFees(result.data.fees)
        setFeesPage(page)
        setFeesTotalPages(result.data.pagination.totalPages)
        setFeesLoaded(true)
      }
    })
  }

  // 후원금 로드
  const loadDonations = (page: number) => {
    startTransition(async () => {
      const result = await getMemberDonations(memberId, page, 10)
      if (result.success && result.data) {
        setDonations(result.data.donations)
        setDonationsPage(page)
        setDonationsTotalPages(result.data.pagination.totalPages)
        setDonationsLoaded(true)
      }
    })
  }

  // 문서 로드
  const loadDocuments = (page: number) => {
    startTransition(async () => {
      const result = await getMemberDocuments(memberId, page, 10)
      if (result.success && result.data) {
        setDocuments(result.data.documents)
        setDocumentsPage(page)
        setDocumentsTotalPages(result.data.pagination.totalPages)
        setDocumentsLoaded(true)
      }
    })
  }

  const tabs = [
    { id: 'info' as Tab, label: '기본정보' },
    { id: 'fees' as Tab, label: '회비' },
    { id: 'donations' as Tab, label: '후원' },
    { id: 'documents' as Tab, label: '문서' },
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            size="sm"
            variant="outline"
            className="p-2"
            onClick={handleOpen}
            disabled={loading}
          />
        }
      >
        <Eye className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>회원 상세 정보</span>
            {member && <span className="text-sm font-normal text-gray-500">- {member.name}</span>}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : member ? (
          <div className="space-y-4">
            {/* 탭 헤더 */}
            <div className="border-b overflow-x-auto">
              <nav className="flex -mb-px min-w-max">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
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
            <div className="min-h-[300px]">
              {activeTab === 'info' && <InfoTab member={member} />}
              {activeTab === 'fees' && (
                <FeesTab
                  fees={fees}
                  loading={isPending && !feesLoaded}
                  page={feesPage}
                  totalPages={feesTotalPages}
                  onPageChange={loadFees}
                />
              )}
              {activeTab === 'donations' && (
                <DonationsTab
                  donations={donations}
                  loading={isPending && !donationsLoaded}
                  page={donationsPage}
                  totalPages={donationsTotalPages}
                  onPageChange={loadDonations}
                />
              )}
              {activeTab === 'documents' && (
                <DocumentsTab
                  documents={documents}
                  loading={isPending && !documentsLoaded}
                  page={documentsPage}
                  totalPages={documentsTotalPages}
                  onPageChange={loadDocuments}
                />
              )}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

// ─────────────────────────────────────────────────────────────
// 기본정보 탭
// ─────────────────────────────────────────────────────────────
function InfoTab({ member }: { member: MemberBasicInfo }) {
  return (
    <div className="space-y-6">
      {/* 기본 정보 + 연락처 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">기본 정보</h3>
          <div className="space-y-4">
            <InfoRow
              label="이름"
              value={member.name}
              subValue={member.gender === 'MALE' ? '남성' : '여성'}
            />
            <InfoRow
              icon={<Calendar className="h-4 w-4" />}
              label="생년월일"
              value={`${formatDate(member.birthDate)} (${calcAge(member.birthDate)}세)`}
            />
            <InfoRow
              icon={<MapPin className="h-4 w-4" />}
              label="주소"
              value={member.address || <EmptyValue text="주소 정보 없음" />}
            />
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">연락처 정보</h3>
          <div className="space-y-4">
            <InfoRow
              icon={<Phone className="h-4 w-4" />}
              label="전화번호"
              value={member.phone || <EmptyValue />}
              subValue={`SMS 수신 ${member.smsConsent ? '동의' : '거부'}`}
            />
            <InfoRow
              icon={<Mail className="h-4 w-4" />}
              label="이메일"
              value={member.email || <EmptyValue />}
            />
            <InfoRow
              icon={<Building className="h-4 w-4" />}
              label="소속교회"
              value={member.church || <EmptyValue text="소속교회 없음" />}
              subValue={member.position || undefined}
            />
          </div>
        </div>
      </div>

      {/* 회원 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">회원 정보</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">회원 구분</span>
              <span
                className={`px-2 py-1 text-xs font-semibold rounded-full ${getMemberTypeBadge(member.memberType)}`}
              >
                {getMemberTypeLabel(member.memberType)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">회비 유형</span>
              <span
                className={`px-2 py-1 text-xs font-semibold rounded-full ${getFeeTypeBadge(member.feeType)}`}
              >
                {getFeeTypeLabel(member.feeType)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">납부 방법</span>
              <span
                className={`px-2 py-1 text-xs font-semibold rounded-full ${getPaymentMethodBadge(member.paymentMethod)}`}
              >
                {getPaymentMethodLabel(member.paymentMethod)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">가입일</span>
              <span>{formatDate(member.joinDate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">상태</span>
              <span
                className={`px-2 py-1 text-xs font-semibold rounded-full ${member.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
              >
                {member.isActive ? '활성' : '비활성'}
              </span>
            </div>
          </div>
        </div>

        {/* CMS 정보 */}
        {member.cmsInfo && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold border-b pb-2">CMS 자동이체 정보</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">은행</span>
                <span>{member.cmsInfo.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">계좌번호</span>
                <span>{member.cmsInfo.accountNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">예금주</span>
                <span>{member.cmsInfo.accountHolder}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">이체금액</span>
                <span>{formatAmount(member.cmsInfo.scheduledAmount)}원</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">이체일</span>
                <span>매월 {member.cmsInfo.withdrawDay}일</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 개인정보 동의 정보 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">개인정보 처리 동의</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
            <div>
              <ConsentItem label="개인정보 수집·이용" agreed={member.consentPrivacy} />
              <ConsentItem label="마케팅 활용" agreed={member.consentMarketing} />
            </div>
            <div>
              <ConsentItem label="제3자 제공" agreed={member.consentThirdParty} />
              <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                <span className="text-sm text-gray-600">동의일</span>
                <span className="text-sm font-medium">{formatDate(member.consentDate)}</span>
              </div>
            </div>
          </div>
          {member.consentMarketing && member.marketingChannel && (
            <div className="mt-2 pt-2 border-t border-gray-200 text-sm text-gray-600">
              마케팅 수신 채널:{' '}
              <span className="font-medium">
                {getMarketingChannelLabel(member.marketingChannel)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// 회비 탭
// ─────────────────────────────────────────────────────────────
interface FeesTabProps {
  fees: MemberFee[]
  loading: boolean
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

function FeesTab({ fees, loading, page, totalPages, onPageChange }: FeesTabProps) {
  if (loading) {
    return <TabSkeleton />
  }

  if (fees.length === 0) {
    return <EmptyState message="회비 내역이 없습니다." />
  }

  return (
    <div className="space-y-4">
      {/* 모바일 카드 레이아웃 */}
      <div className="md:hidden space-y-2">
        {fees.map((fee) => (
          <div key={fee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-sm">
                {fee.year}년 {fee.month ? `${fee.month}월` : '연납'}
              </div>
              <div className="text-xs text-gray-500">
                {fee.paidDate ? formatDate(fee.paidDate) : '미납'}
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium text-sm">{formatAmount(fee.amount)}원</div>
              <span
                className={`inline-block mt-1 px-2 py-0.5 text-xs font-semibold rounded-full ${getFeeStatusBadge(fee.status)}`}
              >
                {getFeeStatusLabel(fee.status)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 데스크톱 테이블 레이아웃 */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                연월
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                금액
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                상태
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                납부일
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {fees.map((fee) => (
              <tr key={fee.id}>
                <td className="px-4 py-2 text-sm">
                  {fee.year}년 {fee.month ? `${fee.month}월` : '연납'}
                </td>
                <td className="px-4 py-2 text-sm font-medium">{formatAmount(fee.amount)}원</td>
                <td className="px-4 py-2">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${getFeeStatusBadge(fee.status)}`}
                  >
                    {getFeeStatusLabel(fee.status)}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm text-gray-500">
                  {fee.paidDate ? formatDate(fee.paidDate) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={onPageChange} />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// 후원 탭
// ─────────────────────────────────────────────────────────────
interface DonationsTabProps {
  donations: Donation[]
  loading: boolean
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

function DonationsTab({ donations, loading, page, totalPages, onPageChange }: DonationsTabProps) {
  if (loading) {
    return <TabSkeleton />
  }

  if (donations.length === 0) {
    return <EmptyState message="후원 내역이 없습니다." />
  }

  return (
    <div className="space-y-4">
      {/* 모바일 카드 레이아웃 */}
      <div className="md:hidden space-y-2">
        {donations.map((donation) => (
          <div
            key={donation.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div>
              <div className="font-medium text-sm">{formatDate(donation.date)}</div>
              <div className="text-xs text-gray-500">
                {getDonationPurposeLabel(donation.purpose)}
              </div>
            </div>
            <div className="text-right">
              <div className="font-medium text-sm">{formatAmount(donation.amount)}원</div>
              <div className="text-xs text-gray-500">{donation.receiptNo}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 데스크톱 테이블 레이아웃 */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                일자
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                금액
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                목적
              </th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                영수증번호
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {donations.map((donation) => (
              <tr key={donation.id}>
                <td className="px-4 py-2 text-sm">{formatDate(donation.date)}</td>
                <td className="px-4 py-2 text-sm font-medium">{formatAmount(donation.amount)}원</td>
                <td className="px-4 py-2 text-sm">{getDonationPurposeLabel(donation.purpose)}</td>
                <td className="px-4 py-2 text-sm text-gray-500">{donation.receiptNo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={onPageChange} />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// 문서 탭
// ─────────────────────────────────────────────────────────────
interface DocumentsTabProps {
  documents: MemberDocument[]
  loading: boolean
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

function DocumentsTab({ documents, loading, page, totalPages, onPageChange }: DocumentsTabProps) {
  if (loading) {
    return <TabSkeleton />
  }

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
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documents.map((doc) => (
          <div key={doc.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <FileText className="h-6 w-6 text-gray-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{doc.originalName}</p>
                <p className="text-xs text-gray-500">{getDocumentTypeLabel(doc.documentType)}</p>
                <p className="text-xs text-gray-400">{formatDate(doc.uploadedAt)}</p>
              </div>
            </div>
            <div className="mt-3">
              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => handleDownload(doc.id, doc.originalName)}
              >
                <Download className="h-4 w-4 mr-1" />
                다운로드
              </Button>
            </div>
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} onPageChange={onPageChange} />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// 공통 컴포넌트
// ─────────────────────────────────────────────────────────────
function InfoRow({
  icon,
  label,
  value,
  subValue,
}: {
  icon?: React.ReactNode
  label: string
  value: React.ReactNode
  subValue?: string
}) {
  return (
    <div className="flex items-start gap-3">
      {icon && <div className="mt-0.5 text-gray-400 flex-shrink-0">{icon}</div>}
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-500">{label}</div>
        <div className="font-medium break-words">{value}</div>
        {subValue && <div className="text-xs text-gray-500">{subValue}</div>}
      </div>
    </div>
  )
}

function ConsentItem({ label, agreed }: { label: string; agreed: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
      <span className="text-sm text-gray-600">{label}</span>
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${
          agreed
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}
      >
        {agreed ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
        {agreed ? '동의' : '거부'}
      </span>
    </div>
  )
}

function EmptyValue({ text = '정보 없음' }: { text?: string }) {
  return <span className="text-gray-400 italic">{text}</span>
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-12 text-gray-500">
      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
      <p>{message}</p>
    </div>
  )
}

function TabSkeleton() {
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

// ─────────────────────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────────────────────
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
    default:
      return method
  }
}

function getPaymentMethodBadge(method: string) {
  switch (method) {
    case 'CMS':
      return 'bg-blue-100 text-blue-800'
    case 'DIRECT_TRANSFER':
      return 'bg-gray-100 text-gray-800'
    default:
      return 'bg-gray-100 text-gray-800'
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
    case 'REGISTRATION_FORM':
      return '회원등록신청서'
    case 'GOOGLE_FORM_RESPONSE':
      return 'Google Forms 응답'
    case 'WEBSITE_SUBMISSION':
      return '홈페이지 신청서'
    case 'PAPER_FORM':
      return '서면 신청서'
    case 'CONSENT_FORM':
      return '동의서'
    case 'ID_COPY':
      return '신분증 사본'
    case 'OTHER':
      return '기타'
    default:
      return type
  }
}

function getMarketingChannelLabel(channel: string) {
  switch (channel) {
    case 'SMS':
      return '문자'
    case 'EMAIL':
      return '이메일'
    case 'BOTH':
      return '문자+이메일'
    default:
      return channel
  }
}
