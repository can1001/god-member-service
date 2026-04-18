'use client'

import { useState, useTransition } from 'react'
import { formatAmount, formatDate } from '@/lib/utils'
import { CheckCircle, X, AlertCircle, Loader2, FileText, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { markFeePaid, markFeeUnpaid, bulkMarkFeesPaid } from '@/app/actions/fees'
import { toast } from 'sonner'

interface Fee {
  id: number
  year: number
  month: number | null
  feeType: string
  amount: number
  status: string
  paidDate: Date | null
  member: {
    id: number
    name: string
    memberType: string
    email: string
  }
}

interface FeesTableProps {
  fees: Fee[]
}

export function FeesTable({ fees }: FeesTableProps) {
  const [selectedFees, setSelectedFees] = useState<Set<number>>(new Set())
  const [isPending, startTransition] = useTransition()
  const [processingFees, setProcessingFees] = useState<Set<number>>(new Set())

  const totalAmount = fees.reduce((sum, fee) => sum + fee.amount, 0)
  const paidAmount = fees
    .filter((fee) => fee.status === 'PAID')
    .reduce((sum, fee) => sum + fee.amount, 0)
  const unpaidCount = fees.filter((fee) => fee.status === 'UNPAID').length

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const unpaidFeeIds = fees.filter((fee) => fee.status === 'UNPAID').map((fee) => fee.id)
      setSelectedFees(new Set(unpaidFeeIds))
    } else {
      setSelectedFees(new Set())
    }
  }

  const handleSelectFee = (feeId: number, checked: boolean) => {
    const newSelected = new Set(selectedFees)
    if (checked) {
      newSelected.add(feeId)
    } else {
      newSelected.delete(feeId)
    }
    setSelectedFees(newSelected)
  }

  const handleMarkPaid = async (feeId: number) => {
    setProcessingFees((prev) => new Set(prev).add(feeId))

    startTransition(async () => {
      try {
        const result = await markFeePaid(feeId)
        if (result.success) {
          toast.success('납부 처리가 완료되었습니다.')
        } else {
          toast.error(result.error || '납부 처리에 실패했습니다.')
        }
      } catch {
        toast.error('납부 처리 중 오류가 발생했습니다.')
      } finally {
        setProcessingFees((prev) => {
          const newSet = new Set(prev)
          newSet.delete(feeId)
          return newSet
        })
      }
    })
  }

  const handleMarkUnpaid = async (feeId: number) => {
    setProcessingFees((prev) => new Set(prev).add(feeId))

    startTransition(async () => {
      try {
        const result = await markFeeUnpaid(feeId)
        if (result.success) {
          toast.success('납부 취소가 완료되었습니다.')
        } else {
          toast.error(result.error || '납부 취소에 실패했습니다.')
        }
      } catch {
        toast.error('납부 취소 중 오류가 발생했습니다.')
      } finally {
        setProcessingFees((prev) => {
          const newSet = new Set(prev)
          newSet.delete(feeId)
          return newSet
        })
      }
    })
  }

  const handlePrintFeeReceipt = (feeId: number) => {
    const url = `/api/certificates/fee-receipt/${feeId}`
    window.open(url, '_blank')
  }

  const handleBulkPayment = async () => {
    if (selectedFees.size === 0) {
      toast.error('처리할 항목을 선택해주세요.')
      return
    }

    startTransition(async () => {
      try {
        const formData = new FormData()
        selectedFees.forEach((feeId) => {
          formData.append('feeIds', feeId.toString())
        })
        formData.append('paymentMethod', 'DIRECT_TRANSFER')

        const result = await bulkMarkFeesPaid(formData)
        if (result.success) {
          toast.success(`${result.data?.processedCount}건의 납부 처리가 완료되었습니다.`)
          setSelectedFees(new Set())
        } else {
          toast.error(result.error || '일괄 처리에 실패했습니다.')
        }
      } catch {
        toast.error('일괄 처리 중 오류가 발생했습니다.')
      }
    })
  }

  const isAllSelected =
    fees.filter((fee) => fee.status === 'UNPAID').length > 0 &&
    fees.filter((fee) => fee.status === 'UNPAID').every((fee) => selectedFees.has(fee.id))

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="px-6 py-4 bg-gray-50 border-b">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{fees.length}</div>
            <div className="text-sm text-gray-600">총 건수</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{formatAmount(totalAmount)}</div>
            <div className="text-sm text-gray-600">총 금액</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{formatAmount(paidAmount)}</div>
            <div className="text-sm text-gray-600">납부 완료</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{unpaidCount}</div>
            <div className="text-sm text-gray-600">미납 건수</div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedFees.size > 0 && (
        <div className="px-6 py-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-800">
              {selectedFees.size}개 항목 선택됨
            </span>
            <Button size="sm" onClick={handleBulkPayment} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  처리 중...
                </>
              ) : (
                '선택 항목 일괄 납부 처리'
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <input
                  type="checkbox"
                  className="rounded"
                  checked={isAllSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                회원 정보
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                기간
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                회비 유형
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                금액
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                납부 상태
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                납부일
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                관리
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {fees.map((fee) => (
              <tr key={fee.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={selectedFees.has(fee.id)}
                    onChange={(e) => handleSelectFee(fee.id, e.target.checked)}
                    disabled={fee.status !== 'UNPAID'}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-col">
                    <div className="text-sm font-medium text-gray-900">{fee.member.name}</div>
                    <div className="text-sm text-gray-500">
                      {getMemberTypeLabel(fee.member.memberType)}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {fee.feeType === 'MONTHLY'
                    ? `${fee.year}년 ${fee.month}월`
                    : fee.feeType === 'ANNUAL'
                      ? `${fee.year}년`
                      : '평생'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant="outline" className={getFeeTypeBadge(fee.feeType)}>
                    {getFeeTypeLabel(fee.feeType)}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatAmount(fee.amount)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <Badge variant="outline" className={getStatusBadge(fee.status)}>
                    {getStatusIcon(fee.status)}
                    {getStatusLabel(fee.status)}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {fee.paidDate ? formatDate(fee.paidDate) : '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-2">
                    {fee.status === 'UNPAID' && (
                      <>
                        <Link href={`/payment?memberId=${fee.member.id}&feeId=${fee.id}`}>
                          <Button size="sm" variant="default">
                            <CreditCard className="h-3 w-3 mr-1" />
                            결제하기
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMarkPaid(fee.id)}
                          disabled={processingFees.has(fee.id) || isPending}
                        >
                          {processingFees.has(fee.id) ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            '납부 처리'
                          )}
                        </Button>
                      </>
                    )}
                    {fee.status === 'PAID' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleMarkUnpaid(fee.id)}
                        disabled={processingFees.has(fee.id) || isPending}
                      >
                        {processingFees.has(fee.id) ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          '납부 취소'
                        )}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="lg:hidden space-y-4">
        {fees.map((fee) => (
          <div key={fee.id} className="bg-white rounded-lg border border-gray-200 p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-3">
                {fee.status === 'UNPAID' && (
                  <input
                    type="checkbox"
                    className="rounded mt-1"
                    checked={selectedFees.has(fee.id)}
                    onChange={(e) => handleSelectFee(fee.id, e.target.checked)}
                  />
                )}
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">{fee.member.name}</h3>
                  <p className="text-sm text-gray-500">
                    {getMemberTypeLabel(fee.member.memberType)}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className={getStatusBadge(fee.status)}>
                {getStatusIcon(fee.status)}
                {getStatusLabel(fee.status)}
              </Badge>
            </div>

            {/* Details */}
            <div className="space-y-2 mb-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">기간</span>
                <span className="text-gray-900">
                  {fee.feeType === 'MONTHLY'
                    ? `${fee.year}년 ${fee.month}월`
                    : fee.feeType === 'ANNUAL'
                      ? `${fee.year}년`
                      : '평생'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">회비 유형</span>
                <Badge variant="outline" className={getFeeTypeBadge(fee.feeType)}>
                  {getFeeTypeLabel(fee.feeType)}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">금액</span>
                <span className="text-lg font-medium text-gray-900">
                  {formatAmount(fee.amount)}
                </span>
              </div>
              {fee.paidDate && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">납부일</span>
                  <span className="text-gray-900">{formatDate(fee.paidDate)}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
              {fee.status === 'UNPAID' && (
                <div className="flex gap-2 w-full">
                  <Link
                    href={`/payment?memberId=${fee.member.id}&feeId=${fee.id}`}
                    className="flex-1"
                  >
                    <Button size="sm" variant="default" className="w-full">
                      <CreditCard className="h-3 w-3 mr-2" />
                      결제하기
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMarkPaid(fee.id)}
                    disabled={processingFees.has(fee.id) || isPending}
                    className="flex-1"
                  >
                    {processingFees.has(fee.id) ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        처리 중...
                      </>
                    ) : (
                      '납부 처리'
                    )}
                  </Button>
                </div>
              )}
              {fee.status === 'PAID' && (
                <div className="flex gap-2 w-full">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePrintFeeReceipt(fee.id)}
                    className="flex-1 text-blue-600 hover:text-blue-700 hover:border-blue-300"
                  >
                    <FileText className="h-3 w-3 mr-2" />
                    납부확인서
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleMarkUnpaid(fee.id)}
                    disabled={processingFees.has(fee.id) || isPending}
                    className="flex-1 text-red-600 hover:text-red-700 hover:border-red-300"
                  >
                    {processingFees.has(fee.id) ? (
                      <>
                        <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                        처리 중...
                      </>
                    ) : (
                      '납부 취소'
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

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

function getFeeTypeBadge(type: string) {
  switch (type) {
    case 'MONTHLY':
      return 'border-orange-200 text-orange-800 bg-orange-50'
    case 'ANNUAL':
      return 'border-indigo-200 text-indigo-800 bg-indigo-50'
    case 'LIFETIME':
      return 'border-yellow-200 text-yellow-800 bg-yellow-50'
    default:
      return 'border-gray-200 text-gray-800 bg-gray-50'
  }
}

function getStatusLabel(status: string) {
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

function getStatusBadge(status: string) {
  switch (status) {
    case 'PAID':
      return 'border-green-200 text-green-800 bg-green-50'
    case 'UNPAID':
      return 'border-red-200 text-red-800 bg-red-50'
    case 'EXEMPT':
      return 'border-gray-200 text-gray-800 bg-gray-50'
    default:
      return 'border-gray-200 text-gray-800 bg-gray-50'
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'PAID':
      return <CheckCircle className="h-3 w-3 mr-1" />
    case 'UNPAID':
      return <AlertCircle className="h-3 w-3 mr-1" />
    case 'EXEMPT':
      return <X className="h-3 w-3 mr-1" />
    default:
      return null
  }
}
