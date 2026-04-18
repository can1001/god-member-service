'use client'

import { useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { formatAmount, formatDate } from '@/lib/utils'
import { markFeePaid, markFeeUnpaid } from '@/app/actions/fees'
import { toast } from 'sonner'
import type { MemberFee } from '@prisma/client'

interface FeeDetailDialogProps {
  fee: MemberFee | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate?: () => void
}

export function FeeDetailDialog({ fee, open, onOpenChange, onUpdate }: FeeDetailDialogProps) {
  const [isPending, startTransition] = useTransition()

  if (!fee) return null

  const handlePayment = () => {
    startTransition(async () => {
      const result = await markFeePaid(fee.id)
      if (result.success) {
        toast.success('납부 처리가 완료되었습니다.')
        onUpdate?.()
        onOpenChange(false)
      } else {
        toast.error(result.error || '납부 처리에 실패했습니다.')
      }
    })
  }

  const handleCancel = () => {
    startTransition(async () => {
      const result = await markFeeUnpaid(fee.id)
      if (result.success) {
        toast.success('납부 취소가 완료되었습니다.')
        onUpdate?.()
        onOpenChange(false)
      } else {
        toast.error(result.error || '납부 취소에 실패했습니다.')
      }
    })
  }

  const getStatusLabel = (status: string) => {
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

  const getStatusBadge = (status: string) => {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>회비 상세</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">기간</span>
              <p className="font-medium">
                {fee.year}년 {fee.month ? `${fee.month}월` : '연납'}
              </p>
            </div>
            <div>
              <span className="text-gray-500">금액</span>
              <p className="font-medium">{formatAmount(fee.amount)}</p>
            </div>
            <div>
              <span className="text-gray-500">상태</span>
              <p>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(fee.status)}`}
                >
                  {getStatusLabel(fee.status)}
                </span>
              </p>
            </div>
            {fee.paidDate && (
              <div>
                <span className="text-gray-500">납부일</span>
                <p className="font-medium">{formatDate(fee.paidDate)}</p>
              </div>
            )}
          </div>

          {fee.status !== 'EXEMPT' && (
            <div className="flex gap-2 pt-4 border-t">
              {fee.status === 'UNPAID' && (
                <Button className="flex-1" onClick={handlePayment} disabled={isPending}>
                  {isPending ? '처리 중...' : '납부 처리'}
                </Button>
              )}
              {fee.status === 'PAID' && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleCancel}
                  disabled={isPending}
                >
                  {isPending ? '처리 중...' : '납부 취소'}
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
