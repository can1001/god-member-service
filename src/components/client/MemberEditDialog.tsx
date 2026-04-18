'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { DaumAddressInput } from '@/components/client/DaumAddressInput'
import { Edit } from 'lucide-react'
import { getMemberDetail, updateMember, type UpdateMemberData } from '@/app/actions/members'
import { toast } from 'sonner'
import type { Member, CmsInfo, MemberFee, Donation } from '@prisma/client'

type MemberWithDetails = Member & {
  cmsInfo: CmsInfo | null
  fees: MemberFee[]
  donations: Donation[]
}

interface MemberEditDialogProps {
  memberId: number
  memberName: string
  onUpdate?: () => void
}

export function MemberEditDialog({ memberId, memberName, onUpdate }: MemberEditDialogProps) {
  const [member, setMember] = useState<MemberWithDetails | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<UpdateMemberData>({
    name: '',
    email: '',
    phone: '',
    address: '',
    church: '',
    position: '',
    smsConsent: false,
    consentMarketing: false,
    marketingChannel: null,
    isActive: true,
  })

  const handleOpen = async () => {
    setLoading(true)
    try {
      const result = await getMemberDetail(memberId)
      if (result.success && result.data) {
        setMember(result.data)
        // 폼 데이터 초기화
        setFormData({
          name: result.data.name,
          email: result.data.email,
          phone: result.data.phone,
          address: result.data.address,
          church: result.data.church || '',
          position: result.data.position || '',
          smsConsent: result.data.smsConsent,
          consentMarketing: result.data.consentMarketing,
          marketingChannel: result.data.marketingChannel,
          isActive: result.data.isActive,
        })
        setOpen(true)
      } else {
        toast.error(result.error || '회원 정보를 불러오는데 실패했습니다.')
      }
    } catch (error) {
      console.error('Error loading member detail:', error)
      toast.error('회원 정보를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const result = await updateMember(memberId, formData)

      if (result.success) {
        toast.success('회원 정보가 성공적으로 수정되었습니다.')
        setOpen(false)
        onUpdate?.()
      } else {
        toast.error(result.error || '회원 정보 수정에 실패했습니다.')
      }
    } catch (error) {
      console.error('Error updating member:', error)
      toast.error('회원 정보 수정에 실패했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const updateFormData = (field: keyof UpdateMemberData, value: string | boolean | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

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
        <Edit className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>회원 정보 수정</span>
            <span className="text-sm font-normal text-gray-500">- {memberName}</span>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : member ? (
          <div className="space-y-6">
            {/* 기본 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">기본 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">성명 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateFormData('name', e.target.value)
                    }
                    placeholder="성명을 입력하세요"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">이메일 *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateFormData('email', e.target.value)
                    }
                    placeholder="이메일을 입력하세요"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">휴대전화 *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateFormData('phone', e.target.value)
                    }
                    placeholder="휴대전화를 입력하세요"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="isActive">계정 상태</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      id="isActive"
                      checked={formData.isActive}
                      onCheckedChange={(checked: boolean) => updateFormData('isActive', checked)}
                    />
                    <label htmlFor="isActive" className="text-sm">
                      {formData.isActive ? '활성' : '비활성'}
                    </label>
                  </div>
                </div>
              </div>
              <DaumAddressInput
                value={formData.address}
                onChange={(address) => updateFormData('address', address)}
                required
                label="주소"
                placeholder="주소를 검색해주세요"
              />
            </div>

            {/* 교회 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">교회 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="church">출석교회</Label>
                  <Input
                    id="church"
                    value={formData.church}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateFormData('church', e.target.value)
                    }
                    placeholder="출석교회를 입력하세요"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">직분</Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      updateFormData('position', e.target.value)
                    }
                    placeholder="직분을 입력하세요"
                  />
                </div>
              </div>
            </div>

            {/* 연락처 설정 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">연락처 설정</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="smsConsent"
                    checked={formData.smsConsent}
                    onCheckedChange={(checked: boolean) => updateFormData('smsConsent', checked)}
                  />
                  <Label htmlFor="smsConsent">SMS 수신 동의</Label>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="consentMarketing"
                      checked={formData.consentMarketing}
                      onCheckedChange={(checked: boolean) => {
                        updateFormData('consentMarketing', checked)
                        if (!checked) {
                          updateFormData('marketingChannel', null)
                        }
                      }}
                    />
                    <Label htmlFor="consentMarketing">마케팅 정보 수신 동의</Label>
                  </div>

                  {formData.consentMarketing && (
                    <div className="ml-6 space-y-2">
                      <Label>수신 방법</Label>
                      <RadioGroup
                        value={formData.marketingChannel || ''}
                        onValueChange={(value: string) => updateFormData('marketingChannel', value)}
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="SMS" id="sms" />
                          <Label htmlFor="sms">문자</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="EMAIL" id="email" />
                          <Label htmlFor="email">이메일</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="BOTH" id="both" />
                          <Label htmlFor="both">문자 + 이메일</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 수정 불가 정보 안내 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">수정 불가 정보</h4>
              <p className="text-sm text-gray-600">
                생년월일, 성별, 회원구분, 회비유형, 가입일, 개인정보 처리 동의 내용은 보안상의
                이유로 수정할 수 없습니다. 변경이 필요한 경우 관리자에게 문의해주세요.
              </p>
            </div>
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || loading}>
            {submitting ? '수정 중...' : '수정 완료'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
