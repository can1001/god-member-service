'use client'

import { ReactNode, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createDonation, updateDonation } from '@/app/actions/donations'
import { toast } from 'sonner'

interface DonationFormData {
  donorName: string
  donorType: 'MEMBER' | 'INDIVIDUAL' | 'CORPORATE'
  amount: string
  date: string
  purpose: 'GENERAL' | 'SCHOLARSHIP' | 'OPERATION' | 'WELFARE' | 'PROGRAM'
  note: string
  memberId: string
}

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
}

interface DonationDialogProps {
  children: ReactNode
  donation?: Donation
}

const initialFormData: DonationFormData = {
  donorName: '',
  donorType: 'INDIVIDUAL',
  amount: '',
  date: new Date().toISOString().split('T')[0],
  purpose: 'GENERAL',
  note: '',
  memberId: '',
}

export function DonationDialog({ children, donation }: DonationDialogProps) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState<DonationFormData>(
    donation
      ? {
          donorName: donation.donorName,
          donorType: donation.donorType as 'MEMBER' | 'INDIVIDUAL' | 'CORPORATE',
          amount: donation.amount.toString(),
          date: new Date(donation.date).toISOString().split('T')[0],
          purpose: donation.purpose as
            | 'GENERAL'
            | 'SCHOLARSHIP'
            | 'OPERATION'
            | 'WELFARE'
            | 'PROGRAM',
          note: donation.note || '',
          memberId: donation.memberId?.toString() || '',
        }
      : initialFormData
  )

  const isEdit = !!donation

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 폼 검증
    if (!formData.donorName.trim()) {
      toast.error('후원자명을 입력해주세요.')
      return
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('유효한 금액을 입력해주세요.')
      return
    }

    setSubmitting(true)

    try {
      const submitData = {
        donorName: formData.donorName.trim(),
        donorType: formData.donorType,
        amount: parseInt(formData.amount),
        date: new Date(formData.date),
        purpose: formData.purpose,
        note: formData.note.trim() || null,
        memberId: formData.memberId ? parseInt(formData.memberId) : null,
      }

      const result = isEdit
        ? await updateDonation(donation!.id, submitData)
        : await createDonation(submitData)

      if (result.success) {
        toast.success(`후원금이 성공적으로 ${isEdit ? '수정' : '등록'}되었습니다.`)
        setOpen(false)
        if (!isEdit) {
          setFormData(initialFormData)
        }
      } else {
        toast.error(result.error || `후원금 ${isEdit ? '수정' : '등록'}에 실패했습니다.`)
      }
    } catch (error) {
      console.error('Error submitting donation:', error)
      toast.error(`후원금 ${isEdit ? '수정' : '등록'} 중 오류가 발생했습니다.`)
    } finally {
      setSubmitting(false)
    }
  }

  const updateFormData = (field: keyof DonationFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <div onClick={() => setOpen(true)}>{children}</div>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? '후원금 수정' : '후원금 등록'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 후원자 정보 */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold border-b pb-2">후원자 정보</h3>

            <div className="space-y-2">
              <Label htmlFor="donorName">후원자명 *</Label>
              <Input
                id="donorName"
                value={formData.donorName}
                onChange={(e) => updateFormData('donorName', e.target.value)}
                placeholder="후원자명을 입력하세요"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="donorType">후원자 구분 *</Label>
              <select
                id="donorType"
                name="donorType"
                value={formData.donorType}
                onChange={(e) => updateFormData('donorType', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="INDIVIDUAL">개인</option>
                <option value="MEMBER">회원</option>
                <option value="CORPORATE">법인</option>
              </select>
            </div>

            {formData.donorType === 'MEMBER' && (
              <div className="space-y-2">
                <Label htmlFor="memberId">회원 ID</Label>
                <Input
                  id="memberId"
                  type="number"
                  value={formData.memberId}
                  onChange={(e) => updateFormData('memberId', e.target.value)}
                  placeholder="회원 ID를 입력하세요 (선택사항)"
                />
              </div>
            )}
          </div>

          {/* 후원 정보 */}
          <div className="space-y-4">
            <h3 className="text-base font-semibold border-b pb-2">후원 정보</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">금액 *</Label>
                <Input
                  id="amount"
                  type="number"
                  min="1"
                  value={formData.amount}
                  onChange={(e) => updateFormData('amount', e.target.value)}
                  placeholder="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">후원일 *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => updateFormData('date', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">후원 목적 *</Label>
              <select
                id="purpose"
                name="purpose"
                value={formData.purpose}
                onChange={(e) => updateFormData('purpose', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="GENERAL">일반기금</option>
                <option value="SCHOLARSHIP">장학금</option>
                <option value="OPERATION">운영비</option>
                <option value="WELFARE">복지사업</option>
                <option value="PROGRAM">프로그램</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">비고</Label>
              <Textarea
                id="note"
                value={formData.note}
                onChange={(e) => updateFormData('note', e.target.value)}
                placeholder="추가 메모사항이 있으면 입력하세요"
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={submitting}
            >
              취소
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? `${isEdit ? '수정' : '등록'} 중...`
                : `${isEdit ? '수정' : '등록'} 완료`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
