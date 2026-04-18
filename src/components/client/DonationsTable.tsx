'use client'

import { useState, useTransition } from 'react'
import { formatAmount, formatDate } from '@/lib/utils'
import { Edit, Trash2, Loader2, Gift, Building2, User, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DonationDialog } from '@/components/client/DonationDialog'
import { deleteDonation } from '@/app/actions/donations'
import { toast } from 'sonner'

interface Donation {
  id: number
  receiptNo: string
  donorName: string
  donorType: string
  amount: number
  date: Date
  purpose: string
  note: string | null
  memberId: number | null
  member: {
    name: string
    memberType: string
    email: string
  } | null
}

interface DonationsTableProps {
  donations: Donation[]
}

export function DonationsTable({ donations }: DonationsTableProps) {
  const [isPending, startTransition] = useTransition()
  const [deletingIds, setDeletingIds] = useState<Set<number>>(new Set())

  const totalAmount = donations.reduce((sum, donation) => sum + donation.amount, 0)
  const thisMonthDonations = donations.filter((donation) => {
    const donationMonth = new Date(donation.date).getMonth()
    const currentMonth = new Date().getMonth()
    return donationMonth === currentMonth
  })
  const thisMonthAmount = thisMonthDonations.reduce((sum, donation) => sum + donation.amount, 0)

  const handlePrintReceipt = (donationId: number) => {
    const url = `/api/certificates/donation-receipt/${donationId}`
    window.open(url, '_blank')
  }

  const handleDelete = async (donationId: number) => {
    if (!confirm('정말로 이 후원금 내역을 삭제하시겠습니까?')) {
      return
    }

    setDeletingIds((prev) => new Set(prev).add(donationId))

    startTransition(async () => {
      try {
        const result = await deleteDonation(donationId)
        if (result.success) {
          toast.success('후원금 내역이 삭제되었습니다.')
        } else {
          toast.error(result.error || '삭제에 실패했습니다.')
        }
      } catch {
        toast.error('삭제 중 오류가 발생했습니다.')
      } finally {
        setDeletingIds((prev) => {
          const newSet = new Set(prev)
          newSet.delete(donationId)
          return newSet
        })
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="px-6 py-4 bg-gray-50 border-b">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{donations.length}</div>
            <div className="text-sm text-gray-600">총 건수</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{formatAmount(totalAmount)}</div>
            <div className="text-sm text-gray-600">총 후원금액</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{formatAmount(thisMonthAmount)}</div>
            <div className="text-sm text-gray-600">이번 달 후원금</div>
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                영수증 번호
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                후원자 정보
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                금액
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                후원일
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                목적
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                비고
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                관리
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {donations.map((donation) => (
              <tr key={donation.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-mono font-medium text-gray-900">
                    {donation.receiptNo}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <div className="flex-shrink-0">{getDonorTypeIcon(donation.donorType)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {donation.donorName}
                      </div>
                      <div className="text-sm text-gray-500">
                        <Badge variant="outline" className={getDonorTypeBadge(donation.donorType)}>
                          {getDonorTypeLabel(donation.donorType)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatAmount(donation.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(donation.date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant="outline" className={getPurposeBadge(donation.purpose)}>
                    {getPurposeLabel(donation.purpose)}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="max-w-32 truncate" title={donation.note || ''}>
                    {donation.note || '-'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    <DonationDialog donation={donation}>
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3" />
                      </Button>
                    </DonationDialog>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(donation.id)}
                      disabled={deletingIds.has(donation.id) || isPending}
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      {deletingIds.has(donation.id) ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="lg:hidden space-y-4">
        {donations.map((donation) => (
          <div key={donation.id} className="bg-white rounded-lg border border-gray-200 p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {getDonorTypeIcon(donation.donorType)}
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{donation.donorName}</h3>
                  <Badge variant="outline" className={getDonorTypeBadge(donation.donorType)}>
                    {getDonorTypeLabel(donation.donorType)}
                  </Badge>
                </div>
              </div>
              <Badge variant="outline" className={getPurposeBadge(donation.purpose)}>
                {getPurposeLabel(donation.purpose)}
              </Badge>
            </div>

            {/* Details */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">영수증 번호</span>
                <span className="font-mono text-gray-900">{donation.receiptNo}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">후원금액</span>
                <span className="text-lg font-medium text-gray-900">
                  {formatAmount(donation.amount)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">후원일</span>
                <span className="text-gray-900">{formatDate(donation.date)}</span>
              </div>
              {donation.note && (
                <div className="flex items-start justify-between text-sm">
                  <span className="text-gray-500">비고</span>
                  <span className="text-gray-900 text-right max-w-48 break-words">
                    {donation.note}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handlePrintReceipt(donation.id)}
                className="flex-1 text-blue-600 hover:text-blue-700 hover:border-blue-300"
              >
                <FileText className="h-3 w-3 mr-2" />
                영수증
              </Button>
              <DonationDialog donation={donation}>
                <Button size="sm" variant="outline" className="flex-1">
                  <Edit className="h-3 w-3 mr-2" />
                  수정
                </Button>
              </DonationDialog>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleDelete(donation.id)}
                disabled={deletingIds.has(donation.id) || isPending}
                className="flex-1 text-red-600 hover:text-red-700 hover:border-red-300"
              >
                {deletingIds.has(donation.id) ? (
                  <>
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                    삭제 중...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3 w-3 mr-2" />
                    삭제
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function getDonorTypeLabel(type: string) {
  switch (type) {
    case 'MEMBER':
      return '회원'
    case 'INDIVIDUAL':
      return '개인'
    case 'CORPORATE':
      return '법인'
    default:
      return type
  }
}

function getDonorTypeBadge(type: string) {
  switch (type) {
    case 'MEMBER':
      return 'border-blue-200 text-blue-800 bg-blue-50'
    case 'INDIVIDUAL':
      return 'border-green-200 text-green-800 bg-green-50'
    case 'CORPORATE':
      return 'border-purple-200 text-purple-800 bg-purple-50'
    default:
      return 'border-gray-200 text-gray-800 bg-gray-50'
  }
}

function getDonorTypeIcon(type: string) {
  switch (type) {
    case 'MEMBER':
      return <User className="h-4 w-4 text-blue-600" />
    case 'INDIVIDUAL':
      return <Gift className="h-4 w-4 text-green-600" />
    case 'CORPORATE':
      return <Building2 className="h-4 w-4 text-purple-600" />
    default:
      return <Gift className="h-4 w-4 text-gray-600" />
  }
}

function getPurposeLabel(purpose: string) {
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

function getPurposeBadge(purpose: string) {
  switch (purpose) {
    case 'GENERAL':
      return 'border-gray-200 text-gray-800 bg-gray-50'
    case 'SCHOLARSHIP':
      return 'border-yellow-200 text-yellow-800 bg-yellow-50'
    case 'OPERATION':
      return 'border-indigo-200 text-indigo-800 bg-indigo-50'
    case 'WELFARE':
      return 'border-pink-200 text-pink-800 bg-pink-50'
    case 'PROGRAM':
      return 'border-orange-200 text-orange-800 bg-orange-50'
    default:
      return 'border-gray-200 text-gray-800 bg-gray-50'
  }
}
